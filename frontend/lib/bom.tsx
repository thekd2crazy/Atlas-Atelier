import { BOMResponse, CreateBOMInput } from "@/types/types-bom";



export async function addBOMLine(
  projectId: number,
  payload: CreateBOMInput
): Promise<BOMResponse> {
  const res = await fetch(`/api/projets/${projectId}/bom`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.detail || "Erreur BOM");
  }

  return data;
}