


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
const response = await fetch('/api/projets/1/archiver', {
  method: 'PATCH',
});
const projetArchive = await response.json();

console.log(projetArchive);

// get()
const projet = await fetch('/api/projets/123').then(res => res.json());
// → Proxy vers /projets/123 avec validation intégrée

// curl http://localhost:3000/api/projets/abc  → 400 "ID invalide"
// curl http://localhost:3000/api/projets/999  → 404 si inexistant
// curl http://localhost:3000/api/projets/123  → projet JSON

// test Update() pour la partie projet 
{/*
  
  curl -X PUT http://localhost:3000/api/projets/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ton-token" \
  -d '{"nom": "Projet mis à jour", "budget_alloue": 75000}'

*/}
