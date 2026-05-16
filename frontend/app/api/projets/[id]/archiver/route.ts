import { NextRequest, NextResponse } from 'next/server';
import type { Projet } from '@/types/type-projet';

const API_BASE_URL = process.env.BACKEND_URL ?? process.env.VITE_API_URL ?? "http://localhost:8000";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const id_projet = id; // Récupéré de l'URL /api/projets/123/archiver

    const response = await fetch(
      `${API_BASE_URL}/projets/${id_projet}/archiver`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
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
        { error: 'Impossible d\'archiver le projet' },
        { status: response.status }
      );
    }

    const projet: Projet = await response.json();
    return NextResponse.json(projet, { status: 200 });
  } catch (error) {
    console.error('Erreur archivage projet:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
