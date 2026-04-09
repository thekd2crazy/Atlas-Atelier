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
    phot_url = Column(String)