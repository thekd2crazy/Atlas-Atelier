<<<<<<< HEAD
import { Composant, ComposantCreate, ComposantUpdate } from "@/types/type-composant";

const API_BASE_URL = process.env.BACKEND_URL ?? process.env.VITE_API_URL ?? "http://localhost:8000";

export async function AddComposant(data: ComposantCreate) {
  const response = await fetch(`api/stock`, {
=======
type ComposantCreate = {
  nom: string;
  reference: string;
  categorie: string;
  prix: number;
  emplacement: string;
  quantite: number;
  photo_url: string;
};

export type component = {
    id : number
    nom : string
    categorie : string
    reference : string 
    emplacement : string 
    quantite : string
    prix : string
    photo_url : string 
}

const API_BASE_URL = process.env.BACKEND_URL ?? process.env.VITE_API_URL ?? "http://localhost:8000";

export async function AddComponant(data: ComposantCreate) {
  const response = await fetch(`${API_BASE_URL}/composants`, {
>>>>>>> d59eb42bbc1c3b2a069fb5666dc3e5005459a5aa
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  return await response.json();
}

<<<<<<< HEAD
export async function getAllComposants() : Promise<Composant[]>  {
=======
export async function getAllComponants() : Promise<component[]>  {
>>>>>>> d59eb42bbc1c3b2a069fb5666dc3e5005459a5aa
    const response = await fetch(`${API_BASE_URL}/composants`, {
            cache: 'no-store',
        });
    
    return await response.json();
<<<<<<< HEAD
}

export async function UpdateComposant( id : number , data : ComposantUpdate) : Promise<Composant> {
  const response = await fetch(`${API_BASE_URL}/composant/${id}`, {
    method: "PUT",
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error( await response.text());
  }

  return await response.json()  as Promise<Composant>;
}

export async function DeleteComposant(id:number) : Promise<void> {
  const response = await fetch(`${API_BASE_URL}/composants/${id}`, {
    method: 'DELETE'
  })

    if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Erreur HTTP ${response.status}`);
  }
=======
>>>>>>> d59eb42bbc1c3b2a069fb5666dc3e5005459a5aa
}