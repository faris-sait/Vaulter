import Image from 'next/image';
import Link from 'next/link';
import { auth, currentUser } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ArrowLeft, Bot, Key, Lock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getOAuthClient, issueAuthorizationConsent, parseAuthorizationRequest } from '../../lib/server/mcp-oauth.js';

function resolveOrigin(headerStore) {
  const host = headerStore.get('x-forwarded-host') || headerStore.get('host');
  const protocol = headerStore.get('x-forwarded-proto') || 'https';
  return `${protocol}://${host}`;
}

function hiddenInput(name, value) {
  return <input type="hidden" name={name} value={value || ''} />;
}

export default async function AuthorizePage({ searchParams }) {
  const { userId } = await auth();

  const redirectSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams || {})) {
    if (Array.isArray(value)) {
      value.forEach((item) => redirectSearchParams.append(key, item));
    } else if (typeof value === 'string') {
      redirectSearchParams.set(key, value);
    }
  }

  const redirectUrl = `/authorize${redirectSearchParams.toString() ? `?${redirectSearchParams.toString()}` : ''}`;

  if (!userId) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`);
  }

  const user = await currentUser();
  const headerStore = headers();
  const origin = resolveOrigin(headerStore);
  let authorization;
  let errorMessage = '';
  let errorDetails;

  try {
    authorization = parseAuthorizationRequest(searchParams, origin);
  } catch (error) {
    errorMessage = error.message;

    try {
      const clientId = typeof searchParams?.client_id === 'string' ? searchParams.client_id : '';
      const requestedRedirectUri = typeof searchParams?.redirect_uri === 'string' ? searchParams.redirect_uri : '';
      const client = clientId ? getOAuthClient(clientId) : undefined;

      errorDetails = {
        clientName: client?.client_name,
        tokenEndpointAuthMethod: client?.token_endpoint_auth_method,
        requestedRedirectUri,
        registeredRedirectUris: client?.redirect_uris || [],
      };

      console.error('MCP OAuth authorization request failed', {
        error: error.message,
        clientName: client?.client_name,
        tokenEndpointAuthMethod: client?.token_endpoint_auth_method,
        requestedRedirectUri,
        registeredRedirectUris: client?.redirect_uris || [],
      });
    } catch {
      errorDetails = undefined;
    }
  }

  if (!authorization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 flex flex-col">
        <div className="max-w-7xl mx-auto mb-8 w-full">
          <div className="flex items-center gap-1 mb-8">
            <Image
              src="/assets/vaulter-logo.svg"
              alt="Vaulter Logo"
              width={100}
              height={100}
            />
            <div>
              <h1 className="text-5xl font-bold text-white tracking-tight">Vaulter</h1>
              <p className="text-purple-200 text-lg font-medium">Your keys. Your vault. Your control.</p>
            </div>
          </div>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-8 max-w-2xl mx-auto text-center">
            <Lock className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <p className="text-purple-200 text-sm uppercase tracking-[0.24em]">OAuth Request Error</p>
            <h2 className="text-3xl font-bold text-white mt-3">This MCP sign-in request is invalid</h2>
            <p className="text-purple-300 mt-4">
              {errorMessage || 'Vaulter could not validate the incoming authorization request.'}
            </p>
            {errorDetails ? (
              <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-200">OAuth Debug</p>
                {errorDetails.clientName ? (
                  <p className="mt-3 text-sm text-purple-100">
                    Client: <span className="font-medium text-white">{errorDetails.clientName}</span>
                  </p>
                ) : null}
                {errorDetails.tokenEndpointAuthMethod ? (
                  <p className="mt-2 text-sm text-purple-100">
                    Auth method: <span className="font-medium text-white">{errorDetails.tokenEndpointAuthMethod}</span>
                  </p>
                ) : null}
                {errorDetails.requestedRedirectUri ? (
                  <div className="mt-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-purple-300">Requested redirect URI</p>
                    <p className="mt-1 break-all rounded-lg bg-black/30 px-3 py-2 font-mono text-xs text-white">
                      {errorDetails.requestedRedirectUri}
                    </p>
                  </div>
                ) : null}
                {errorDetails.registeredRedirectUris.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-purple-300">Registered redirect URIs</p>
                    <div className="mt-1 space-y-2">
                      {errorDetails.registeredRedirectUris.map((uri) => (
                        <p
                          key={uri}
                          className="break-all rounded-lg bg-black/30 px-3 py-2 font-mono text-xs text-white"
                        >
                          {uri}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            <Button asChild className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Vault
              </Link>
            </Button>
          </Card>
        </div>

        <div className="max-w-7xl mx-auto mt-auto pt-12 w-full">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-purple-200 text-sm font-medium">Hosted MCP access secured by Vaulter</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { client, params } = authorization;
  const consentToken = issueAuthorizationConsent({ userId, params });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 flex flex-col">
      <div className="max-w-7xl mx-auto mb-8 w-full">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between mb-8">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors mb-5">
              <ArrowLeft className="w-4 h-4" />
              Back to Vault
            </Link>
            <div className="flex items-center gap-1 mb-2">
              <Image
                src="/assets/vaulter-logo.svg"
                alt="Vaulter Logo"
                width={90}
                height={90}
              />
              <div>
                <h1 className="text-5xl font-bold text-white tracking-tight">Authorize MCP</h1>
                <p className="text-purple-200 text-lg font-medium mt-2">Browser sign-in for hosted Vaulter access.</p>
              </div>
            </div>
            <p className="text-purple-300 max-w-3xl">
              {client.client_name || 'This client'} wants access to your hosted Vaulter MCP server. If you approve, the client receives an OAuth token and reconnects automatically without asking you for manual bearer credentials.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 self-start">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-purple-100 text-sm font-medium">
              Signed in as {user?.primaryEmailAddress?.emailAddress || user?.username || user?.id}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm">Client</p>
                <p className="text-2xl font-bold text-white mt-1 break-words">{client.client_name || 'Unnamed'}</p>
              </div>
              <Bot className="w-12 h-12 text-purple-400" />
            </div>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm">Requested Scope</p>
                <p className="text-2xl font-bold text-white mt-1">{params.scopes.join(', ')}</p>
              </div>
              <Key className="w-12 h-12 text-blue-400" />
            </div>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-purple-200 text-sm">Resource</p>
                <p className="text-base font-semibold text-white mt-1 break-all">{params.resource}</p>
              </div>
              <Shield className="w-12 h-12 text-green-400 shrink-0" />
            </div>
          </Card>
        </div>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-3">What this approval allows</h2>
          <p className="text-purple-200 mb-5">
            Vaulter keeps the same vault boundaries you already use in the vault. The client only gets access through explicit MCP tool calls.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-white font-medium">Masked vault listing</p>
              <p className="text-sm text-purple-200 mt-2">List your stored keys without exposing plaintext values by default.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-white font-medium">Explicit secret access</p>
              <p className="text-sm text-purple-200 mt-2">Decrypt secrets only when the client deliberately calls Vaulter MCP tools.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-white font-medium">Vault management</p>
              <p className="text-sm text-purple-200 mt-2">Add and remove vault entries on your behalf using the same hosted account.</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Approve this client</h2>
              <p className="text-purple-200 mt-2">Approve to continue the OAuth flow, or deny to send the client back without access.</p>
            </div>

            <form action="/api/oauth/authorize" method="post" className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {hiddenInput('client_id', params.clientId)}
              {hiddenInput('redirect_uri', params.redirectUri)}
              {hiddenInput('response_type', 'code')}
              {hiddenInput('state', params.state)}
              {hiddenInput('code_challenge', params.codeChallenge)}
              {hiddenInput('code_challenge_method', params.codeChallengeMethod)}
              {hiddenInput('scope', params.scopes.join(' '))}
              {hiddenInput('resource', params.resource)}
              {hiddenInput('consent_token', consentToken)}

              <Button
                type="submit"
                name="decision"
                value="deny"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                Deny
              </Button>
              <Button
                type="submit"
                name="decision"
                value="allow"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                Approve access
              </Button>
            </form>
          </div>
        </Card>
      </div>

      <div className="max-w-7xl mx-auto mt-auto pt-12 w-full">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="text-purple-200 text-sm font-medium">Hosted MCP access secured by Vaulter</span>
          </div>
        </div>
      </div>
    </div>
  );
}
