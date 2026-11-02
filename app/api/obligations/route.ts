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

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const accessToken = token?.backendTokens?.accessToken;
  const baseUrl = process.env.LICENSEDB_API_URL;

  if (!accessToken) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!baseUrl) return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });

  const page = request.nextUrl.searchParams.get("page") ?? "1";
  const limit = request.nextUrl.searchParams.get("limit") ?? "15";
  const search = request.nextUrl.searchParams.get("search") ?? "";
  const orderBy = request.nextUrl.searchParams.get("orderBy");
  const query = new URLSearchParams({ active: "true", page, limit });
  if (search) query.set("search", search);
  if (orderBy === "asc" || orderBy === "desc") query.set("order_by", orderBy);

  try {
    const response = await fetchJson<{
      data?: BackendObligation[] | null;
      paginationmeta?: { resource_count?: unknown; page?: unknown; limit?: unknown };
    }>(`${baseUrl.replace(/\/+$/, "")}/obligations?${query}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const pagination = response.paginationmeta;
    const resourceCount = typeof pagination?.resource_count === "number" ? pagination.resource_count : 0;
    const responseLimit = typeof pagination?.limit === "number" ? pagination.limit : Number(limit);

    return NextResponse.json({
      data: response.data?.map(asObligation) ?? [],
      pagination: {
        resourceCount,
        totalPages: Math.max(1, Math.ceil(resourceCount / responseLimit)),
        page: typeof pagination?.page === "number" ? pagination.page : Number(page),
        limit: responseLimit,
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    return NextResponse.json({ error: "Unable to load obligations" }, { status });
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
    return NextResponse.json({ error: "Invalid obligation details" }, { status: 400 });
  }

  try {
    const response = await fetchJson<{ data?: BackendObligation[] }>(`${baseUrl.replace(/\/+$/, "")}/obligations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const obligation = response.data?.[0];
    return NextResponse.json({ data: obligation ? asObligation(obligation) : null }, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    return NextResponse.json({ error: "Unable to create obligation" }, { status });
  }
}