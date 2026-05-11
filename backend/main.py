from fastapi import FastAPI, Depends, HTTPException, Response, status , UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_
import sqlite3
import os
import json
import requests
import chromadb
from clip_utils import embed_image , embed_text, embed_image_url
from rapidfuzz import fuzz
import csv
import io

from database import SessionLocal, engine
import models
import schemas 

import shutil
import uuid

app = FastAPI(title="Atlas Atelier API")
client = chromadb.PersistentClient(path="./data/chromadb")
collection = client.get_or_create_collection(name="components")

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "gemma3n:e2b")
OLLAMA_TIMEOUT = int(os.environ.get("OLLAMA_TIMEOUT", "300"))

#INITIALISATION DE LA DB DEPUIS SCHEMA.SQL
def init_db():
    if not os.path.exists("data/atelier.db"):
        # Si le fichier .db n'existe pas, on le crée en lisant le schema.sql
        with sqlite3.connect("data/atelier.db") as conn:
            with open("schema.sql", "r", encoding="utf-8") as f:
                conn.executescript(f.read())
        print("Base de données initialisée depuis schema.sql !")

init_db()

# Dépendance pour obtenir une session DB pour chaque requête
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def projet_modif_validation(projet):
    if projet.statut == "archive":
        raise HTTPException(status_code=409, detail="Les projets archivés sont non modifiables (Lecture seule)")
    
    return

#nos endpoints


# Composants

@app.post("/composants", response_model=schemas.ComposantResponse)
def create_composant(composant: schemas.ComposantCreate, db: Session = Depends(get_db)):
    # On crée l'objet avec TOUTES les nouvelles colonnes

    existant = db.query(models.Composant).filter(models.Composant.reference == composant.reference).first()

    if existant:
        existant.quantite += composant.quantite
        if composant.description is not None:
            existant.description = composant.description
        db.commit()
        db.refresh(existant)

        return existant

    nouveau_composant = models.Composant(
        nom=composant.nom,
        reference=composant.reference,
        categorie=composant.categorie,
        prix=composant.prix,
        emplacement=composant.emplacement,
        quantite=composant.quantite, 
        photo_url=composant.photo_url,
        description=composant.description
    )
    
    db.add(nouveau_composant)
    db.commit()
    db.refresh(nouveau_composant) #On récupère l'ID généré
    if nouveau_composant.photo_url:
         try:
            urls = [u.strip() for u in nouveau_composant.photo_url.split(",") if u.strip()]
       
            image_embs = []
            for url in urls:
                try:
                    image_embs.append(embed_image_url(url))
                except Exception as e:
                    print(f"ERREUR embed_image_url ({url}) :", e)

            if not image_embs:
                print(f"Chroma skip: aucune image valide pour le composant {nouveau_composant.id_composant}")
            else:
                      image_emb = sum(image_embs) / len(image_embs)
                      desc = f"{nouveau_composant.nom} {nouveau_composant.categorie}"
      
                      emb = (image_emb + embed_text(desc)) / 2
                      collection.add(
                          ids=[str(nouveau_composant.id_composant)],
                          embeddings=[emb.tolist()],
                          metadatas=[{
                              "nom": nouveau_composant.nom,
                              "categorie": nouveau_composant.categorie,
                              "emplacement": nouveau_composant.emplacement
                          }]
                      )
         except Exception as e:
                  print("ERREUR Chroma / embeddings :", e)
    else:
              print("Chroma skip: photo_url manquant pour le composant", nouveau_composant.id_composant)
    return nouveau_composant

 

@app.get("/composants", response_model=list[schemas.ComposantResponse])
def read_all_composants(db: Session = Depends(get_db)):
    # Récupère tous les composants dans la table
    composants = db.query(models.Composant).all()
    return composants

@app.get("/composants/{id_composant}", response_model=schemas.ComposantResponse)
def read_composant(id_composant: int ,db: Session = Depends(get_db)):
    composant = db.query(models.Composant).filter(models.Composant.id_composant == id_composant).first()
    if composant is None:
        raise HTTPException(status_code=404, detail="Composant non trouvé")
    return composant

