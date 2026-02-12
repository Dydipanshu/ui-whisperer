import { NextRequest } from "next/server";

// Revert to nodejs for more stable stream proxying
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAMBO_API_BASE = "https://api.tambo.co";

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;
  const searchParams = req.nextUrl.search;
  const path = slug.length > 0 ? `/${slug.join("/")}` : "";
  const url = `${TAMBO_API_BASE}${path}${searchParams}`;

  const headers = new Headers(req.headers);
  // Remove headers that will interfere with the destination request
  const toDelete = ["host", "connection", "origin", "referer", "x-forwarded-for", "x-forwarded-proto", "x-forwarded-host", "content-length"];
  toDelete.forEach(h => headers.delete(h));

  try {
    const res = await fetch(url, {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      // @ts-ignore
      duplex: "half",
    });

    const responseHeaders = new Headers(res.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    
    // Crucial: remove headers that cause chunking/encoding issues in the proxy
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("transfer-encoding");

    // Force stream headers for the advancestream endpoint
    if (url.includes("advancestream")) {
      responseHeaders.set("Content-Type", "text/event-stream");
      responseHeaders.set("Cache-Control", "no-cache, no-transform");
      responseHeaders.set("X-Accel-Buffering", "no"); // Disable buffering in Nginx/Vercel
    }

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`[Proxy Error] ${req.method} ${url}:`, error);
    return new Response(JSON.stringify({ success: false, error: "Proxying failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const OPTIONS = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-tambo-project-id",
    },
  });
};
