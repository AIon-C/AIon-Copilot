import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const uploadUrl = formData.get('uploadUrl');
    const file = formData.get('file');

    if (typeof uploadUrl !== 'string' || !uploadUrl) {
      return NextResponse.json({ error: 'uploadUrl is required' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const contentType = file.type || 'application/octet-stream';
    const uploadMethod = uploadUrl.includes('/upload/storage/v1/') ? 'POST' : 'PUT';

    const uploadResponse = await fetch(uploadUrl, {
      method: uploadMethod,
      headers: {
        'Content-Type': contentType,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      const detail = await uploadResponse.text();
      return NextResponse.json(
        {
          error: 'Failed to upload file',
          detail,
          status: uploadResponse.status,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected upload proxy error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
