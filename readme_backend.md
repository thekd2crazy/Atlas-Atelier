# Atlas Atelier Backend

## Perimetre
Ce README documente les APIs inventaire, projets et BOM. Tout ce qui concerne l'IA ou la recherche est gere par une autre partie et est volontairement omis ici.

## Stack
- FastAPI
- SQLAlchemy + SQLite
- Pydantic
- Docker (optionnel)

## Organisation du dossier (backend)
- backend/main.py: application FastAPI et routes
- backend/database.py: engine/session SQLAlchemy
- backend/models.py: modeles ORM
- backend/schemas.py: schemas Pydantic
- backend/schema.sql: schema BD + donnees initiales
- backend/data/atelier.db: base SQLite (cree au premier demarrage)
- backend/scripts/import_excel_to_db.py: script import Excel

## Demarrage rapide (local)
Depuis le dossier backend afin que les chemins relatifs fonctionnent.

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Swagger UI: http://localhost:8000/docs

## Demarrage rapide (Docker)
Depuis la racine du repo:

```bash
docker compose up --build backend
```

Le backend est expose sur http://localhost:8000

## Base de donnees
- Fichier SQLite: backend/data/atelier.db
- Auto-init: si le fichier n'existe pas, backend/schema.sql est execute au demarrage.
- Projets seedes par schema.sql:
  - Tri plateau repas
  - Smart Totem
  - UveTibi
  - Scanner NO2

Reset BD (dev local): arreter l'API, supprimer backend/data/atelier.db, relancer.

## Modele de donnees
### composants
- id_composant (PK)
- nom (string)
- reference (unique)
- categorie (string, nullable)
- description (string, nullable)
- quantite (int)
- emplacement (string, nullable)
- prix (float)
- photo_url (string, nullable)

### projets
- id_projet (PK)
- nom (string)
- budget_alloue (float, nullable)
- budget_consomme (float, default 0)
- description (string, nullable)
- date (datetime, nullable)
- statut (actif | archive)

### bom_lignes
- projet_id (FK -> projets.id_projet, PK)
- composant_id (FK -> composants.id_composant, PK)
- qte_requise (int)
- cout_estime (float)

### mouvements_stock
- move_id (PK)
- composant_id (FK -> composants.id_composant)
- type_mouvement (ENTREE | SORTIE | AJUSTEMENT)
- quantite (int)
- date_mvt (datetime, default current timestamp)
- description (string, nullable)

Note: mouvements_stock existe dans le schema mais n'est pas encore relie a la logique API.

## Resume API
Base URL: http://localhost:8000

### Composants
- POST /composants
- GET /composants
- GET /composants/{id_composant}
- PUT /composants/{id_composant}
- DELETE /composants/{id_composant}

Comportement:
- POST fusionne par reference si le composant existe: incremente quantite et met a jour description si fournie.
- PUT remplace l'entite complete (pas de PATCH).

### Projets
- POST /projets
- GET /projets
- GET /projets/actif
- GET /projets/archive
- GET /projets/{id_projet}
- PUT /projets/{id_projet}
- PATCH /projets/{id_projet}/archiver
- GET /projets/{id_projet}/budget

### BOM (bill of materials)
- GET /boms
- GET /projets/{id_projet}/bom
- POST /projets/{id_projet}/bom
- PATCH /projets/{id_projet}/bom/{id_composant}
- DELETE /projets/{id_projet}/bom/{id_composant}

Regles metier:
- Un projet archive est en lecture seule; toute modification renvoie 409.
- POST /projets/{id}/bom
  - Refuse les doublons (409).
  - qte_requise > 0 obligatoire.
  - Decremente le stock du composant.
  - Incremente projet.budget_consomme du cout de ligne.
  - 400 si stock insuffisant ou budget depasse.
- PATCH /projets/{id}/bom/{id_composant}
  - Applique le delta stock et le delta budget.
  - 400 si stock insuffisant ou budget depasse.
- DELETE /projets/{id}/bom/{id_composant}
  - Reintegre le stock et diminue projet.budget_consomme du cout de la ligne.

## Workflow import CSV (exports Mouser/Farnell)
Import en deux etapes pour fichiers CSV:

1) Apercu
- POST /composants/import/apercu (multipart/form-data file)
- Delimiteur CSV: ';'
- Colonnes attendues (toute sous-partie si presente):
  - Reference ou Mouser Part No
  - Description ou Nom
  - Prix
  - Quantite ou Qty
- La reponse renvoie chaque ligne parsee avec statut: NOUVEAU ou EXISTANT

2) Validation
- POST /composants/import/valider
- Body:
  {
    "lignes": [
      {"reference": "...", "nom": "...", "prix": 0.0, "quantite": 0, "statut": "NOUVEAU"}
    ],
    "fournisseur": "Mouser"
  }
- References existantes: incremente quantite
- Nouvelles references: cree un composant avec categorie="Import" et emplacement="Bureau"

## Import Excel (batch)
Script: backend/scripts/import_excel_to_db.py

```bash
cd backend
python scripts/import_excel_to_db.py --excel ..\Inventaire_Electronique.xlsx --db data\atelier.db --wipe none
```

Notes:
- Colonnes requises: nom, reference
- Colonnes optionnelles: categorie, description, quantite, emplacement, prix, photo_url
- Le script fusionne les doublons par reference et peut optionnellement vider les tables.

## Depannage
- Si l'API ne demarre pas car la BD est absente, lancer depuis backend/ pour que schema.sql soit trouve.
- Pour un reset complet des donnees en dev, supprimer backend/data/atelier.db et relancer l'API.

## Perimetre fonctionnel
Ce README couvre uniquement inventaire, projets et BOM. Les endpoints IA/recherche sont documentes ailleurs.



## Déploiement

Pour déployer en production le contenu du main gitHub
- Aller dans le dossier du RPI ai-stock/Atlas-Atelier/  
- git pull 
- docker compose up -d --build

### Adresse site local :   http://172.16.36.177:3000


### Démarage automatique via Systemd

À chaque démarrage du Raspberry Pi :

- Docker démarre.
- systemd lance atlas-atelier.service.
- docker compose up -d est exécuté.
- Les conteneurs sont relancés automatiquement.
- L’application redevient accessible.

Commandes utiles:

- sudo systemctl status atlas-atelier
- sudo systemctl restart atlas-atelier
- sudo systemctl stop atlas-atelier
- sudo systemctl start atlas-atelier
- sudo journalctl -u atlas-atelier -f

## Sauvegarde db et Cron

- Les sauvegardes db sqlite et chromadb sont enregistrés dans le dossier : /media/neurogreen/PHILIPS UFD/

- Le script de sauvegarde backup.sh est contenu dans le fichier : /home/neurogreen

- Le Cron est lancé pour tous les jours à 17h  : 

- Un journal de sauvegarde est enregistré dans le fichier /home/neurogreen/backup.log

crontab -e

0 17 * * * /home/neurogreen/backup.sh >> /home/neurogreen/backup.log 2>&1