@app.delete("/composants/{id_composant}", response_model=schemas.ComposantResponse)
def delete_composant(id_composant: int ,db: Session = Depends(get_db)):
    composant = db.query(models.Composant).filter(models.Composant.id_composant == id_composant).first()
    if composant is None:
        raise HTTPException(status_code=404, detail="Composant non trouvé")
    
    db.delete(composant)
    db.commit()

    try:
        collection.delete(ids=[str(id_composant)])
    except Exception as e:
        print("ERREUR Chroma delete :", e)
    return composant


@app.put("/composants/{id_composant}", response_model=schemas.ComposantResponse)
# 1. On ajoute "composant_update" pour recevoir les nouvelles données
def update_composant(id_composant: int, composant_update: schemas.ComposantCreate, db: Session = Depends(get_db)):
    # 2. On cherche le composant existant
    composant = db.query(models.Composant).filter(models.Composant.id_composant == id_composant).first()
    if composant is None:
        raise HTTPException(status_code=404, detail="Composant non trouvé")
    
    # 3. On modifie directement ses attributs
    composant.nom = composant_update.nom
    composant.reference = composant_update.reference
    composant.categorie = composant_update.categorie
    composant.prix = composant_update.prix
    composant.emplacement = composant_update.emplacement
    composant.quantite = composant_update.quantite
    composant.photo_url = composant_update.photo_url
    composant.description = composant_update.description
    
    # 4. On valide les changements dans la base 
    db.commit()
    db.refresh(composant)

    if composant.photo_url:
        try:
            #5. Modification dans chromaDB
            urls = [u.strip() for u in composant.photo_url.split(",") if u.strip()]

            image_embs = []
            for url in urls:
                try:
                    image_embs.append(embed_image_url(url))
                except Exception as e:
                    print(f"ERREUR embed_image_url ({url}) :", e)

            if not image_embs:
                print(f"Chroma skip: aucune image valide pour le composant {id_composant}")
            else:
                image_emb = sum(image_embs) / len(image_embs)
                desc = f"{composant.nom} {composant.categorie}"

                emb = (image_emb + embed_text(desc)) / 2
                collection.update(
                    ids=[str(id_composant)],
                    embeddings=[emb.tolist()],
                    metadatas=[{
                        "nom": composant.nom,
                        "categorie": composant.categorie,
                        "emplacement": composant.emplacement
                    }]
                )
        except Exception as e :
            print("ERREUR Chroma / embeddings :", e)
    else:
        print("Chroma skip: photo_url manquant pour le composant", id_composant)
    
    return composant

# Projets

@app.post("/projets", response_model=schemas.ProjetResponse)
def create_projet(projet: schemas.ProjetCreate, db: Session = Depends(get_db)):
    nouveau_projet = models.Projet(
        nom=projet.nom,
        budget_alloue=projet.budget_alloue,
        description=projet.description,
        date=projet.date,
        # On force les valeurs par défaut ici au cas où
        budget_consomme=0.0, 
        statut="actif"
    )
    db.add(nouveau_projet)
    db.commit()
    db.refresh(nouveau_projet)
    return nouveau_projet

@app.get("/projets", response_model=list[schemas.ProjetResponse])
def read_all_projets(db: Session = Depends(get_db)):
    return db.query(models.Projet).all()

@app.get("/projets/actif", response_model=list[schemas.ProjetResponse])
def read_actives_projets(db: Session = Depends(get_db)):
    return db.query(models.Projet).filter(models.Projet.statut == "actif").all()

@app.get("/projets/archive", response_model=list[schemas.ProjetResponse])
def read_archive_projets(db: Session = Depends(get_db)):
    return db.query(models.Projet).filter(models.Projet.statut == "archive").all()

@app.get("/projets/{id_projet}", response_model=schemas.ProjetResponse)
def read_projet(id_projet: int, db: Session = Depends(get_db)):
    projet = db.query(models.Projet).filter(models.Projet.id_projet == id_projet).first()
    if projet is None:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    return projet

@app.patch("/projets/{id_projet}/archiver", response_model=schemas.ProjetResponse)
def archiver_projet(id_projet: int, db: Session = Depends(get_db)):
    projet = db.query(models.Projet).filter(models.Projet.id_projet == id_projet).first()
    if projet is None:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    projet.statut = "archive"
    db.commit()
    db.refresh(projet)
    return projet

