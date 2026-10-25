import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { ApiError, fetchJson } from "@/lib/api";

type BackendLicense = {
  id?: unknown;
  spdx_id?: unknown;
  spdxid?: unknown;
  shortname?: unknown;
  fullname?: unknown;
  full_name?: unknown;
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
    spdxId: typeof value.spdx_id === "string" ? value.spdx_id : typeof value.spdxid === "string" ? value.spdxid : "",
    shortName: typeof value.shortname === "string" ? value.shortname : "",
    fullName: typeof value.fullname === "string" ? value.fullname : typeof value.full_name === "string" ? value.full_name : "",
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

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const accessToken = token?.backendTokens?.accessToken;
  const baseUrl = process.env.LICENSEDB_API_URL;

  if (!accessToken) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!baseUrl) return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });

  const page = request.nextUrl.searchParams.get("page") ?? "1";
  const limit = request.nextUrl.searchParams.get("limit") ?? "10";
  const search = request.nextUrl.searchParams.get("search") ?? "";
  const sortBy = request.nextUrl.searchParams.get("sortBy");
  const sortOrder = request.nextUrl.searchParams.get("sortOrder");
  const risk = request.nextUrl.searchParams.get("risk");
  const query = new URLSearchParams({ active: "true", page, limit });
  if (search) query.set("search", search);
  if (sortBy === "shortname" || sortBy === "risk") query.set("sort_by", sortBy);
  if (sortOrder === "asc" || sortOrder === "desc") query.set("sort_order", sortOrder);
  if (risk && /^[0-5](,[0-5])*$/.test(risk)) query.set("risk", risk);

  try {
    const response = await fetchJson<{
      data?: BackendLicense[] | null;
      paginationmeta?: { resource_count?: unknown; page?: unknown; limit?: unknown };
    }>(`${baseUrl.replace(/\/+$/, "")}/licenses?${query}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const pagination = response.paginationmeta;
    const resourceCount = typeof pagination?.resource_count === "number" ? pagination.resource_count : 0;
    const responseLimit = typeof pagination?.limit === "number" ? pagination.limit : Number(limit);

    return NextResponse.json({
      data: response.data?.map(asLicense) ?? [],
      pagination: {
        resourceCount,
        totalPages: Math.max(1, Math.ceil(resourceCount / responseLimit)),
        page: typeof pagination?.page === "number" ? pagination.page : Number(page),
        limit: responseLimit,
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    return NextResponse.json({ error: "Unable to load licenses" }, { status });
  }
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const accessToken = token?.backendTokens?.accessToken;
  const baseUrl = process.env.LICENSEDB_API_URL;

  if (!accessToken) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!baseUrl) return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid license details" }, { status: 400 });
  }

  try {
    const response = await fetchJson<{ data?: BackendLicense[] }>(`${baseUrl.replace(/\/+$/, "")}/licenses`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    return NextResponse.json({ data: response.data?.map(asLicense) ?? [] }, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    return NextResponse.json({ error: "Unable to create license" }, { status });
  }
}