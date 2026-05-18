# Passation technique — Ingestion & Recherche IA

Ce document explique **comment fonctionnent réellement** l'ingestion des composants, la recherche par image et la recherche par texte côté backend. Il s'adresse à la personne qui reprendra le projet : il décrit le *pourquoi* des choix, les fichiers à modifier, et les pièges connus.

> Tout ce qui touche aux APIs CRUD (composants, projets, BOM) est documenté dans `readme_backend.md`. **Ce fichier-ci se concentre sur la partie IA / vector store**, volontairement omise du README métier.

---

## 1. Vue d'ensemble

```
┌────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Next.js)                        │
│   /search   →   POST /api/search (Next route)                      │
│                       │                                            │
└───────────────────────┼────────────────────────────────────────────┘
                        ▼
┌────────────────────────────────────────────────────────────────────┐
│                       BACKEND (FastAPI)                            │
│                                                                    │
│   POST /composants          ─────► SQLite + ChromaDB (sync)        │
│   PUT  /composants/{id}     ─────► SQLite + ChromaDB (sync)        │
│   DELETE /composants/{id}   ─────► SQLite + ChromaDB (sync)        │
│   POST /ingestion           ─────► réindexe TOUT le stock          │
│                                                                    │
│   POST /recherche/image     ─────► CLIP (image)   → ChromaDB query │
│   POST /recherche/texte     ─────► Ollama LLM     → SQL filter     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
            │                                       │
            ▼                                       ▼
   ┌──────────────────┐                  ┌────────────────────┐
   │  SQLite          │                  │   ChromaDB         │
   │  data/atelier.db │                  │   data/chromadb/   │
   │  vérité métier   │                  │   embeddings CLIP  │
   └──────────────────┘                  └────────────────────┘
```

**Deux sources de vérité distinctes**, synchronisées manuellement à chaque mutation :
- **SQLite** : composants, projets, BOM, budgets, stock — métier.
- **ChromaDB** : 1 vecteur par composant qui a au moins une `photo_url` valide — utilisé **uniquement** pour la recherche par image.

La recherche **texte** n'utilise PAS ChromaDB. Elle utilise Ollama pour extraire des critères puis fait un `LIKE` SQL.

---

## 2. Stack et fichiers clés

| Fichier | Rôle |
|---------|------|
| `backend/main.py` | Toutes les routes FastAPI + logique d'ingestion (`ingest()`) + recherches |
| `backend/clip_utils.py` | Embeddings CLIP (`embed_image`, `embed_image_url`, `embed_text`) |
| `backend/models.py` | Modèles SQLAlchemy (Composant, Projet, BOM) |
| `backend/schemas.py` | Schémas Pydantic — voir `RechercheTexteRequest`, `RechercheTexteCriteres` |
| `backend/database.py` | Engine + session SQLAlchemy |
| `backend/data/atelier.db` | Base SQLite (créée au 1er démarrage depuis `schema.sql`) |
| `backend/data/chromadb/` | Store persistant ChromaDB |
| `backend/requirements.txt` | Dépendances Python (CLIP via Git, chromadb, torch, etc.) |

### Modèles utilisés
- **CLIP `ViT-B/32`** (OpenAI) chargé une seule fois au démarrage de l'app (`clip_utils.py:8`). Tourne sur **CPU** si pas de GPU dispo (Raspberry Pi en prod). Sortie : vecteur 512-d normalisé.
- **Ollama** (LLM local) — modèle `gemma3n:e2b` par défaut. URL et modèle pilotés par variables d'env :
  - `OLLAMA_URL` (défaut `http://localhost:11434` ; en Docker `http://host.docker.internal:11434`)
  - `OLLAMA_MODEL` (défaut `gemma3n:e2b`)
  - `OLLAMA_TIMEOUT` (défaut 300 s)

---

## 3. Ingestion dans ChromaDB

Le but de l'ingestion est de remplir la collection `components` avec **un vecteur par composant**, indexé par `id_composant`. Ce vecteur est la **moyenne d'un embedding image et d'un embedding texte**.

### 3.1 Recette de l'embedding (la formule)

Pour chaque composant à indexer (`main.py:88-114` et `main.py:470-525`) :

```
urls            = composant.photo_url.split(",")           # 1..N URLs
image_embs      = [embed_image_url(u) for u in urls]       # 512-d chacun
image_emb       = mean(image_embs)                          # moyenne par composant
text_emb        = embed_text(f"{nom} {categorie}")         # 512-d
embedding_final = (image_emb + text_emb) / 2               # 512-d
```

