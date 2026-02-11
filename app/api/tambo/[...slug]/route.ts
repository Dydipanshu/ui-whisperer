import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS(req: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  return new NextResponse(null, { status: 204, headers });
}

export async function POST(
  req: NextRequest,
  context: { params: { slug: string[] } }
) {
  const { params } = context;
  const slug = params.slug.join("/");
  const url = `https://api.tambo.co/${slug}`;

  try {
    const body = await req.json();
    const tamboResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.get("Authorization") ?? "",
      },
      body: JSON.stringify(body),
    });

    const responseHeaders = new Headers(tamboResponse.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");


    return new NextResponse(tamboResponse.body, {
      status: tamboResponse.status,
      statusText: tamboResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`Failed to proxy request to ${url}`, error);
    return NextResponse.json(
      { success: false, error: "Proxying failed" },
      { status: 500 }
    );
  }
}
