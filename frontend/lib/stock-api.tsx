import { Composant, ComposantCreate, ComposantUpdate } from "@/types/type-composant";

const API_BASE_URL = process.env.BACKEND_URL ?? process.env.VITE_API_URL ?? "http://localhost:8000";

export async function AddComposant(data: ComposantCreate) {
  const response = await fetch(`/api/stock`, {
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

  console.log(`${typeof(id)}: ${id}`);

  const response = await fetch(`/api/stock/${id}`, {
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
  const response = await fetch(`/api/stock/${id}`, {
    method: 'DELETE'
  })

    if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Erreur HTTP ${response.status}`);
  }
}

export async function getOneComposant(id: number): Promise<Composant> {
  const response = await fetch(`${API_BASE_URL}/composants/${id}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Composant introuvable");
  }

  return await response.json();
}