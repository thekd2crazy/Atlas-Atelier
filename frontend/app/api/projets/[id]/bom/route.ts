import { NextResponse , NextRequest} from "next/server";


const API_BASE_URL = process.env.BACKEND_URL ?? process.env.VITE_API_URL ?? "http://localhost:8000";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {

  try {
     
    const { id } = await params; // await the params
    const id_projet = parseInt(id); // Récupéré de l'URL /api/projets/123/archiver
    
  // 1. Validater la presence du composant

  if (isNaN(id_projet)|| id_projet<= 0 ){
    
    return NextResponse.json({error : 'ID invalide'}, {status: 400});
  }
    
    const response = await fetch(
      `${API_BASE_URL}/projets/${id_projet}/bom`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erreur lors de la récupération de la BOM" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur API BOM :", error);

    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}





export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params; // await the params
    const id_projet = parseInt(id); // Récupéré de l'URL /api/projets/123/archiver
    const body = await request.json();

    const response = await fetch(
      `${API_BASE_URL}/projets/${id_projet}/bom`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data.detail || "Erreur lors de l'ajout du composant",
        },
        {
          status: response.status,
        }
      );
    }

    return NextResponse.json(data, {
      status: 201,
    });
  } catch (error) {
    console.error("Erreur POST BOM :", error);

    return NextResponse.json(
      {
        error: "Erreur serveur",
      },
      {
        status: 500,
      }
    );
  }
}