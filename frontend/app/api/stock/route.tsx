import { NextResponse , NextRequest} from 'next/server';
import { getAllComposants } from '@/lib/stock-api';
import { Composant, ComposantCreate, ComposantUpdate } from '@/types/type-composant';
import { error } from 'console';

const API_BASE_URL = process.env.BACKEND_URL ?? process.env.VITE_API_URL ?? "http://localhost:8000";



export async function GET() {
  const components: Composant[] = await getAllComposants(); // Votre logique
  return NextResponse.json(components); // Toujours retourner Response !
}

export async function POST(request: NextRequest) {
  try {
    const data: ComposantCreate = await request.json(); // Lit le body client

    const response = await fetch(`${API_BASE_URL}/composants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data), // Forward exact
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Impossible de créer le composant' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 201 }); // Retourne le nouveau composant
  } 
  
  catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}



