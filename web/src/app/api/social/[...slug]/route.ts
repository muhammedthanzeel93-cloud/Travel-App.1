import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

async function forwardToBackend(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const url = new URL(req.url);
  const targetUrl = `${BACKEND_URL}/api/v1/social/${slug.join('/')}${url.search}`;
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'content-length') headers.set(key, value);
  });

  try {
    const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer();
    const response = await fetch(targetUrl, { method: req.method, headers, body });
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => responseHeaders.set(key, value));
    return new NextResponse(await response.arrayBuffer(), {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Social service is temporarily unavailable.' },
      { status: 503 }
    );
  }
}

export const GET = forwardToBackend;
export const POST = forwardToBackend;
export const PUT = forwardToBackend;
export const DELETE = forwardToBackend;