@app.put("/projets/{id_projet}", response_model=schemas.ProjetResponse)
def update_projet(id_projet: int, projet_update: schemas.ProjetUpdate, db: Session = Depends(get_db)):
    projet = db.query(models.Projet).filter(models.Projet.id_projet == id_projet).first()
    if projet is None:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    projet_modif_validation(projet)
    
    # On met à jour les champs
    projet.nom = projet_update.nom
    if projet_update.budget_alloue is not None:
        projet.budget_alloue = projet_update.budget_alloue
    if projet_update.description is not None:
        projet.description = projet_update.description
    if projet_update.date is not None:
        projet.date = projet_update.date
    if projet_update.statut is not None:
        projet.statut = projet_update.statut
        
    db.commit()
    db.refresh(projet)
    return projet


@app.get("/projets/{id_projet}/budget", response_model=schemas.ProjetBudget)
def read_projet_budget(id_projet: int, db: Session = Depends(get_db)):
    projet = db.query(models.Projet).filter(models.Projet.id_projet == id_projet).first()
    if projet is None:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    return projet

@app.get("/boms", response_model=list[schemas.BOMResponse])
def read_all_bom( db: Session = Depends(get_db)):
    return db.query(models.BOM).all()

@app.get("/projets/{id_projet}/bom", response_model=list[schemas.BOMResponse])
def read_projet_bom(id_projet: int, db: Session = Depends(get_db)):
    # 1. On s'assure que le projet existe bien
    projet = db.query(models.Projet).filter(models.Projet.id_projet == id_projet).first()
    if projet is None:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    # 2. On récupère toutes les lignes de la nomenclature liées à cet ID
    nomenclature = db.query(models.BOM).filter(models.BOM.projet_id == id_projet).all()
    
    return nomenclature

@app.post("/projets/{id_projet}/bom", response_model=schemas.BOMResponse)
def add_component_to_projet(id_projet: int, bom_in: schemas.BOMCreate, db: Session = Depends(get_db)):
    # 1. Vérifications
    projet = db.query(models.Projet).filter(models.Projet.id_projet == id_projet).first()
    if not projet:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    #Vérifie si le projet est modifiable
    projet_modif_validation(projet)
        
    composant = db.query(models.Composant).filter(models.Composant.id_composant == bom_in.composant_id).first()
    if not composant:
        raise HTTPException(status_code=404, detail="Composant non trouvé")

    if bom_in.qte_requise <= 0:
        raise HTTPException(status_code=400, detail="La quantité requise doit être strictement positive")

    # Empêche les doublons BOM (projet_id, composant_id)
    existing_line = db.query(models.BOM).filter(
        models.BOM.projet_id == id_projet,
        models.BOM.composant_id == bom_in.composant_id
    ).first()
    if existing_line:
        raise HTTPException(
            status_code=409,
            detail="Ligne BOM déjà existante pour ce composant. Utilisez PATCH pour modifier la quantité."
        )

    # 2. Calcul du coût de cette ligne
    cout_ligne = composant.prix * bom_in.qte_requise

    # 3. Création de la ligne BOM
    nouvelle_ligne = models.BOM(
        projet_id=id_projet,
        composant_id=bom_in.composant_id,
        qte_requise=bom_in.qte_requise,
        cout_estime=cout_ligne
    )
    
    # 4. MISE À JOUR AUTOMATIQUE DU BUDGET DU PROJET
    if projet.budget_alloue is not None and (projet.budget_consomme + cout_ligne > projet.budget_alloue):
        raise HTTPException(status_code=400, detail="Budget dépassé")
    projet.budget_consomme += cout_ligne
    
    # 5 Réduction du stock
    if composant.quantite < bom_in.qte_requise:
        raise HTTPException(status_code=400, detail="Stock insuffisant")
    composant.quantite -= bom_in.qte_requise

    db.add(nouvelle_ligne)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Ligne BOM déjà existante pour ce composant. Utilisez PATCH pour modifier la quantité."
        )
    db.refresh(nouvelle_ligne)
    
    return nouvelle_ligne

