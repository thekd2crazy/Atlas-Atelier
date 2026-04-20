const API_BASE_URL = process.env.BACKEND_URL ?? process.env.VITE_API_URL ?? "http://localhost:8000";

export async function GET() {
  const response = await fetch(`${API_BASE_URL}/composants`, {
    cache: "no-store",
  });

  const data = await response.json();
  return Response.json(data, { status: response.status });
}

export async function POST(request: Request) {
  const payload = await request.json();

  const response = await fetch(`${API_BASE_URL}/composants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return Response.json(data, { status: response.status });
}