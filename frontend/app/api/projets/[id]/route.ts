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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const id_projet = Number(id);

    if (isNaN(id_projet)) {
      return NextResponse.json(
        { error: "ID de projet invalide" },
        { status: 400 }
      );
    }

    const projet_update = await request.json();

    const response = await fetch(
      `${API_BASE_URL}/projets/${id_projet}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projet_update),
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.detail || "Erreur lors de la mise à jour du projet",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Erreur mise à jour projet:", error);

    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}