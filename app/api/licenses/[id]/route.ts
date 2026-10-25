import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { ApiError, fetchJson } from "@/lib/api";

type BackendLicense = {
  id?: unknown;
  spdx_id?: unknown;
  shortname?: unknown;
  fullname?: unknown;
  text?: unknown;
  url?: unknown;
  notes?: unknown;
  source?: unknown;
  risk?: unknown;
  copyleft?: unknown;
  OSIapproved?: unknown;
  text_updatable?: unknown;
  active?: unknown;
};

function asLicense(value: BackendLicense) {
  return {
    id: typeof value.id === "string" ? value.id : "",
    spdxId: typeof value.spdx_id === "string" ? value.spdx_id : "",
    shortName: typeof value.shortname === "string" ? value.shortname : "",
    fullName: typeof value.fullname === "string" ? value.fullname : "",
    text: typeof value.text === "string" ? value.text : "",
    url: typeof value.url === "string" ? value.url : "",
    notes: typeof value.notes === "string" ? value.notes : "",
    source: typeof value.source === "string" ? value.source : "",
    risk: typeof value.risk === "number" && Number.isFinite(value.risk) ? value.risk : null,
    copyleft: typeof value.copyleft === "boolean" ? value.copyleft : false,
    osiApproved: typeof value.OSIapproved === "boolean" ? value.OSIapproved : false,
    textUpdatable: typeof value.text_updatable === "boolean" ? value.text_updatable : false,
    active: typeof value.active === "boolean" ? value.active : true,
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
    const response = await fetchJson<{ data?: BackendLicense[] }>(`${backend.apiUrl}/licenses/${encodeURIComponent(id)}`, { headers: backend.headers, cache: "no-store" });
    const license = response.data?.[0];
    if (!license) return NextResponse.json({ error: "License not found" }, { status: 404 });
    return NextResponse.json({ data: asLicense(license) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    return NextResponse.json({ error: "Unable to load license" }, { status });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const backend = await getBackendRequest(request);
  if (!backend) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid license details" }, { status: 400 });
  }

  try {
    const response = await fetchJson<{ data?: BackendLicense[] }>(`${backend.apiUrl}/licenses/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { ...backend.headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const license = response.data?.[0];
    return NextResponse.json({ data: license ? asLicense(license) : null });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    return NextResponse.json({ error: "Unable to update license" }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const backend = await getBackendRequest(request);
  if (!backend) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { id } = await params;

  try {
    const response = await fetch(`${backend.apiUrl}/licenses/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: backend.headers,
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: "Unable to delete license" }, { status: response.status });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Unable to delete license" }, { status: 502 });
  }
}