export type Projet = {
  id_projet: number
  nom: string
  budget_alloue: number
  budget_consomme: number
  description: string | null
  date: string
  statut: "actif" | "archive"
}

export type NewProjet = {
  nom: string
  budget_alloue: number
  description: string | null
  date: string
}
