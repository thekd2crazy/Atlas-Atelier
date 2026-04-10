from sqlalchemy import Column, Integer, String, Float
from database import Base

class Composant(Base):
    __tablename__ = "composants"
    id_composant = Column(Integer, primary_key=True, index=True)
    nom = Column(String, index=True)
    reference = Column(String)
    categorie = Column(String)
    prix = Column(Float)
    emplacement = Column(String)
    quantite = Column(Integer)
    photo_url = Column(String)

class Projet(Base):
    __tablename__ = "projets"
    id_projet = Column(Integer, primary_key=True, index=True)
    nom = Column(String, index=True)
    budget_alloue = Column(Float)
    budget_consomme = Column(Float)
    statut = Column(String)
    