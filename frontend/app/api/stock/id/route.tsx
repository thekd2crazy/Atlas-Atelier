type ComposantCreate = {
  nom: string;
  reference: string;
  categorie: string;
  prix: number;
  emplacement: string;
  quantite: number;
  photo_url: string;
};

type component = {
    id : Int16Array
    nom : string
    categorie : string
    reference : string 
    emplacement : string 
    quantite : string
    prix : string
    photo_url : string 
}

export async function AddComponant(data: ComposantCreate) {
  const response = await fetch("http://192.168.1.34:8000/composants", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  return await response.json();
}

export async function getAllComponents() : Promise<component[]>  {
    const response = await fetch("http://192.168.1.34:8000/composants" );
    
    return await response.json();
}