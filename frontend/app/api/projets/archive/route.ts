import { NextRequest, NextResponse } from "next/server";
import { Projet } from "@/types/type-projet";


const API_BASE_URL = process.env.BACKEND_URL ?? process.env.VITE_API_URL ?? "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const response = await fetch(
      `${API_BASE_URL}/projets/archive`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Impossible de récupérer les projets archivés' },
        { status: response.status }
      );
    }

    const projets: Projet[] = await response.json();
    return NextResponse.json(projets);
  } catch (error) {
    console.error('Erreur projets archivés:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}