import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { ApiError, fetchJson } from "@/lib/api";

type BackendObligation = {
  id?: unknown;
  topic?: unknown;
  type?: unknown;
  text?: unknown;
  classification?: unknown;
  category?: unknown;
  comment?: unknown;
  active?: unknown;
  text_updatable?: unknown;
  license_ids?: unknown;
};

function asObligation(value: BackendObligation) {
  return {
    id: typeof value.id === "string" ? value.id : "",
    topic: typeof value.topic === "string" ? value.topic : "",
    type: typeof value.type === "string" ? value.type : "",
    text: typeof value.text === "string" ? value.text : "",
    classification: typeof value.classification === "string" ? value.classification : "",
    category: typeof value.category === "string" ? value.category : "",
    comment: typeof value.comment === "string" ? value.comment : "",
    active: typeof value.active === "boolean" ? value.active : true,
    textUpdatable: typeof value.text_updatable === "boolean" ? value.text_updatable : false,
    licenseIds: Array.isArray(value.license_ids) ? value.license_ids.filter((id): id is string => typeof id === "string") : [],
  };
}

async function getBackendRequest(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const accessToken = token?.backendTokens?.accessToken;
  const baseUrl = process.env.LICENSEDB_API_URL;
  if (!accessToken || !baseUrl) return null;
  return { apiUrl: baseUrl.replace(/\/+$/, ""), headers: { Authorization: `Bearer ${accessToken}` } };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const backend = await getBackendRequest(request);
  if (!backend) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { id } = await params;

  try {
    const response = await fetchJson<{ data?: BackendObligation[] }>(`${backend.apiUrl}/obligations/${encodeURIComponent(id)}`, { headers: backend.headers, cache: "no-store" });
    const obligation = response.data?.[0];
    if (!obligation) return NextResponse.json({ error: "Obligation not found" }, { status: 404 });
    return NextResponse.json({ data: asObligation(obligation) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    return NextResponse.json({ error: "Unable to load obligation" }, { status });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const backend = await getBackendRequest(request);
  if (!backend) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid obligation details" }, { status: 400 });
  }

  try {
    const response = await fetchJson<{ data?: BackendObligation[] }>(`${backend.apiUrl}/obligations/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { ...backend.headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const obligation = response.data?.[0];
    return NextResponse.json({ data: obligation ? asObligation(obligation) : null });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    return NextResponse.json({ error: "Unable to update obligation" }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const backend = await getBackendRequest(request);
  if (!backend) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { id } = await params;

  try {
    const response = await fetch(`${backend.apiUrl}/obligations/${encodeURIComponent(id)}`, { method: "DELETE", headers: backend.headers, cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: "Unable to delete obligation" }, { status: response.status });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Unable to delete obligation" }, { status: 502 });
  }
}