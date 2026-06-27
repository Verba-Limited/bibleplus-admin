import { NextResponse, type NextRequest } from "next/server";

const API_BASE_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://bibleplus-backend-nhyo.onrender.com/api";

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const targetUrl = new URL(
    `${API_BASE_URL.replace(/\/$/, "")}/${path.join("/")}`,
  );
  targetUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
  });

  const responseHeaders = new Headers();
  const contentType = response.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
