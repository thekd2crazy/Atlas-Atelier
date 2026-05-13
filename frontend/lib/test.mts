


// constantes : 
const updatedData = { 
  "nom": "stepmotor",
  "reference": "NEMA12",
  "categorie": "Electronique",
  "prix": 5,
  "emplacement": "A25",
  "quantite": 3,
  "photo_url": "https://stepmotors.jpg",
}

const id_composant = 3;




// console.log(updatedData);
// const res =  UpdateComposant( 4, updatedData );
// console.log(res)
// console.log(res1)


const API_URL = "http://localhost:3000/api/search";

async function testSearch() {
  try {
    // Création d'un faux fichier image
    const blob = new Blob(["fake image content"], {
      type: "image/png",
    });

    const file = new File([blob], "test.png", {
      type: "image/png",
    });

    console.log("Faux fichiers ")
    // Création FormData
    const formData = new FormData();
    formData.append("file", file);

    console.log("Envoi du fichier...");

    // Requête vers Next.js
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    console.log("Status :", response.status);

    // Lecture résultat
    const result = await response.json();

    console.log("Résultat API :");
    console.dir(result, { depth: null });
  } catch (error) {
    console.error("Erreur test :", error);
  }
}

testSearch();