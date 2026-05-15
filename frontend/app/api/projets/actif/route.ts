import { NextRequest, NextResponse } from 'next/server';
import type { Projet } from '@/types/type-projet'; // Ajustez votre type Projet

const API_BASE_URL = process.env.BACKEND_URL ?? process.env.VITE_API_URL ?? "http://localhost:8000";

// GET /api/projets/actif - Projets actifs uniquement
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const response = await fetch(
      `${API_BASE_URL}/projets/actif`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Impossible de récupérer les projets actifs' },
        { status: response.status }
      );
    }

    const projets: Projet[] = await response.json();
    return NextResponse.json(projets);
  } catch (error) {
    console.error('Erreur projets actifs:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}