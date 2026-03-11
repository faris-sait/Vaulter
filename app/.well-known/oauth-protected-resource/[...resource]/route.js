import { NextResponse } from 'next/server';
import { getProtectedResourceMetadata, getRequestOrigin } from '../../../../lib/server/mcp-oauth.js';

export async function GET(request, { params }) {
  const { resource } = await params;
  const resourcePath = Array.isArray(resource) ? resource.join('/') : '';

  if (resourcePath !== 'mcp') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(getProtectedResourceMetadata(getRequestOrigin(request)), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
