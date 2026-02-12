import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge"; // Use Edge Runtime for high-performance streaming

const TAMBO_API_BASE = "https://api.tambo.co";

async function proxyRequest(req: NextRequest, context: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await context.params;
  const searchParams = req.nextUrl.search;
  const path = slug.length > 0 ? `/${slug.join("/")}` : "";
  const url = `${TAMBO_API_BASE}${path}${searchParams}`;

  // Selective header forwarding
  const headers = new Headers();
  const forwardHeaders = ["authorization", "content-type", "accept", "x-tambo-project-id"];
  
  forwardHeaders.forEach(h => {
    const val = req.headers.get(h);
    if (val) headers.set(h, val);
  });

  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      cache: "no-store",
    };

    // Edge runtime fetch supports streaming by default
    const tamboResponse = await fetch(url, fetchOptions);

    // Propagate critical streaming headers
    const responseHeaders = new Headers(tamboResponse.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.delete("content-encoding");
    
    // Ensure the client knows it's a stream
    if (url.includes("stream")) {
      responseHeaders.set("Content-Type", "text/event-stream");
      responseHeaders.set("Cache-Control", "no-cache");
      responseHeaders.set("Connection", "keep-alive");
    }

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
