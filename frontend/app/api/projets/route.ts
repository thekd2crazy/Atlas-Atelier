// app/api/projets/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.BACKEND_URL ??
  process.env.VITE_API_URL ??
  "http://localhost:8000";

async function fetchFastAPI(
  path: string,
  options?: RequestInit
): Promise<NextResponse> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, options);

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  const text = await res.text();
  return new NextResponse(text, { status: res.status });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  let path = "/projets";
  if (type === "actif") {
    path = "/projets/actif";
  } else if (type === "archive") {
    path = "/projets/archive";
  }

  return fetchFastAPI(path, { method: "GET" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  return fetchFastAPI("/projets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}