from sqlalchemy import Column, Integer, String, Float, ForeignKey
from database import Base

class Composant(Base):
    __tablename__ = "composants"
    id_composant = Column(Integer, primary_key=True, index=True)
    nom = Column(String, index=True)
    reference = Column(String, unique=True, index=True)
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
    
class BOM(Base):
    __tablename__ = "bom_lignes"
    
    # On relie cette ligne à un Projet précis
    projet_id = Column(Integer, ForeignKey("projets.id_projet"), primary_key=True)
    
    # On relie cette ligne à un Composant précis
    composant_id = Column(Integer, ForeignKey("composants.id_composant"), primary_key=True)
    
    # Combien de fois ce composant est utilisé dans ce projet
    qte_requise = Column(Integer)

    cout_estime = Column(Float)