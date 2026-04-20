import { Composant, ComposantCreate, ComposantUpdate } from "@/types/type-composant";

const API_BASE_URL = process.env.BACKEND_URL ?? process.env.VITE_API_URL ?? "http://localhost:8000";

export async function AddComposant(data: ComposantCreate) {
  const response = await fetch(`api/stock`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  return await response.json();
}

export async function getAllComposants() : Promise<Composant[]>  {
    const response = await fetch(`${API_BASE_URL}/composants`, {
            cache: 'no-store',
        });
    
    return await response.json();
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
}