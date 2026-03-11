import { NextResponse } from 'next/server';

const MCP_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id, Last-Event-ID',
  'Access-Control-Expose-Headers': 'Mcp-Protocol-Version, Mcp-Session-Id, WWW-Authenticate',
};

const OAUTH_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Protocol-Version',
};

export function withCors(response, headers = MCP_CORS_HEADERS) {
  const merged = new Headers(response.headers);

  for (const [key, value] of Object.entries(headers)) {
    merged.set(key, value);
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: merged,
  });
}

export function withMcpCors(response) {
  return withCors(response, MCP_CORS_HEADERS);
}

export function withOAuthCors(response) {
  return withCors(response, OAUTH_CORS_HEADERS);
}
