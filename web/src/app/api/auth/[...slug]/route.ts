import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

/**
 * High-performance, transparent API Proxy
 * Forwards all auth requests to the unified Express Backend (Single Source of Truth)
 */
async function forwardToBackend(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = slug.join('/');

  const url = new URL(req.url);
  const search = url.search;
  const targetUrl = `${BACKEND_URL}/api/v1/auth/${path}${search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k !== 'host' && k !== 'content-length') {
      headers.set(key, value);
    }
  });

  try {
    let body: any = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await req.arrayBuffer();
    }

    const res = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      // @ts-ignore
      duplex: 'half'
    });

    const resHeaders = new Headers();
    res.headers.forEach((value, key) => {
      resHeaders.set(key, value);
    });

    const resBody = await res.arrayBuffer();
    return new NextResponse(resBody, {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders
    });
  } catch (err: any) {
    console.error(`[AUTH PROXY] Could not reach backend at ${targetUrl}:`, err.message);
    return NextResponse.json(
      {
        success: false,
        message: 'Authentication service temporarily unavailable. Ensure Express backend is running on port 5000.',
        error: err.message
      },
      { status: 503 }
    );
  }
}

export const GET = forwardToBackend;
export const POST = forwardToBackend;
export const PUT = forwardToBackend;
export const DELETE = forwardToBackend;