@app.delete("/projets/{id_projet}/bom/{id_composant}", response_model=schemas.BOMResponse)
def delete_projet_bom(id_projet: int ,id_composant: int, db: Session = Depends(get_db)):

     # 1. Vérifications
    projet = db.query(models.Projet).filter(models.Projet.id_projet == id_projet).first()
    if projet is None:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    #Vérifie si le projet est modifiable
    projet_modif_validation(projet)

    composant = db.query(models.Composant).filter(models.Composant.id_composant == id_composant).first()
    if not composant:
        raise HTTPException(status_code=404, detail="Composant non trouvé")

    ligne_bom = db.query(models.BOM).filter(models.BOM.projet_id == id_projet, models.BOM.composant_id== id_composant).first()

    if not ligne_bom:
        raise HTTPException(status_code=404, detail="Ligne de nomenclature introuvable")

    #LOGIQUE MÉTIER : "Remboursement" du budget et restitution du stock
    projet.budget_consomme -= ligne_bom.cout_estime
    composant.quantite += ligne_bom.qte_requise
    
    db.delete(ligne_bom)
    db.commit()
    return ligne_bom

@app.patch("/projets/{id_projet}/bom/{id_composant}", response_model=schemas.BOMResponse)
def update_projet_bom(id_projet: int, id_composant: int, bom_update: schemas.BOMUpdate, db: Session = Depends(get_db)):
    
    # 1. Vérification du projet
    projet = db.query(models.Projet).filter(models.Projet.id_projet == id_projet).first()
    if not projet:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    # Vérifie si le projet est modifiable
    projet_modif_validation(projet)

    # 2. Vérification de la ligne BOM
    ligne_bom = db.query(models.BOM).filter(
        models.BOM.projet_id == id_projet,
        models.BOM.composant_id == id_composant
    ).first()
    if not ligne_bom:
        raise HTTPException(status_code=404, detail="Ligne de nomenclature introuvable")

    # 3. Vérification du composant
    composant = db.query(models.Composant).filter(models.Composant.id_composant == id_composant).first()
    if not composant:
        raise HTTPException(status_code=404, detail="Composant non trouvé")

    if bom_update.qte_requise <= 0:
        raise HTTPException(status_code=400, detail="La quantité requise doit être strictement positive")

    # 4. LOGIQUE MÉTIER : Calcul des Deltas
    
    # Combien de composants en plus (ou en moins) avons-nous besoin ?
    delta_qte = bom_update.qte_requise - ligne_bom.qte_requise
    
    # Si on demande PLUS de composants, on vérifie le stock disponible
    if delta_qte > 0 and composant.quantite < delta_qte:
        raise HTTPException(status_code=400, detail=f"Stock insuffisant. Il ne reste que {composant.quantite} pièces.")

    # Quel est le nouveau coût total pour cette ligne ?
    nouveau_cout = composant.prix * bom_update.qte_requise
    
    # Quelle est la différence de prix avec l'ancien coût ?
    delta_cout = nouveau_cout - ligne_bom.cout_estime

    # 5. Application des mises à jour
    
    # Mise à jour du stock (si delta_qte est négatif, ça rajoutera au stock, ce qui est le but !)
    composant.quantite -= delta_qte
    
    # Mise à jour du budget (idem, si delta_cout est négatif, le budget consommé baissera)
    if projet.budget_alloue is not None and (projet.budget_consomme + delta_cout > projet.budget_alloue):
        raise HTTPException(status_code=400, detail="Budget dépassé")
    projet.budget_consomme += delta_cout
    
    # Mise à jour de la ligne BOM
    ligne_bom.qte_requise = bom_update.qte_requise
    ligne_bom.cout_estime = nouveau_cout

    # 6. Sauvegarde en base
    db.commit()
    db.refresh(ligne_bom)
    
    return ligne_bom

# IA

def get_all_composants():
    db: Session = SessionLocal()
    try:
        return db.query(models.Composant).all()
    finally:
        db.close()

