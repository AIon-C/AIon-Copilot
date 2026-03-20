import { type NextRequest, NextResponse } from 'next/server';

const COPILOT_API_BASE_URL = process.env.COPILOT_API_BASE_URL ?? '';
const COPILOT_API_TOKEN = process.env.COPILOT_API_TOKEN ?? '';
const UPSTREAM_TIMEOUT_MS = 30_000;

type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(req: NextRequest, context: RouteContext) {
  if (!COPILOT_API_BASE_URL) {
    return NextResponse.json({ error: 'Copilot API is not configured.' }, { status: 503 });
  }

  const { path } = await context.params;
  const normalizedBaseUrl = COPILOT_API_BASE_URL.replace(/\/+$/, '');
  const upstreamPath = path.join('/');
  const upstreamUrl = `${normalizedBaseUrl}/${upstreamPath}${req.nextUrl.search}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined;

    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = req.headers.get('content-type') ?? 'application/json';
    const accept = req.headers.get('accept');
    if (accept) headers['Accept'] = accept;
    const incomingAuthorization = req.headers.get('authorization');
    if (incomingAuthorization) {
      headers['Authorization'] = incomingAuthorization;
    } else if (COPILOT_API_TOKEN) {
      headers['Authorization'] = `Bearer ${COPILOT_API_TOKEN}`;
    }

    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body,
      signal: controller.signal,
    });

    const responseHeaders = new Headers();
    const contentType = upstream.headers.get('content-type');
    if (contentType) responseHeaders.set('content-type', contentType);

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out.' }, { status: 408 });
    }
    return NextResponse.json({ error: 'Network request failed.' }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
