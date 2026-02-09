'use client';

import { useUser, SignIn } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function CliAuthContent() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('idle'); // idle | authorizing | success | error | denied
  const [errorMsg, setErrorMsg] = useState('');

  const port = searchParams.get('port');
  const state = searchParams.get('state');

  const isValid = port && /^\d+$/.test(port) && state;

  const handleAuthorize = async () => {
    if (!isValid) return;
    setStatus('authorizing');

    try {
      const res = await fetch('/api/cli/create-token', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create token');
      }
      const { token } = await res.json();

      // Redirect to CLI's local server
      window.location.href = `http://localhost:${port}/callback?token=${encodeURIComponent(token)}&state=${encodeURIComponent(state)}`;
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  const handleDeny = () => {
    setStatus('denied');
    if (isValid) {
      window.location.href = `http://localhost:${port}/callback?error=denied&state=${encodeURIComponent(state)}`;
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <p className="text-white text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Vaulter CLI</h1>
            <p className="text-purple-300">Sign in to authorize the CLI</p>
          </div>
          <SignIn afterSignInUrl={`/cli-auth?port=${port || ''}&state=${state || ''}`} />
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Invalid Request</h2>
          <p className="text-purple-300">Missing or invalid parameters. Please start the authorization from the CLI.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <Lock className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Authorize Vaulter CLI</h2>
          <p className="text-purple-300 text-sm">
            The Vaulter CLI is requesting access to your vault.
          </p>
        </div>

        <div className="bg-black/30 rounded-lg p-4 mb-6">
          <p className="text-purple-200 text-sm mb-1">Signed in as:</p>
          <p className="text-white font-medium">
            {user.primaryEmailAddress?.emailAddress || user.username || user.id}
          </p>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-6">
          <p className="text-purple-200 text-sm">The CLI will be able to:</p>
          <ul className="text-purple-300 text-sm mt-2 space-y-1 list-disc list-inside">
            <li>View and list your API keys</li>
            <li>Add new API keys to your vault</li>
            <li>Delete API keys from your vault</li>
          </ul>
        </div>

        {status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{errorMsg}</p>
          </div>
        )}

        {status === 'denied' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
            <p className="text-yellow-400 text-sm">Authorization denied. You can close this tab.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
            <p className="text-green-400 text-sm">Authorized! Redirecting to CLI...</p>
          </div>
        )}

        {status === 'idle' && (
          <div className="flex gap-3">
            <Button
              onClick={handleDeny}
              variant="outline"
              className="flex-1 border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
            >
              Deny
            </Button>
            <Button
              onClick={handleAuthorize}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              Authorize
            </Button>
          </div>
        )}

        {status === 'authorizing' && (
          <div className="text-center">
            <p className="text-purple-300">Authorizing...</p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function CliAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <p className="text-white text-lg">Loading...</p>
      </div>
    }>
      <CliAuthContent />
    </Suspense>
  );
}
