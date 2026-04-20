type ComposantCreate = {
  nom: string;
  reference: string;
  categorie: string;
  prix: number;
  emplacement: string;
  quantite: number;
  photo_url: string;
};

export type Composant = {
  id_composant: number;
  nom: string;
  categorie: string;
  reference: string;
  emplacement: string;
  quantite: number;
  prix: number;
  photo_url: string | null;
};

const API_BASE_URL = "/api/stock";

export async function AddComponant(data: ComposantCreate) {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Erreur API POST /api/stock: ${response.status}`);
  }

  return await response.json();
}

export async function getAllComponents(): Promise<Composant[]> {
  const response = await fetch(API_BASE_URL, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Erreur API GET /api/stock: ${response.status}`);
  }

  return await response.json();
}