from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import sqlite3
import os

from database import SessionLocal, engine
import models
import schemas 

app = FastAPI(title="Atlas Atelier API")

#INITIALISATION DE LA DB DEPUIS SCHEMA.SQL
def init_db():
    if not os.path.exists("atelier.db"):
        # Si le fichier .db n'existe pas, on le crée en lisant le schema.sql
        with sqlite3.connect("atelier.db") as conn:
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
        quantite=composant.quantite, # Remplacé "stock" par "quantite"
        phot_url=composant.phot_url
    )
    
    db.add(nouveau_composant)
    db.commit()
    db.refresh(nouveau_composant)
    
    return nouveau_composant
    
    # 2. On l'ajoute à la base de données
    db.add(nouveau_composant)
    db.commit()        # On sauvegarde
    db.refresh(nouveau_composant) # On récupère l'ID généré
    # 3. On le renvoie au frontend
    return nouveau_composant

@app.get("/composants", response_model=list[schemas.ComposantResponse])
def lire_composants(db: Session = Depends(get_db)):
    # Récupère tous les composants dans la table
    composants = db.query(models.Composant).all()
    return composants