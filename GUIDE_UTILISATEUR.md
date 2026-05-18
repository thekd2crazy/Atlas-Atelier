# Guide utilisateur — Atlas-Atelier

Atlas-Atelier est l'outil interne de gestion d'atelier de Neurogreen : inventaire des composants, projets, BOM (bill of materials) et recherche intelligente (texte + image).

---

## 1. Accès à l'application

- **En local (réseau atelier)** : <http://172.16.36.177:3000>
- **En développement** : <http://localhost:3000> (frontend) / <http://localhost:8000/docs> (API)

Aucune authentification : l'application est accessible à tout poste connecté au LAN.

---

## 2. Vue d'ensemble de la barre de navigation

| Lien | Rôle |
|------|------|
| **Home** | Page d'accueil et présentation |
| **Search** | Recherche d'un composant par texte ou par photo |
| **Stock** | Liste, ajout, modification, suppression de composants |
| **Dashboard** | Zone d'import de fichiers (CSV/Excel) |
| **Project** | Suivi des projets et de leurs BOM |

---

## 3. Gérer le stock (`/stock`)

### Consulter
- Tableau listant **Nom**, **Catégorie**, **Référence**, **Emplacement**, **Quantité**, **Prix**, **Photo**.
- **Barre de recherche** : filtre instantané sur nom et référence.
- **Filtre catégorie** : *Mécanique, Électronique, Consommable, Outil, Entretien*.
- Deux compteurs en haut : total de composants et nombre de catégories utilisées.

### Ajouter un composant
1. Bouton **« Créer un Composant »** en haut à droite.
2. Remplir le formulaire :
   - Champs obligatoires : **Nom**, **Référence**, **Catégorie**, **Prix**, **Quantité**, **Emplacement**.
   - Champs optionnels : URL de photo, description.
3. **Enregistrer**. Si la référence existe déjà, la quantité est **incrémentée** (fusion automatique).

### Modifier ou supprimer
- Cliquer sur une ligne du tableau ouvre le dialogue d'édition.
- **Save** : met à jour tous les champs.
- **Delete** : suppression définitive (confirmation demandée).

---

## 4. Rechercher un composant (`/search`)

### Recherche texte
- Tape un **nom**, une **référence**, un **emplacement** ou un **mot-clé**.
- Filtres par catégorie disponibles (boutons pilule).
- Vues **Cartes** ou **Détails**.

### Recherche par image (IA)
1. Glisse-dépose une **image** (JPG/PNG/WebP) ou un **PDF** dans la zone (max 10 Mo, 10 fichiers).
2. Bouton **« Rechercher à partir de cette image »**.
3. Les composants visuellement similaires (CLIP + ChromaDB) sont affichés avec **nom**, **catégorie** et **emplacement**.

---

## 5. Gérer les projets (`/projets`)

### Liste
- Vue **Grille** ou **Liste** (icônes en haut à droite).
- Recherche par nom + filtres **Tous / Actifs / Archivés**.
- Cartes statistiques : total projets, actifs, budget cumulé, archivés.

### Créer un projet
1. Bouton **« Nouveau projet »**.
2. Renseigner **Nom** (obligatoire), **Budget alloué**, **Date**, **Description**.
3. Valider → le projet apparaît en statut **actif**.

### Sur chaque carte
- **Ouvrir** : accède au détail et au BOM.
- **Archiver** (icône archive) : passe le projet en lecture seule. Toute modification d'un projet archivé renvoie une erreur.
- Une **barre de progression budget** indique l'état (vert ≤ 50 %, orange ≤ 75 %, rouge au-delà).

---

## 6. Détail d'un projet et BOM (`/projets/{id}`)

Le BOM (Bill of Materials) liste les composants requis pour un projet.

### Ajouter une ligne au BOM
- Sélectionner un composant depuis le stock.
- Saisir **qte_requise** ( > 0 ).
- À la validation :
  - Le **stock** du composant est décrémenté.
  - Le **budget consommé** du projet est augmenté du coût (prix × quantité).
  - Refusé si **stock insuffisant** ou **budget dépassé**.

### Modifier une ligne
- Le système applique uniquement le **delta** de stock et de budget.
- Mêmes contrôles que pour l'ajout.

### Supprimer une ligne
- Le stock est **réintégré**.
- Le budget consommé est **diminué** du coût de la ligne.

> Un projet **archivé** ne peut plus être modifié.

---

## 7. Import en masse de composants

### Import CSV (Mouser / Farnell) — via `/dashboard`
1. Dépose le CSV exporté du fournisseur (séparateur `;`).
2. **Aperçu** : chaque ligne reçoit un statut **NOUVEAU** ou **EXISTANT**.
3. **Valider** : les références existantes voient leur quantité incrémentée ; les nouvelles sont créées avec catégorie *Import* et emplacement *Bureau*.

Colonnes attendues (au moins) :
- `Reference` ou `Mouser Part No`
- `Description` ou `Nom`
- `Prix`
- `Quantite` ou `Qty`

### Import Excel (administrateur)
Lancé manuellement sur le serveur :

```bash
cd backend
python scripts/import_excel_to_db.py --excel ..\Inventaire_Electronique.xlsx --db data\atelier.db --wipe none
```

Colonnes requises : `nom`, `reference`. Optionnelles : `categorie`, `description`, `quantite`, `emplacement`, `prix`, `photo_url`.

---

## 8. Bonnes pratiques

- **Référence unique** par composant — ne jamais réutiliser une référence pour deux pièces différentes.
- **Budget alloué** dès la création du projet : c'est la garde-fou qui bloque les ajouts BOM en cas de dépassement.
- **Archiver** un projet une fois terminé pour figer ses chiffres et libérer la vue active.
- **Photo** : une URL d'image améliore beaucoup la recherche par image.

---

## 9. Dépannage rapide

| Symptôme | À vérifier |
|----------|-----------|
| Liste de composants vide | Backend joignable ? Voir <http://172.16.36.177:8000/docs> |
| « Stock insuffisant » à l'ajout au BOM | Augmenter la quantité dans Stock ou réduire `qte_requise` |
| « Budget dépassé » | Augmenter le budget alloué du projet ou retirer une ligne BOM |
| Projet impossible à modifier | Il est probablement **archivé** — désarchiver côté admin |
| Recherche image sans résultat | Vérifier que des composants ont une `photo_url` indexée |

---

## 10. Sauvegardes

Les bases SQLite et ChromaDB sont sauvegardées **chaque jour à 17 h** sur la clé USB de l'atelier (`/media/neurogreen/PHILIPS UFD/`). Journal : `/home/neurogreen/backup.log`.

---

*Pour toute question fonctionnelle ou anomalie persistante, contacter l'équipe technique Neurogreen.*
