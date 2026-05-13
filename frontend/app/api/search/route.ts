import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.BACKEND_URL ?? process.env.VITE_API_URL ?? "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    // 1. Récupérer le FormData envoyé par le frontend (avec le fichier)
    const formData = await request.formData();

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Aucun fichier reçu" },
        { status: 400 }
      );
    }

    // 2. Préparer le FormData pour FastAPI
    const fastApiFormData = new FormData();
    fastApiFormData.append("file", file);

    // 3. Envoyer vers FastAPI /recherche/image
    const fastApiResponse = await fetch(`${API_BASE_URL}/recherche/image`, {
      method: "POST",
      body: fastApiFormData,
    });

    if (!fastApiResponse.ok) {
      const txt = await fastApiResponse.text().catch(() => "");
      return NextResponse.json(
        {
          error: "Erreur FastAPI",
          status: fastApiResponse.status,
          details: txt,
        },
        { status: 500 }
      );
    }

    // 4. Récupérer les résultats (metadatas) de FastAPI
    const result = await fastApiResponse.json();
    const flat = Array.isArray(result?.[0]) ? result[0] : result;

    // 5. Retourner au frontend
    return NextResponse.json(flat);
  } catch (error) {
    console.error("Erreur route /api/recherche/image :", error);
    return NextResponse.json(
      { error: "Erreur serveur Next.js" },
      { status: 500 }
    );
  }
}