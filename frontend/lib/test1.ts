// test.js
const BASE_URL = "http://localhost:8000"; // à adapter selon ton FastAPI

async function main() {
  console.log("Début des tests...\n");

  // --- 1. GET /projets ---
  const projetListRes = await fetch(`${BASE_URL}/projets`);
  const projetList = await projetListRes.json();
  console.log("GET /projets →", projetListRes.status, projetList.length, "projets");
  if (projetListRes.status !== 200) {
    console.error(" GET /projets échoué");
    return;
  }

  // --- 2. GET /projets/actif ---
  const actifRes = await fetch(`${BASE_URL}/projets/actif`);
  const actifList = await actifRes.json();
  console.log("GET /projets/actif →", actifRes.status, actifList.length, "projets actifs");
  if (actifRes.status !== 200) {
    console.error(" GET /projets/actif échoué");
    return;
  }

  // --- 3. GET /projets/archive ---
  const archiveRes = await fetch(`${BASE_URL}/projets/archive`);
  const archiveList = await archiveRes.json();
  console.log("GET /projets/archive →", archiveRes.status, archiveList.length, "projets archivés");
  if (archiveRes.status !== 200) {
    console.error(" GET /projets/archive échoué");
    return;
  }

  // --- 4. GET /projets/{id_projet} ---
  const id_projet = 1; // à adapter selon ton DB
  const projetRes = await fetch(`${BASE_URL}/projets/${id_projet}`);
  if (projetRes.status === 404) {
    console.log(`GET /projets/${id_projet} → projet non trouvé (404 OK)`);
  } else {
    const projet = await projetRes.json();
    console.log("GET /projets/id_projet →", projetRes.status, projet.nom);
  }

  // --- 5. GET /projets/{id_projet}/budget ---
  const budgetRes = await fetch(`${BASE_URL}/projets/${id_projet}/budget`);
  if (budgetRes.status === 404) {
    console.log(`GET /projets/${id_projet}/budget → projet non trouvé (404 OK)`);
  } else {
    const budget = await budgetRes.json();
    console.log("GET /projets/id_projet/budget →", budgetRes.status, budget);
  }

  // --- 6. GET /boms ---
  const bomsRes = await fetch(`${BASE_URL}/boms`);
  const bomsList = await bomsRes.json();
  console.log("GET /boms →", bomsRes.status, bomsList.length, "lignes BOM");
  if (bomsRes.status !== 200) {
    console.error(" GET /boms échoué");
    return;
  }

  // --- 7. GET /projets/{id_projet}/bom ---
  const bomProjetRes = await fetch(`${BASE_URL}/projets/${id_projet}/bom`);
  const bomProjetList = await bomProjetRes.json();
  console.log(`GET /projets/${id_projet}/bom →`, bomProjetRes.status, bomProjetList.length, "lignes");
  if (bomProjetRes.status !== 200) {
    console.error(` GET /projets/${id_projet}/bom échoué`);
    return;
  }

  // --- 8. POST /projets/{id_projet}/bom (ajout d’un composant) ---
  const addBomPayload = {
    composant_id: 1,      // id d’un composant existant
    qte_requise: 5
  };
  const addBomRes = await fetch(`${BASE_URL}/projets/${id_projet}/bom`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(addBomPayload)
  });
  if (addBomRes.status === 200) {
    const newBom = await addBomRes.json();
    console.log("POST /projets/id_projet/bom →", addBomRes.status, "ligne ajoutée:", newBom);
  } else {
    console.log("POST /projets/id_projet/bom →", addBomRes.status, "erreur", await addBomRes.text());
  }

  // --- 9. PATCH /projets/{id_projet}/bom/{id_composant} ---
  const id_composant = 1;
  const patchBomPayload = { qte_requise: 10 };
  const patchBomRes = await fetch(
    `${BASE_URL}/projets/${id_projet}/bom/${id_composant}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchBomPayload)
    }
  );
  if (patchBomRes.status === 200) {
    const updatedBom = await patchBomRes.json();
    console.log("PATCH /projets/id_projet/bom/id_composant →", patchBomRes.status, updatedBom);
  } else {
    console.log("PATCH /projets/id_projet/bom/id_composant →", patchBomRes.status, await patchBomRes.text());
  }

  // --- 10. DELETE /projets/{id_projet}/bom/{id_composant} ---
  const deleteBomRes = await fetch(
    `${BASE_URL}/projets/${id_projet}/bom/${id_composant}`,
    { method: "DELETE" }
  );
  if (deleteBomRes.status === 200) {
    const deletedBom = await deleteBomRes.json();
    console.log("DELETE /projets/id_projet/bom/id_composant →", deleteBomRes.status, deletedBom);
  } else {
    console.log("DELETE /projets/id_projet/bom/id_composant →", deleteBomRes.status, await deleteBomRes.text());
  }

  // --- 11. PATCH /projets/{id_projet}/archiver ---
  const archiverRes = await fetch(`${BASE_URL}/projets/${id_projet}/archiver`, {
    method: "PATCH"
  });
  if (archiverRes.status === 200) {
    const projetArchivé = await archiverRes.json();
    console.log("PATCH /projets/id_projet/archiver →", archiverRes.status, projetArchivé.statut);
  } else {
    console.log("PATCH /projets/id_projet/archiver →", archiverRes.status, await archiverRes.text());
  }

  console.log("\n Tests terminés.");
}

main().catch(err => {
  console.error("Erreur dans le test:", err);
});