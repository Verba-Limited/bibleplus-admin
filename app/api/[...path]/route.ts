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
  let response: Response;

  try {
    response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
    });
  } catch (error) {
    const cause =
      error instanceof Error && "cause" in error
        ? (error.cause as { code?: string; hostname?: string } | undefined)
        : undefined;
    const hostname = cause?.hostname || targetUrl.hostname;
    const code = cause?.code ? ` (${cause.code})` : "";

    return NextResponse.json(
      {
        success: false,
        message: `Could not reach the BiblePlus backend at ${hostname}${code}. Check API_URL/NEXT_PUBLIC_API_URL or confirm the backend is online.`,
      },
      { status: 502 },
    );
  }

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
