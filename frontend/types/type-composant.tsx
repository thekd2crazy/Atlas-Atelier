// Creer un composant : 
export type ComposantCreate = {
  nom: string;
  reference: string;
  categorie: string;
  prix: number;
  emplacement: string;
  quantite: number;
  photo_url: string;
};

// Utiliser dans getAllcomposants()
export type Composant = {
    id_composant : number
    nom : string
    categorie : string
    reference : string 
    emplacement : string 
    quantite : number | string
    prix : number | string
    photo_url : string 
};

// Utiliser pour UpdateComposant()
export type ComposantUpdate = {
    nom : string 
    categorie : string
    reference : string 
    emplacement : string 
    quantite : number | string 
    prix : number | string 
    photo_url : string 
};