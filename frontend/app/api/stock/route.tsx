import { NextResponse } from 'next/server';

// Vos imports pour component/DB
import { getAllComponants, type component } from '@/lib/stock-api';



export async function GET() {
  const components: component[] = await getAllComponants(); // Votre logique
  return NextResponse.json(components); // Toujours retourner Response !
}