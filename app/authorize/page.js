import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Bot, KeyRound, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { issueAuthorizationConsent, parseAuthorizationRequest } from '../../lib/server/mcp-oauth.js';

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

  try {
    authorization = parseAuthorizationRequest(searchParams, origin);
  } catch (error) {
    errorMessage = error.message;
  }

  if (!authorization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 md:p-8 text-white flex items-center justify-center">
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl p-8 max-w-xl w-full">
          <p className="text-sm uppercase tracking-[0.24em] text-rose-300">OAuth Request Error</p>
          <h1 className="text-3xl font-bold mt-3">This MCP sign-in request is invalid</h1>
          <p className="text-slate-300 mt-3">{errorMessage || 'Vaulter could not validate the incoming authorization request.'}</p>
          <Button asChild className="mt-6 bg-white/10 hover:bg-white/15 text-white border border-white/10">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Vaulter
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const { client, params } = authorization;
  const consentToken = issueAuthorizationConsent({ userId, params });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 md:p-8 text-white">
      <div className="max-w-3xl mx-auto">
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl p-8 md:p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Authorize MCP Client</p>
              <h1 className="text-4xl font-bold mt-3 tracking-tight">Allow {client.client_name || 'this client'} to use Vaulter?</h1>
              <p className="text-slate-300 mt-3 max-w-2xl">
                This client is requesting browser-based MCP access. After you approve, it will receive an MCP token and reconnect automatically.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              Signed in as <span className="font-medium text-white">{user?.primaryEmailAddress?.emailAddress || user?.username || user?.id}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mt-8">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <Bot className="w-5 h-5 text-cyan-300 mb-3" />
              <p className="font-medium">Client</p>
              <p className="text-sm text-slate-400 mt-1 break-all">{client.client_name || 'Unnamed MCP client'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <KeyRound className="w-5 h-5 text-indigo-300 mb-3" />
              <p className="font-medium">Requested scope</p>
              <p className="text-sm text-slate-400 mt-1">{params.scopes.join(', ')}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <Shield className="w-5 h-5 text-emerald-300 mb-3" />
              <p className="font-medium">Resource</p>
              <p className="text-sm text-slate-400 mt-1 break-all">{params.resource}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/25 p-5 mt-8">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">This access allows the client to</p>
            <ul className="mt-4 space-y-2 text-slate-200">
              <li>- List your vault entries with masked metadata</li>
              <li>- Request decrypted secrets only when it explicitly calls Vaulter MCP tools</li>
              <li>- Add and remove vault entries on your behalf</li>
            </ul>
          </div>

          <form action="/api/oauth/authorize" method="post" className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            {hiddenInput('client_id', params.clientId)}
            {hiddenInput('redirect_uri', params.redirectUri)}
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
              className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
            >
              Deny
            </Button>
            <Button
              type="submit"
              name="decision"
              value="allow"
              className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white"
            >
              Approve access
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
