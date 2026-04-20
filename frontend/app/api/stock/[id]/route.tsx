const API_BASE_URL = process.env.BACKEND_URL ?? process.env.VITE_API_URL ?? "http://backend:8000";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const response = await fetch(`${API_BASE_URL}/composants/${id}`, {
    cache: "no-store",
  });

  const data = await response.json();

  return Response.json(data, {
    status: response.status,
  });
}