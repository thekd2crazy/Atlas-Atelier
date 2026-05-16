import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.BACKEND_URL ?? process.env.VITE_API_URL ?? "http://localhost:8000";

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
      composantid: string;
    };
  }
) {
    const id_projet = Number(params.id);
    const id_composant = Number(params.composantid);

    if (isNaN(id_composant) || isNaN(id_composant)) {
        console.error("Invalid IDs", {
        idProjet: id_projet,
        composant_id: id_composant,
        });
        return;
    }
  try {
    
    const response = await fetch(
      `${API_BASE_URL}/projets/${id_projet}/bom/${id_composant}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({id_composant}), // Certains backends nécessitent un body même pour DELETE
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data.detail || "Erreur lors de la suppression",
        },
        {
          status: response.status,
        }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur DELETE BOM :", error);

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


export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
      composantid: string;
    };
  }
) {
  try {
    const body = await request.json();

    const response = await fetch(
      `${API_BASE_URL}/projets/${params.id}/bom/${params.composantid}`,
      {
        method: "PATCH",
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
          error: data.detail || "Erreur lors de la mise à jour de la BOM",
        },
        {
          status: response.status,
        }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur PATCH BOM :", error);

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