def ingest():
    data = get_all_composants()

    ids = []
    embeddings = []
    metadatas = []

    for item in data:
        item_id = str(item.id_composant)

        existing = collection.get(ids=[item_id])

        if len(existing["ids"]) > 0:
            print(f"Déjà indexé: {item_id}")
            continue

        if not item.photo_url:
            print(f"Chroma skip: photo_url manquant pour le composant {item_id}")
            continue

        urls = [u.strip() for u in item.photo_url.split(",") if u.strip()]

        image_embs = []
        for url in urls:
            try:
                image_embs.append(embed_image_url(url))
            except Exception as e:
                print(f"ERREUR embed_image_url ({url}) :", e)

        if not image_embs:
            print(f"Chroma skip: aucune image valide pour le composant {item_id}")
            continue

        image_emb = sum(image_embs) / len(image_embs)
        desc = f"{item.nom} {item.categorie}"

        emb = (image_emb + embed_text(desc)) / 2

        ids.append(item_id)
        embeddings.append(emb.tolist())

        meta = {
            "nom": item.nom,
            "categorie": item.categorie,
            "emplacement": item.emplacement,
        }
        metadatas.append({k: v for k, v in meta.items() if v is not None})

    if ids:
        collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas
        )

    print("Ingestion terminée depuis la base de données")

@app.post("/ingestion", status_code=status.HTTP_204_NO_CONTENT)
def ingestion():
    ingest()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.post("/recherche/image")
async def recherche_image(file: UploadFile = File(...)):
    temp_path = f"temp_{uuid.uuid4()}.jpg"

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    emb = embed_image(temp_path)

    results = collection.query(
        query_embeddings=[emb.tolist()],
        n_results=5
    )

    os.remove(temp_path)

    return results["metadatas"]

EXTRACTION_PROMPT = """Tu extrais des critères de recherche de composants électroniques depuis une requête en français.

Renvoie UNIQUEMENT un JSON avec exactement ces clés (utilise null si non précisé) :
- "categorie": type du composant (ex: "condensateur", "résistance", "microcontrôleur", "capteur", "LED", "transistor")
- "valeur": valeur électrique (ex: "100µF", "10kΩ", "3.3V", "16MHz")
- "boitier": format/boîtier (ex: "CMS", "SMD", "0805", "0603", "DIP-8", "TO-220", "QFN")
- "projet": nom du projet associé (ex: "Scanner NO2", "Smart Totem", "UveTibi", "Tri plateau repas")
- "nom_libre": tout mot ou groupe de mots qui ressemble à un nom/référence de composant et qui ne rentre dans aucune autre clé (ex: "ESP32", "NE555", "BC547", "ATmega328P", "DHT22")

Requête : {query}
"""

def extract_criteres_from_ollama(query: str) -> dict:
    response = requests.post(
        f"{OLLAMA_URL}/api/generate",
        json={
            "model": OLLAMA_MODEL,
            "prompt": EXTRACTION_PROMPT.format(query=query),
            "format": "json",
            "stream": False,
        },
        timeout=OLLAMA_TIMEOUT,
    )
    response.raise_for_status()
    raw = response.json().get("response", "{}")
    return json.loads(raw)

RECHERCHE_TEXTE_LIMIT = 50
RECHERCHE_TEXTE_RRF_K = 60
RECHERCHE_TEXTE_FUZZ_MIN = 55  # 0..100, seuil de tolérance rapidfuzz

def _rrf_add(scores: dict, ranked_ids: list, k: int = RECHERCHE_TEXTE_RRF_K):
    for rank, cid in enumerate(ranked_ids):
        scores[cid] = scores.get(cid, 0.0) + 1.0 / (k + rank + 1)

