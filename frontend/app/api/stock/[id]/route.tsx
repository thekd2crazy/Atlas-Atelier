import { NextResponse , NextRequest} from 'next/server';
import { Composant, ComposantUpdate } from '@/types/type-composant';

const API_BASE_URL = process.env.BACKEND_URL ?? process.env.VITE_API_URL ?? "http://localhost:8000";

// UPDATE un composant 
export async function PUT( request: NextRequest, {params} : {params : {id : string}}): Promise<NextResponse>  {
  try {

    // 1. Valider l' ID 
    const id_composant = parseInt(params.id);
    if (isNaN(id_composant) || id_composant <= 0 ) { 
      return NextResponse.json({error : "ID invalide"}, {status : 400});
    }

    // 2. Parse body
    const UpdateData : ComposantUpdate = await request.json();

    // 3. Validation basique (optionnel)    
    if (!UpdateData.nom || !UpdateData.reference) {
      return NextResponse.json(
        {error : 'Nom et référence obligatoires'},
        {status: 400}
      );
    }

    // 4. Appel FastAPI 
    const response = await fetch(`${API_BASE_URL}/composant/${id_composant}`, {
      method: 'PUT',
      headers: {'Content-Type': 'pplication/json'} ,
      body: JSON.stringify(UpdateData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = {detail: errorText};
      }

      return NextResponse.json(
        { error: errorData.detail || 'Erreur backend' },
        { status: response.status }
      );
    }

    const composant: Composant = await response.json();
    return NextResponse.json(composant, {status:200});
  } catch (error) {
    console.error('Erreur route PUT :', error);
    return NextResponse.json(
      {error: 'Erruer serveur interne'},
      {status: 500}
    );

  }
}

export async function GET( request: NextRequest, {params} : {params : {id : string}}) {
  
  const id_composant = parseInt(params.id);
  // 1. Validater la presence du composant

  if (isNaN(id_composant)|| id_composant<= 0 ){
    
    return NextResponse.json({error : 'ID invalide'}, {status: 400});
  }

  const response = await fetch(`${API_BASE_URL}/composants/${id_composant}`)
  if (!response.ok){
    return NextResponse.json(
      {error : 'Composant non trouvé'},
      {status : 404 }
    );
  }

  // j'attend de la data de type composant .
  const composant = await response.json();
  return NextResponse.json(composant);
  
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string } }  // string !
) {
  // ✅ Parse + validation
  const id_composant = parseInt(params.id);
  if (isNaN(id_composant) || id_composant <= 0) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
  }

  // ✅ Fetch FastAPI
  const response = await fetch(`${API_BASE_URL}/composants/${id_composant}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Composant non supprimé' }, 
      { status: response.status }
    );
  }

  // ✅ DELETE = 204 No Content (standard)
  return new NextResponse(null, { status: 204 });  // Pas de body !
}