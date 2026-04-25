import { NextRequest, NextResponse } from "next/server";

function backendBaseUrl() {
  return process.env.MZTEK_API_BASE_URL || "http://127.0.0.1:4321/api";
}

function buildTargetUrl(request: NextRequest, params: { path?: string[] }) {
  const joined = (params.path || []).join("/");
  const target = new URL(`${backendBaseUrl()}/${joined}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });
  return target;
}

async function proxy(method: "GET" | "POST", request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  try {
    const params = await context.params;
    const target = buildTargetUrl(request, params);
    const init: RequestInit = { method };

    if (method !== "GET") {
      init.headers = {
        "content-type": "application/json"
      };
      init.body = await request.text();
    }

    const response = await fetch(target, init);
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Proxy request failed."
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxy("GET", request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxy("POST", request, context);
}
