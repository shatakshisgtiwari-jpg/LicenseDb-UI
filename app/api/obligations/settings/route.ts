import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { ApiError, fetchJson } from "@/lib/api";

type SettingKind = "type" | "category" | "classification";
type BackendSetting = { type?: unknown; category?: unknown; classification?: unknown; color?: unknown };

const settings = {
  type: { path: "types", field: "type" },
  category: { path: "categories", field: "category" },
  classification: { path: "classifications", field: "classification" },
} as const;

function isSettingKind(value: unknown): value is SettingKind {
  return value === "type" || value === "category" || value === "classification";
}

function item(kind: SettingKind, value: BackendSetting) {
  const field = settings[kind].field;
  const name = value[field];
  return { value: typeof name === "string" ? name : "", color: typeof value.color === "string" ? value.color : "" };
}

async function backend(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const accessToken = token?.backendTokens?.accessToken;
  const baseUrl = process.env.LICENSEDB_API_URL;
  if (!accessToken || !baseUrl) return null;
  return { apiUrl: baseUrl.replace(/\/+$/, ""), headers: { Authorization: `Bearer ${accessToken}` } };
}

export async function GET(request: NextRequest) {
  const connection = await backend(request);
  if (!connection) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  try {
    const responses = await Promise.all((Object.keys(settings) as SettingKind[]).map(async (kind) => {
      const result = await fetchJson<{ data?: BackendSetting[] }>(`${connection.apiUrl}/obligations/${settings[kind].path}?active=true`, { headers: connection.headers, cache: "no-store" });
      return [kind, result.data?.map((value) => item(kind, value)).filter((value) => value.value) ?? []] as const;
    }));
    return NextResponse.json(Object.fromEntries(responses), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: "Unable to load obligation settings" }, { status: error instanceof ApiError ? error.status : 502 });
  }
}

export async function POST(request: NextRequest) {
  const connection = await backend(request);
  if (!connection) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid setting" }, { status: 400 });
  const { kind, value, color } = body as { kind?: unknown; value?: unknown; color?: unknown };
  if (!isSettingKind(kind) || typeof value !== "string" || !value.trim() || (kind === "classification" && (typeof color !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(color)))) return NextResponse.json({ error: "Invalid setting" }, { status: 400 });
  const field = settings[kind].field;
  const payload = { [field]: value.trim().toUpperCase(), ...(kind === "classification" ? { color } : {}) };
  try {
    const response = await fetchJson<{ data?: BackendSetting[] }>(`${connection.apiUrl}/obligations/${settings[kind].path}`, { method: "POST", headers: { ...connection.headers, "Content-Type": "application/json" }, body: JSON.stringify(payload), cache: "no-store" });
    return NextResponse.json({ data: response.data?.[0] ? item(kind, response.data[0]) : null }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Unable to create obligation setting" }, { status: error instanceof ApiError ? error.status : 502 });
  }
}

export async function DELETE(request: NextRequest) {
  const connection = await backend(request);
  if (!connection) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const kind = request.nextUrl.searchParams.get("kind");
  const value = request.nextUrl.searchParams.get("value");
  if (!isSettingKind(kind) || !value) return NextResponse.json({ error: "Invalid setting" }, { status: 400 });
  try {
    const response = await fetch(`${connection.apiUrl}/obligations/${settings[kind].path}/${encodeURIComponent(value)}`, { method: "DELETE", headers: connection.headers, cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: "Unable to remove obligation setting" }, { status: response.status });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Unable to remove obligation setting" }, { status: 502 });
  }
}