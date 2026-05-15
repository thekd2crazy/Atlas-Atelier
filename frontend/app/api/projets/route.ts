// app/api/projets/route.ts
import { NewProjet, Projet } from "@/types/type-projet";
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.BACKEND_URL ?? process.env.VITE_API_URL ?? "http://localhost:8000";

// Prendre un projet 
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/projets`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch projets' },
        { status: response.status }
      );
    }

    const projets: Projet[] = await response.json();
    return NextResponse.json(projets);
  } catch (error) {
    console.error('Error fetching projets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Creer un projet : 
export async function POST(request: NextRequest) {
  try {
    const data: NewProjet = await request.json(); // Lit le body client

    const response = await fetch(`${API_BASE_URL}/projets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data), // Forward exact
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Impossible de créer un projet' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 200}); // Retourne le nouveau composant
  } 
  
  catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}