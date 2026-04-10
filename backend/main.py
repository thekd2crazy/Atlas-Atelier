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


# Composants

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

# Projets

@app.post("/projets", response_model=schemas.ProjetResponse)
def create_projet(projet: schemas.ProjetCreate, db: Session = Depends(get_db)):
    nouveau_projet = models.Projet(
        nom=projet.nom,
        budget_alloue=projet.budget_alloue,
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
    
    # On met à jour les champs
    projet.nom = projet_update.nom
    if projet_update.budget_alloue is not None:
        projet.budget_alloue = projet_update.budget_alloue
    if projet_update.budget_consomme is not None:
        projet.budget_consomme = projet_update.budget_consomme
    if projet_update.statut is not None:
        projet.statut = projet_update.statut
        
    db.commit()
    db.refresh(projet)
    return projet