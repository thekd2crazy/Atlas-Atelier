import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        //  récupération body frontend
        const body = await request.json();

        //  appel backend FastAPI
        const response = await fetch(
            `${process.env.API_BASE_URL}/recherche/texte`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            }
        );

        //  récupération réponse backend
        const data = await response.json().catch(() => null);

        //  gestion erreurs backend
        if (!response.ok) {
            return NextResponse.json(
                {
                    error:
                        data?.detail ||
                        "Erreur lors de la recherche texte",
                },
                {
                    status: response.status,
                }
            );
        }

       
        return NextResponse.json(data, {
            status: 200,
        });

    } catch (error) {
        console.error("Erreur route recherche texte :", error);

        return NextResponse.json(
            {
                error: "Erreur serveur interne",
            },
            {
                status: 500,
            }
        );
    }
}