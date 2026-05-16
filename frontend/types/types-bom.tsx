export type BOM = {
  id_bom: number;
  reference: string;
  designation: string;
  quantite: number;
};

export type BOMResponse = {
  id_bom: number;
  projet_id: number;
  composant_id: number;
  qte_requise: number;
  cout_estime: number;
};

// Ligne de la BOM pour un projet, avec les détails du composant
export type CreateBOMInput = {
  composant_id: number;
  qte_requise: number;
};

// Delete ligne de la BOM d'un projet
export type DeleteBOMInput = {
  composant_id: number;
};