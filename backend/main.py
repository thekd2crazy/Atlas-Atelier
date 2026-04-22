from fastapi import FastAPI, Depends, HTTPException, Response, status , UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import sqlite3
import os
import chromadb
from clip_utils import embed_image , embed_text, embed_image_url
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

    collection.delete(ids=[str(id_composant)])
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

    #5. Modification dans chromaDB
    image_path = composant.photo_url
    desc = f"{composant.nom} {composant.categorie}"

    emb = (embed_image_url(image_path) + embed_text(desc)) / 2
    collection.upsert(
        ids=[str(id_composant)],
        embeddings=[emb.tolist()],
        metadatas=[{
            "nom": composant.nom,
            "categorie": composant.categorie,
            "emplacement": composant.emplacement
        }]
    )
    
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

    if not nomenclature:
        raise HTTPException(status_code=404, detail="Nomenclature introuvable")
    
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

        image_path = item.photo_url
        desc = f"{item.nom} {item.categorie}"

        emb = (embed_image_url(image_path) + embed_text(desc)) / 2

        ids.append(item_id)
        embeddings.append(emb.tolist())

        metadatas.append({
            "nom": item.nom,
            "categorie": item.categorie,
            "emplacement": item.emplacement
        })

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