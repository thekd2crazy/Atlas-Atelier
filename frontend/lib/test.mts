


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




// Archiver le projet #123
/*
const response = await fetch('/api/projets/1/archiver', {
  method: 'PATCH',
});
const projetArchive = await response.json();

console.log(projetArchive);
*/

/*
// get()
const projet = await fetch('/api/projets/1').then(res => res.json());
// → Proxy vers /projets/123 avec validation intégrée

// A faire dans le terminale pour tester la route GET projet :
// curl http://localhost:3000/api/projets/abc  → 400 "ID invalide"
// curl http://localhost:3000/api/projets/999  → 404 si inexistant
// curl http://localhost:3000/api/projets/123  → projet JSON

// test Update() pour la partie projet 

*/

/*
  
  curl -X PUT http://localhost:3000/api/projets/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ton-token" \
  -d '{"nom": "Projet mis à jour", "budget_alloue": 75000}'

*/

// Test pour la partie BOM 
/*
curl -X GET http://localhost:3000/api/projets/123/bom
*/

// Test Update BOM by projet

/*
const res = await fetch("/api/projets/1/bom", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    composant_id: 5,
    qte_requise: 10,
  }),
});

const data = await res.json();

console.log(data);

*/

// Test GET BOM all

/*
const boms: BOM[] = await res.json();
*/


// Test Update composant from BOM projets
/*
const res = await fetch("/api/projets/1/bom/5", {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    qte_requise: 15,
  }),
});

const data = await res.json();
console.log(data);
*/



const response = await fetch(
  `http://localhost:8000/projets/${1}/bom/${7}`,
  {
    method: "DELETE",
  }
);

const data = await response.text();
console.log(data);
