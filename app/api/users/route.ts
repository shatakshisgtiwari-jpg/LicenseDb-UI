import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { ApiError, fetchJson } from "@/lib/api";

type BackendUser = {
  id?: unknown;
  user_name?: unknown;
  display_name?: unknown;
  user_email?: unknown;
  user_level?: unknown;
};

function asUser(value: BackendUser) {
  return {
    id: typeof value.id === "string" ? value.id : "",
    username: typeof value.user_name === "string" ? value.user_name : "",
    displayName: typeof value.display_name === "string" ? value.display_name : "",
    email: typeof value.user_email === "string" ? value.user_email : "",
    accessLevel: typeof value.user_level === "string" ? value.user_level : "USER",
  };
}

async function getBackendRequest(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const accessToken = token?.backendTokens?.accessToken;
  const baseUrl = process.env.LICENSEDB_API_URL;

  if (!accessToken || !baseUrl) return null;
  return {
    apiUrl: baseUrl.replace(/\/+$/, ""),
    headers: { Authorization: `Bearer ${accessToken}` },
  };
}

export async function GET(request: NextRequest) {
  const backend = await getBackendRequest(request);
  if (!backend) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const page = request.nextUrl.searchParams.get("page") ?? "1";
  const limit = request.nextUrl.searchParams.get("limit") ?? "10";

  try {
    const response = await fetchJson<{
      data?: BackendUser[];
      paginationmeta?: { resource_count?: unknown; total_pages?: unknown; page?: unknown; limit?: unknown };
    }>(`${backend.apiUrl}/users?active=true&page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`, {
      headers: backend.headers,
      cache: "no-store",
    });
    const pagination = response.paginationmeta;

    return NextResponse.json({
      data: response.data?.map(asUser) ?? [],
      pagination: {
        resourceCount: typeof pagination?.resource_count === "number" ? pagination.resource_count : 0,
        totalPages: typeof pagination?.total_pages === "number" ? pagination.total_pages : 1,
        page: typeof pagination?.page === "number" ? pagination.page : Number(page),
        limit: typeof pagination?.limit === "number" ? pagination.limit : Number(limit),
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    return NextResponse.json({ error: "Unable to load users" }, { status });
  }
}

export async function POST(request: NextRequest) {
  const backend = await getBackendRequest(request);
  if (!backend) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid user details" }, { status: 400 });
  }

  try {
    const response = await fetchJson<{ data?: BackendUser[] }>(`${backend.apiUrl}/users`, {
      method: "POST",
      headers: { ...backend.headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    return NextResponse.json({ data: response.data?.map(asUser) ?? [] }, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    return NextResponse.json({ error: "Unable to create user" }, { status });
  }
}