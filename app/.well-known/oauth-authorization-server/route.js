import { NextResponse } from 'next/server';
import { getAuthorizationServerMetadata, getRequestOrigin } from '../../../lib/server/mcp-oauth.js';

export async function GET(request) {
  return NextResponse.json(getAuthorizationServerMetadata(getRequestOrigin(request)), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
