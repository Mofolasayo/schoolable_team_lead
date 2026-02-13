import { NextRequest, NextResponse } from 'next/server';

type DeliveryCheckResponse = {
  url: string;
  status: number;
  statusText: string;
  blocked: boolean;
  ok: boolean;
  checkedAt: string;
  resolvedUrl?: string;
  contentType?: string | null;
  contentLength?: string | null;
};

async function checkWithHead(url: string) {
  return fetch(url, { method: 'HEAD', redirect: 'follow' });
}

async function checkWithRangeGet(url: string) {
  return fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      Range: 'bytes=0-512',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const url = typeof body?.url === 'string' ? body.url.trim() : '';

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let response: Response;
    try {
      response = await checkWithHead(url);
      if (response.status === 405 || response.status === 501) {
        response = await checkWithRangeGet(url);
      }
    } catch {
      response = await checkWithRangeGet(url);
    }

    const status = response.status;
    const blocked = status === 401 || status === 403;
    const payload: DeliveryCheckResponse = {
      url,
      status,
      statusText: response.statusText || 'Unknown',
      blocked,
      ok: response.ok,
      checkedAt: new Date().toISOString(),
      resolvedUrl: response.url || undefined,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Delivery check failed:', error);
    return NextResponse.json(
      { error: 'Failed to check delivery status' },
      { status: 500 }
    );
  }
}
