import { Console } from "console"
import { getOneComposant, UpdateComposant } from "./stock-api";

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
const res1 = await getOneComposant(id_composant);



console.log(updatedData);
// const res =  UpdateComposant( 4, updatedData );
// console.log(res)

console.log(res1)