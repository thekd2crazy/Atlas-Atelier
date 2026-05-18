import { NextResponse } from "next/server";

const API_BASE_URL = process.env.BACKEND_URL ?? process.env.VITE_API_URL ?? "http://localhost:8000";

export async function POST() {
  try {
    const response = await fetch(`${API_BASE_URL}/ingestion`, {
      method: "POST",
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      return NextResponse.json(
        { error: "Échec de l'ingestion", status: response.status, details },
        { status: response.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erreur ingestion :", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'ingestion" },
      { status: 500 }
    );
  }
}
