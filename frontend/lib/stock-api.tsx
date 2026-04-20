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
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  return await response.json();
}

export async function getAllComponants() : Promise<component[]>  {
    const response = await fetch(`${API_BASE_URL}/composants`, {
            cache: 'no-store',
        });
    
    return await response.json();
}