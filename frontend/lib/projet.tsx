import { NewProjet, Projet, ProjetUpdate } from "@/types/type-projet";


const API_BASE_URL = process.env.BACKEND_URL ?? process.env.VITE_API_URL ?? "http://localhost:8000";

export async function getAllproject(): Promise<Projet> {
    const response = await fetch(`api/projets`,{
        method:"GET",
        cache: 'no-store',
    });

    return await response.json();  
}

export async function AddProjet(data: NewProjet ) {
  const response = await fetch(`/api/projets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  return await response.json();
}

export async function updateProjet(
  id_projet: number, 
  data: ProjetUpdate
): Promise<Projet> {
  const response = await fetch(`/api/projets/${id_projet}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 404) throw new Error('Projet non trouvé');
    throw new Error('Échec mise à jour');
  }

  return response.json();
}


export async function getProjet(id_projet: number): Promise<Projet> {
  const response = await fetch(`/api/projets/${id_projet}`);
  
  if (!response.ok) {
    if (response.status === 400) throw new Error('ID invalide');
    if (response.status === 404) throw new Error('Projet non trouvé');
    throw new Error('Erreur API');
  }
  
  return response.json();
}

// Usage: const projet = await getProjet(123);


export async function archiverProjet(id_projet: number): Promise<Projet> {
  
  if (!Number.isInteger(id_projet) || id_projet <= 0) {
    throw new Error('ID projet invalide');
  }
  
  const response = await fetch(`/api/projets/${id_projet}/archiver`, {
    method: 'PATCH',
  });

  if (!response.ok) {
    if (response.status === 404) throw new Error('Projet non trouvé');
    throw new Error('Impossible d\'archiver');
  }

  return response.json();
}

// Usage simple:
// const projetArchive = await archiverProjet(123);

// utils/budgetApi.ts
export async function getProjetBudget(id_projet: number): Promise<Projet> {
  const response = await fetch(`/api/projets/${id_projet}/budget`);
  
  if (!response.ok) {
    if (response.status === 404) throw new Error('Projet non trouvé');
    throw new Error('Erreur budget');
  }
  
  return response.json();
}