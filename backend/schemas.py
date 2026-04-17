from pydantic import BaseModel
from typing import Optional, List

# 1. Le schéma de base (Les colonnes communes)
class ComposantBase(BaseModel):
    nom: str
    reference: str
    categorie: str
    prix: float
    emplacement: str
    quantite: int
    # On met phot_url en Optionnel (permet d'envoyer 'null' si on n'a pas de photo)
    photo_url: Optional[str] = None

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



class ProjetBase(BaseModel):
    nom: str
    budget_alloue: Optional[float] = None
   

class ProjetCreate(ProjetBase):
    # On utilise juste "pass" car il hérite exactement de toutes les colonnes 
    # de ComposantBase. Il n'a PAS d'id_composant, car c'est SQLite qui va le créer.
    pass

# Ce que l'utilisateur envoie pour modifier un projet existant (PUT)
class ProjetUpdate(ProjetBase):
    budget_consomme: Optional[float] = None
    statut: Optional[str] = None

class ProjetBudget(BaseModel):
    budget_alloue: Optional[float] = None
    budget_consomme: float
    # Afin de lire la donnée pas le json
    class Config:
        from_attributes = True

# Ce que l'API renvoie
class ProjetResponse(ProjetBase):
    id_projet: int
    budget_consomme: float
    statut: str

    class Config:
        from_attributes = True

class BOMBase(BaseModel):
    composant_id: int
    qte_requise: int

class BOMCreate(BOMBase):
    pass

# Ce que l'API renvoie (inclut l'ID de la ligne et l'ID du projet)
class BOMResponse(BOMBase):
    projet_id: int
    cout_estime: float

    class Config:
        from_attributes = True

# Ce que l'API renvoie après avoir lu le fichier CSV
class CSVLigneApercu(BaseModel):
    reference: str
    nom: str
    prix: float
    quantite: int
    statut: str  # "NOUVEAU" (à créer) ou "EXISTANT" (à mettre à jour)

# Ce que le frontend envoie pour valider l'import
class CSVImportValidation(BaseModel):
    lignes: List[CSVLigneApercu] # La liste des composants validés par l'utilisateur
    fournisseur: str = "Inconnu" # Ex: "Mouser", "Farnell"