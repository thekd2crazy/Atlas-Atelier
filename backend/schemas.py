from pydantic import BaseModel
from typing import Optional

# 1. Le schéma de base (Les colonnes communes)
class ComposantBase(BaseModel):
    nom: str
    reference: str
    categorie: str
    prix: float
    emplacement: str
    quantite: int
    # On met phot_url en Optionnel (permet d'envoyer 'null' si on n'a pas de photo)
    phot_url: Optional[str] = None

# 2. Le schéma d'ENTRÉE (Ce que le frontend envoie via un POST)
class ComposantCreate(ComposantBase):
    # On utilise juste "pass" car il hérite exactement de toutes les colonnes 
    # de ComposantBase. Il n'a PAS d'id_composant, car c'est SQLite qui va le créer.
    pass

# 3. Le schéma de SORTIE (Ce que l'API renvoie au frontend)
class ComposantResponse(ComposantBase):
    id_composant: int # On ajoute l'ID généré par la base de données

    # Cette configuration est magique : elle dit à Pydantic de ne pas s'attendre 
    # à un dictionnaire classique, mais de lire directement les attributs de 
    # votre modèle SQLAlchemy (models.Composant).
    class Config:
        from_attributes = True