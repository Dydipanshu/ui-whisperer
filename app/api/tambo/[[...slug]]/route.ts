import { NextRequest, NextResponse } from "next/server";

const TAMBO_API_BASE = "https://api.tambo.co";

async function proxyRequest(req: NextRequest, context: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await context.params;
  const searchParams = req.nextUrl.search;
  const path = slug.length > 0 ? `/${slug.join("/")}` : "";
  const url = `${TAMBO_API_BASE}${path}${searchParams}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");

  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      cache: "no-store",
      // @ts-ignore - duplex is required for streaming bodies in some environments
      duplex: "half",
    };

    const tamboResponse = await fetch(url, fetchOptions);

    const responseHeaders = new Headers(tamboResponse.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.delete("content-encoding");

    return new NextResponse(tamboResponse.body, {
      status: tamboResponse.status,
      statusText: tamboResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Proxy Error] ${req.method} ${url}:`, errorMessage);
    return NextResponse.json(
      { success: false, error: "Proxying failed", details: errorMessage },
      { status: 500 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};