**Pourquoi cette moyenne ?** CLIP plonge image et texte dans le même espace. En faisant la moyenne, un composant indexé est trouvable **soit** par une photo similaire, **soit** par une description proche. Au prix d'une dilution — c'est un compromis simple.

Les **métadonnées** stockées avec le vecteur (pour pouvoir renvoyer un résultat exploitable au frontend sans rappeler SQLite) :

```python
{"nom": ..., "categorie": ..., "emplacement": ...}
```

`id_composant` (stringifié) sert d'`id` ChromaDB → c'est lui qui permet d'`update`/`delete` plus tard.

### 3.2 Quand l'ingestion se déclenche

| Trigger | Code | Comportement |
|---------|------|--------------|
| `POST /composants` | `main.py:88-118` | Si `photo_url` présent, indexe immédiatement |
| `PUT /composants/{id}` | `main.py:174-205` | **`collection.update()`** (et non `add`) |
| `DELETE /composants/{id}` | `main.py:145-148` | `collection.delete(ids=[str(id)])` |
| `POST /ingestion` | `main.py:527-530` | Réindexe **tout le stock** en batch, **skip** ceux déjà présents |
| Imports CSV / Excel | `main.py:645-658` et `scripts/import_excel_to_db.py` | **N'indexent PAS dans Chroma**. Il faut appeler `POST /ingestion` après. |

> **Piège n°1** : si quelqu'un ajoute une `photo_url` après coup via `PUT`, le code fait bien `collection.update`. Mais l'`update` Chroma échoue silencieusement si l'`id` n'existait pas encore. Si un composant a été créé sans photo puis qu'on en ajoute une, il faut relancer `/ingestion` ou supprimer/recréer.

### 3.3 Le endpoint `POST /ingestion`

Idempotent : il liste les composants en base, et pour chacun :
1. `collection.get(ids=[id])` → s'il existe déjà dans Chroma, on saute.
2. Sinon, s'il a au moins une URL d'image valide, on calcule l'embedding et on ajoute.

C'est ce qui sert de **rattrapage** après un import massif ou une restauration de DB.

### 3.4 Limites et gotchas

- **Pas de revérification de péremption**. Si une `photo_url` change mais que l'id existe déjà dans Chroma, `/ingestion` ne refait pas le calcul. Il faut passer par `PUT /composants/{id}` (qui appelle `collection.update`).
- **`requests.get(image_url)` sans timeout** (`clip_utils.py:11`). Une URL morte peut bloquer une requête. À durcir si nécessaire (`timeout=10`).
- **Téléchargement séquentiel** des images. Pour quelques centaines de composants ça passe. Au-delà, paralléliser avec `concurrent.futures.ThreadPoolExecutor`.
- **Pas de gestion des doublons d'URL** : si la même image est listée deux fois dans `photo_url`, elle est téléchargée deux fois.

---

## 4. Recherche par image

### 4.1 Flux complet

```
Frontend (/search) ──fichier──▶ /api/search (Next route)
                                       │
                                       ▼
                            POST /recherche/image (FastAPI)
                                       │
                                       ▼
                  Sauvegarde temporaire : temp_<uuid>.jpg
                                       │
                                       ▼
                     embed_image(temp_path) → vecteur 512-d
                                       │
                                       ▼
                  collection.query(query_embeddings=[v], n_results=5)
                                       │
                                       ▼
                       Suppression du fichier temporaire
                                       │
                                       ▼
                        Retourne results["metadatas"]
```

Côté frontend (`frontend/app/search/page.tsx:150-181`), on envoie le **premier fichier** du dropzone en `multipart/form-data`. La route Next (`frontend/app/api/search/route.ts`) **proxy** vers FastAPI avec la variable `BACKEND_URL` (fallback `VITE_API_URL`, fallback `http://localhost:8000`).

### 4.2 Détails d'implémentation

- L'image envoyée est embeddée avec `embed_image` (fichier local) — **pas** `embed_image_url`. C'est la même fonction CLIP, juste avec une autre source.
- L'embedding de la **requête** n'est *que* l'embedding image (pas de moyenne avec un texte). Ça matche l'embedding **moyenné** stocké en base — c'est moins précis qu'un pur image-vs-image, mais ça fonctionne car CLIP est multi-modal.
- Distance utilisée : **par défaut Chroma utilise L2** sur les embeddings. Comme les vecteurs sont normalisés (`/= norm` dans `clip_utils.py`), L2 ≈ cosinus. **Aucun seuil** n'est appliqué côté backend — il renvoie les 5 plus proches même si tout est très lointain.

