from fastapi import FastAPI, Depends, HTTPException, Response, status , UploadFile, File
from sqlalchemy.orm import Session
import sqlite3
import os
import chromadb
from clip_utils import embed_image , embed_text

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

#nos endpoints
@app.post("/composants", response_model=schemas.ComposantResponse)
def create_composant(composant: schemas.ComposantCreate, db: Session = Depends(get_db)):
    # On crée l'objet avec TOUTES les nouvelles colonnes
    nouveau_composant = models.Composant(
        nom=composant.nom,
        reference=composant.reference,
        categorie=composant.categorie,
        prix=composant.prix,
        emplacement=composant.emplacement,
        quantite=composant.quantite, 
        photo_url=composant.photo_url
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
    
    # 4. On valide les changements dans la base 
    db.commit()
    db.refresh(composant)
    
    return composant

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
        
        image_path = item.photo_url   
        desc = f"{item.nom} {item.categorie}"  

        emb = (embed_image(image_path) + embed_text(desc)) / 2

        ids.append(str(item.id_composant))  
        embeddings.append(emb.tolist())

        metadatas.append({
            "nom": item.nom,
            "categorie": item.categorie,
            "emplacement": item.emplacement
        })

    # Insertion dans ChromaDB
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