import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { ApiError, fetchJson } from "@/lib/api";

type BackendOption = { type?: unknown; category?: unknown; classification?: unknown };

function values(items: BackendOption[] | undefined, field: "type" | "category" | "classification") {
  return items?.flatMap((item) => typeof item[field] === "string" ? [item[field]] : []) ?? [];
}

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const accessToken = token?.backendTokens?.accessToken;
  const baseUrl = process.env.LICENSEDB_API_URL;
  if (!accessToken) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!baseUrl) return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });

  const apiUrl = baseUrl.replace(/\/+$/, "");
  const options = { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" as const };
  try {
    const [types, categories, classifications] = await Promise.all([
      fetchJson<{ data?: BackendOption[] }>(`${apiUrl}/obligations/types?active=true`, options),
      fetchJson<{ data?: BackendOption[] }>(`${apiUrl}/obligations/categories?active=true`, options),
      fetchJson<{ data?: BackendOption[] }>(`${apiUrl}/obligations/classifications?active=true`, options),
    ]);
    return NextResponse.json({
      types: values(types.data, "type"),
      categories: values(categories.data, "category"),
      classifications: values(classifications.data, "classification"),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    return NextResponse.json({ error: "Unable to load obligation options" }, { status });
  }
}