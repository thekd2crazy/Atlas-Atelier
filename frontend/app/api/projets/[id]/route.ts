import { NextRequest, NextResponse } from "next/server";
import { NewProjet, Projet, ProjetUpdate } from "@/types/type-projet";


const API_BASE_URL = process.env.BACKEND_URL ?? process.env.VITE_API_URL ?? "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // attend un parametre
  
  const id_projet = parseInt(id);
  // 1. Validater la presence du composant

  if (isNaN(id_projet)|| id_projet <= 0 ){
    
    return NextResponse.json({error : 'ID invalide'}, {status: 400});
  }

  const response = await fetch(`${API_BASE_URL}/projets/${id_projet}`)
  if (!response.ok){
    return NextResponse.json(
      {error : 'Projet non trouvé'},
      {status : 404 }
    );
  }

    // j'attend de la data de type composant .
  const composant = await response.json();
  return NextResponse.json(composant);
  
}


export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id_projet = params.id;
    const projet_update: ProjetUpdate = await request.json(); 

    const response = await fetch(
      `${process.env.API_BASE_URL}/projets/${id_projet}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projet_update), // Champs optionnels préservés
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Projet non trouvé' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Impossible de mettre à jour le projet' },
        { status: response.status }
      );
    }

    const projet: Projet = await response.json();
    return NextResponse.json(projet, { status: 200 });
  } catch (error) {
    console.error('Erreur mise à jour projet:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}