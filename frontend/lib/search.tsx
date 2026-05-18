import type { ComposantRechercheItem } from "@/types/type-composant";

export async function rechercheTexte(query: string) {
    const res = await fetch("/api/search/text", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query,
        }),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(
            data.error || "Erreur recherche texte"
        );
    }

    return data as ComposantRechercheItem[];
}