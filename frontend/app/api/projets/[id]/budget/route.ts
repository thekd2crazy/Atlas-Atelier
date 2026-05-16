import { NextRequest, NextResponse } from 'next/server';
import type { Projet } from '@/types/type-projet'; // Type correspondant à schemas.ProjetBudget

const API_BASE_URL = process.env.BACKEND_URL ?? process.env.VITE_API_URL ?? "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const id_projet = id; // Extrait de /api/projets/123/budget

    const response = await fetch(
      `${API_BASE_URL}/projets/${id_projet}/budget`,
      { cache: 'no-store' } // Données fraîches pour budgets
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Projet non trouvé' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Impossible de récupérer le budget du projet' },
        { status: response.status }
      );
    }

    const budget: Projet = await response.json();
    return NextResponse.json(budget);
  } catch (error) {
    console.error('Erreur budget projet:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}