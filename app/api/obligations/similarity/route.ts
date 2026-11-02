import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { ApiError, fetchJson } from "@/lib/api";

type BackendSimilarity = { id?: unknown; topic?: unknown; text?: unknown; similarity?: unknown };

function asSimilarity(value: BackendSimilarity) {
  return {
    id: typeof value.id === "string" ? value.id : "",
    topic: typeof value.topic === "string" ? value.topic : "",
    text: typeof value.text === "string" ? value.text : "",
    similarity: typeof value.similarity === "number" && Number.isFinite(value.similarity) ? value.similarity : 0,
  };
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const accessToken = token?.backendTokens?.accessToken;
  const baseUrl = process.env.LICENSEDB_API_URL;
  if (!accessToken) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!baseUrl) return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body) || typeof (body as { text?: unknown }).text !== "string") {
    return NextResponse.json({ error: "Invalid obligation text" }, { status: 400 });
  }

  try {
    const response = await fetchJson<BackendSimilarity[]>(`${baseUrl.replace(/\/+$/, "")}/obligations/similarity`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    return NextResponse.json({ data: response.map(asSimilarity) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    return NextResponse.json({ error: "Unable to find similar obligations" }, { status });
  }
}