### 4.3 Limites

- **Pas de score retourné**. Le frontend ne peut pas dire « ce résultat est faible ». Si on veut afficher la confiance, ajouter `include=["distances"]` dans le `collection.query`.
- **`n_results=5` en dur** (`main.py:543`). Paramétrer si besoin.
- **Fichier temporaire à la racine** du process. En cas de crash entre `open()` et `os.remove()`, le fichier reste. Pas grave en prod (volume Docker), mais à savoir.

---

## 5. Recherche par texte

**ATTENTION : la recherche texte ne touche pas du tout à ChromaDB.** Elle utilise un LLM **uniquement** pour faire de l'extraction d'entités, puis interroge SQLite via SQLAlchemy. Le nom du endpoint (`/recherche/texte`) peut induire en erreur — c'est de la recherche **structurée assistée par LLM**, pas du retrieval sémantique.

### 5.1 Flux complet

```
Client ──{"query": "condensateur 100µF CMS pour Scanner NO2"}──▶ POST /recherche/texte
                                                                     │
                                                                     ▼
                                  Ollama (gemma3n) extrait un JSON de critères :
                                  {
                                    "categorie": "condensateur",
                                    "valeur":    "100µF",
                                    "boitier":   "CMS",
                                    "projet":    "Scanner NO2"
                                  }
                                                                     │
                                                                     ▼
                                  Construction d'une requête SQLAlchemy :
                                    - clauses OR sur nom (split par mots)
                                    - clauses OR sur (nom, categorie, reference,
                                      emplacement, description) pour chaque critère
                                    - si "projet" : JOIN BOM → Projet et filtre
                                      sur projet.nom ILIKE %xxx%
                                                                     │
                                                                     ▼
                                  Retourne List[ComposantRechercheItem]
                                  (nom, reference, emplacement, quantite)
```

### 5.2 Le prompt Ollama

Défini en dur dans `main.py:550-559` (variable `EXTRACTION_PROMPT`). Quatre clés extraites : `categorie`, `valeur`, `boitier`, `projet`. Demande explicitement du JSON, et le client utilise `format: "json"` pour forcer Ollama à respecter.

### 5.3 La requête SQL construite

Voir `main.py:577-615`. Logique :

1. Toujours : on découpe la `query` brute en mots et on ajoute un `ILIKE %mot%` sur `nom` pour chaque mot **et** sur la phrase entière. Cela garantit qu'une requête sans critère structuré renvoie quand même quelque chose.
2. Pour chaque critère **non-null** parmi `categorie`, `valeur`, `boitier` : OR sur 5 colonnes (`nom`, `categorie`, `reference`, `emplacement`, `description`).
3. Si `projet` est extrait : jointure `composants → bom_lignes → projets` et filtre sur le nom du projet.
4. Toutes les clauses sont combinées par **OR** (`q.filter(or_(*clauses)).distinct()`).

### 5.4 Conséquences à connaître

- **Disjonction, pas conjonction.** « condensateur 100µF » ramène tout ce qui contient *condensateur* OU *100µF*. À voir s'il faut basculer en AND.
- **Si Ollama est down**, l'endpoint **plante** (`response.raise_for_status()` dans `extract_criteres_from_ollama`). Pas de fallback "texte brut". Le frontend doit gérer le 500.
- **Timeout 300 s** : c'est très long. Sur Raspberry Pi avec un petit modèle, une requête peut quand même prendre 5-15 s. Pour de l'UX temps réel, soit utiliser un modèle plus petit, soit débrancher Ollama et ne garder que le `LIKE` sur la query brute.
- **Pas de pagination** ; pas de tri par pertinence ; pas de scoring.

---

## 6. ChromaDB en pratique

### 6.1 Persistance
```python
client = chromadb.PersistentClient(path="./data/chromadb")
collection = client.get_or_create_collection(name="components")
```
Le dossier `backend/data/chromadb/` est monté dans le volume Docker (`docker-compose.yaml:11`) → survit aux redémarrages.

### 6.2 Inspecter / debugger
```python
# Dans un shell Python depuis backend/
import chromadb
c = chromadb.PersistentClient(path="./data/chromadb")
col = c.get_or_create_collection("components")
print(col.count())              # nb de vecteurs
print(col.get(limit=5))         # 5 premiers
print(col.peek())               # idem
col.delete(ids=["42"])          # supprimer manuellement un id
```