@app.post("/recherche/texte", response_model=list[schemas.ComposantRechercheItem])
def recherche_texte(payload: schemas.RechercheTexteRequest, db: Session = Depends(get_db)):
    query = payload.query.strip()
    if not query:
        return []

    try:
        extracted = extract_criteres_from_ollama(query)
    except Exception as e:
        print(f"Ollama extraction failed: {e}")
        extracted = {}
    criteres = schemas.RechercheTexteCriteres(**extracted)

    # --- 1. Candidat SQL : large ILIKE sur termes (query brute + tokens + critères) ---
    terms = {query, *query.split()}
    for t in (criteres.categorie, criteres.valeur, criteres.boitier, criteres.nom_libre):
        if t:
            terms.add(t)
    terms = {t.strip() for t in terms if t and t.strip()}

    q = db.query(models.Composant)
    clauses = []
    for term in terms:
        pat = f"%{term}%"
        clauses.append(or_(
            models.Composant.nom.ilike(pat),
            models.Composant.categorie.ilike(pat),
            models.Composant.reference.ilike(pat),
            models.Composant.emplacement.ilike(pat),
            models.Composant.description.ilike(pat),
        ))

    if criteres.projet:
        q = (
            q.outerjoin(models.BOM, models.BOM.composant_id == models.Composant.id_composant)
             .outerjoin(models.Projet, models.Projet.id_projet == models.BOM.projet_id)
        )
        clauses.append(models.Projet.nom.ilike(f"%{criteres.projet}%"))

    sql_rows = q.filter(or_(*clauses)).distinct().all() if clauses else []
    sql_ids = [r.id_composant for r in sql_rows]

    # --- 2. Candidats sémantiques : Chroma sur l'embedding texte de la requête ---
    chroma_ids: list[int] = []
    try:
        emb = embed_text(query).tolist()
        chroma_res = collection.query(query_embeddings=[emb], n_results=RECHERCHE_TEXTE_LIMIT)
        chroma_ids = [int(cid) for cid in (chroma_res.get("ids") or [[]])[0]]
    except Exception as e:
        print(f"Chroma semantic query failed: {e}")

    # --- 3. Charger tous les candidats en une requête ---
    candidate_ids = list({*sql_ids, *chroma_ids})
    if not candidate_ids:
        return []
    rows = (
        db.query(models.Composant)
        .filter(models.Composant.id_composant.in_(candidate_ids))
        .all()
    )
    by_id = {r.id_composant: r for r in rows}

    # --- 4. Score fuzzy (rapidfuzz) sur le nom ---
    haystack_query = query.lower()
    fuzz_scores: dict[int, float] = {}
    for cid, row in by_id.items():
        name = (row.nom or "").lower()
        if not name:
            continue
        score = fuzz.token_set_ratio(haystack_query, name)
        if score >= RECHERCHE_TEXTE_FUZZ_MIN:
            fuzz_scores[cid] = score
    fuzz_ranked = sorted(fuzz_scores, key=fuzz_scores.get, reverse=True)

    # --- 5. Fusion RRF : SQL + sémantique + fuzzy ---
    rrf: dict[int, float] = {}
    _rrf_add(rrf, sql_ids)
    _rrf_add(rrf, chroma_ids)
    _rrf_add(rrf, fuzz_ranked)

    ranked = sorted(rrf, key=rrf.get, reverse=True)[:RECHERCHE_TEXTE_LIMIT]
    return [by_id[cid] for cid in ranked if cid in by_id]

# --- IMPORT CSV ---

@app.post("/composants/import/apercu", response_model=list[schemas.CSVLigneApercu])
async def upload_csv_apercu(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    reader = csv.DictReader(io.StringIO(text), delimiter=';')
    
    apercu = []
    for row in reader:
        ref = row.get("Reference") or row.get("Mouser Part No") or "SANS_REF"
        nom = row.get("Description") or row.get("Nom") or "Inconnu"
        try:
            prix = float(str(row.get("Prix", "0")).replace(',', '.').replace('€', '').strip() or 0)
        except:
            prix = 0.0
        try:
            qte = int(row.get("Quantite") or row.get("Qty", 0))
        except:
            qte = 0

        existant = db.query(models.Composant).filter(models.Composant.reference == ref).first()
        apercu.append(schemas.CSVLigneApercu(
            reference=ref, nom=nom, prix=prix, quantite=qte,
            statut="EXISTANT" if existant else "NOUVEAU"
        ))
    return apercu

@app.post("/composants/import/valider")
def valider_import(donnees: schemas.CSVImportValidation, db: Session = Depends(get_db)):
    for ligne in donnees.lignes:
        comp = db.query(models.Composant).filter(models.Composant.reference == ligne.reference).first()
        if comp:
            comp.quantite += ligne.quantite
        else:
            nouveau = models.Composant(
                nom=ligne.nom, reference=ligne.reference, prix=ligne.prix,
                quantite=ligne.quantite, categorie="Import", emplacement="Bureau"
            )
            db.add(nouveau)
    db.commit()
    return {"status": "success", "message": "Importation terminée"}