### 6.3 Reset complet
```bash
# arrêter le backend
rm -rf backend/data/chromadb/*
# relancer
curl -X POST http://localhost:8000/ingestion
```

### 6.4 Sauvegarde
`backup.sh` (sur le RPi) tar les deux dossiers `data/atelier.db` et `data/chromadb/` vers la clé USB chaque jour à 17h.

---

## 7. Variables d'environnement

| Variable | Défaut | Où la régler |
|---------|--------|--------------|
| `OLLAMA_URL` | `http://localhost:11434` (dev) / `http://host.docker.internal:11434` (Docker) | `docker-compose.yaml` env |
| `OLLAMA_MODEL` | `gemma3n:e2b` | `docker-compose.yaml` env |
| `OLLAMA_TIMEOUT` | `300` | env du process |
| `BACKEND_URL` (frontend) | `http://localhost:8000` | `.env` Next.js |
| `VITE_API_URL` (frontend) | — | fallback alternatif |

> En prod sur le RPi, Ollama tourne **sur l'hôte** (pas dans un container). Le backend dans Docker l'atteint via `host.docker.internal` grâce à `extra_hosts: host-gateway` dans `docker-compose.yaml`.

---

## 8. Pour faire évoluer le système

Quelques pistes courantes selon le besoin :

### a. Améliorer la recherche image
- Stocker **2 vecteurs** par composant (image pure + texte pure) au lieu de la moyenne, puis interroger l'un ou l'autre selon le contexte. Nécessite 2 collections Chroma ou un `where_metadata`.
- Réindexer en **CLIP ViT-L/14** (plus précis, plus lourd) — passer `clip.load("ViT-L/14")` dans `clip_utils.py`.
- Renvoyer les **distances** pour permettre un seuil côté front.

### b. Améliorer la recherche texte
- Remplacer le LLM Ollama par un **embedding model** (ex. `all-MiniLM-L6-v2` via `sentence-transformers`) → recherche sémantique vraie sur une nouvelle collection Chroma.
- Garder Ollama mais combiner sa sortie avec un **scoring BM25** sur SQLite (lib `sqlite-fts`).
- Basculer les clauses de `OR` à `AND` pour les requêtes précises.

### c. Robustesse ingestion
- Mettre l'indexation Chroma dans une **tâche de fond** (`BackgroundTasks` de FastAPI) pour ne pas bloquer la requête HTTP qui crée le composant.
- Logger les erreurs Chroma dans un fichier au lieu de `print`.
- Ajouter un endpoint `POST /reindex/{id_composant}` pour réindexer ponctuellement.

### d. Imports CSV/Excel
Aujourd'hui ils n'appellent pas Chroma. Pour ne pas oublier, soit :
- Appeler `ingest()` automatiquement à la fin de `valider_import` (`main.py:646`),
- Soit afficher dans le front un bouton « Réindexer maintenant » qui poste sur `/ingestion`.

---

## 9. Mise en route locale (rappel)

```bash
# 1. Backend
cd backend
python -m venv .venv
.venv\Scripts\activate                          # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 2. Ollama (à part, sur l'hôte)
ollama serve
ollama pull gemma3n:e2b

# 3. Frontend
cd frontend
npm install
npm run dev
```

Premier lancement : la DB SQLite est créée depuis `schema.sql`, ChromaDB est vide. Pour peupler la collection vectorielle après l'import des composants : `curl -X POST http://localhost:8000/ingestion`.

---

## 10. Récap des pièges connus

1. **CSV/Excel n'indexent pas Chroma** → ne jamais oublier `/ingestion` après un import en masse.
2. **`requests.get` sans timeout** dans `embed_image_url` → URL morte = requête HTTP qui peut traîner. À durcir.
3. **Ajout de `photo_url` après création** sans déclencher de PUT → composant invisible à la recherche image.
4. **Ollama down = recherche texte HS** (pas de fallback).
5. **`n_results=5` en dur** sur la recherche image.
6. **Pas de seuil de distance** → on renvoie 5 résultats même si l'image n'a rien à voir.
7. **Clauses SQL en OR** → résultats parfois trop larges sur une requête multi-critères.

---

*Document rédigé en mai 2026 pour la passation. Source de vérité : le code dans `backend/main.py` et `backend/clip_utils.py`. En cas de divergence, le code prime.*
