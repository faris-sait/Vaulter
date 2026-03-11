'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { ArrowLeft, Bot, Check, Copy, ExternalLink, KeyRound, PlugZap, Shield, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function MpcAccessPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState('');
  const [label, setLabel] = useState('');
  const [freshToken, setFreshToken] = useState('');
  const [freshTokenLabel, setFreshTokenLabel] = useState('');
  const [copied, setCopied] = useState('');

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const configSnippet = useMemo(() => {
    if (!freshToken || !origin) {
      return '';
    }

    return JSON.stringify(
      {
        mcpServers: {
          vaulter: {
            url: `${origin}/mcp`,
            headers: {
              Authorization: `Bearer ${freshToken}`,
            },
          },
        },
      },
      null,
      2
    );
  }, [freshToken, origin]);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/mcp/tokens');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load tokens');
      }

      setTokens(data.tokens || []);
    } catch (error) {
      toast({
        title: 'Could not load MCP tokens',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (value, key) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied((current) => (current === key ? '' : current)), 1800);
    toast({
      title: 'Copied',
      description: 'Saved to your clipboard.',
    });
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      const res = await fetch('/api/mcp/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create token');
      }

      setFreshToken(data.token);
      setFreshTokenLabel(data.item?.label || 'Default');
      setLabel('');
      setTokens((current) => [data.item, ...current]);
      toast({
        title: 'MCP token created',
        description: 'Copy it now. It will only be shown once.',
      });
    } catch (error) {
      toast({
        title: 'Could not create token',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (tokenId) => {
    try {
      setRevokingId(tokenId);
      const res = await fetch(`/api/mcp/tokens/${tokenId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to revoke token');
      }

      setTokens((current) => current.filter((token) => token.id !== tokenId));
      toast({
        title: 'Token revoked',
        description: `${data.revoked?.label || 'MCP token'} can no longer access Vaulter.`,
      });
    } catch (error) {
      toast({
        title: 'Could not revoke token',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setRevokingId('');
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return 'Never';
    }

    return new Date(value).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 md:p-8 text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to vault
            </Link>
            <h1 className="text-4xl font-bold mt-3 tracking-tight">MCP Access</h1>
            <p className="text-slate-300 mt-2 max-w-2xl">
              Vaulter now supports browser-based MCP OAuth. Use this page when a client still needs a manual bearer token fallback.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 max-w-md">
            Signed in as <span className="font-medium text-white">{user?.primaryEmailAddress?.emailAddress || user?.username || user?.id}</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-indigo-500/15 p-3">
                  <PlugZap className="w-6 h-6 text-indigo-300" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">Create a fallback MCP token</h2>
                  <p className="text-slate-300 mt-1">
                    If your AI client supports MCP OAuth, just point it at `/mcp` and sign in through the browser. Use a token here only when manual bearer auth is still required.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <Input
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="Label this token, for example Claude Code"
                  className="bg-white/5 border-white/15 text-white placeholder:text-slate-400"
                />
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white"
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  {creating ? 'Creating...' : 'Create token'}
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <Shield className="w-5 h-5 text-emerald-300 mb-3" />
                  <p className="font-medium">Dedicated access</p>
                  <p className="text-sm text-slate-400 mt-1">Keep MCP access separate from your local CLI sign-in.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <Bot className="w-5 h-5 text-cyan-300 mb-3" />
                  <p className="font-medium">Works across clients</p>
                  <p className="text-sm text-slate-400 mt-1">Use the same endpoint with Claude Code, OpenCode, Cursor, or Copilot integrations when OAuth is unavailable.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <Trash2 className="w-5 h-5 text-rose-300 mb-3" />
                  <p className="font-medium">Easy revoke</p>
                  <p className="text-sm text-slate-400 mt-1">Delete one token without affecting the rest of your setup.</p>
                </div>
              </div>

              {freshToken && (
                <div className="rounded-3xl border border-emerald-400/25 bg-emerald-500/10 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-emerald-200">Copy This Now</p>
                      <h3 className="text-xl font-semibold mt-1">{freshTokenLabel}</h3>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => copyText(freshToken, 'token')}
                      className="border-emerald-300/30 text-emerald-100 hover:bg-emerald-400/10"
                    >
                      {copied === 'token' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied === 'token' ? 'Copied' : 'Copy token'}
                    </Button>
                  </div>
                  <div className="rounded-2xl bg-black/40 p-4 font-mono text-sm break-all text-emerald-100">
                    {freshToken}
                  </div>
                  <p className="text-sm text-emerald-200/90">
                    This plaintext token is shown only once. If you lose it, revoke it and create a new one.
                  </p>
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-5 h-full">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Endpoint & config</h2>
                  <p className="text-slate-300 mt-1">Point your AI client at the hosted MCP endpoint below.</p>
                </div>
                <Button variant="outline" asChild className="border-white/15 text-slate-100 hover:bg-white/10">
                  <a href="https://modelcontextprotocol.io" target="_blank" rel="noreferrer">
                    MCP docs
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>

              <div className="rounded-2xl bg-black/30 p-4 space-y-2">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Hosted Endpoint</p>
                <p className="font-mono break-all text-cyan-200">{origin ? `${origin}/mcp` : '/mcp'}</p>
              </div>

              <div className="rounded-2xl bg-black/30 p-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Generic Remote MCP Config</p>
                  {configSnippet && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyText(configSnippet, 'config')}
                      className="text-slate-200 hover:bg-white/10"
                    >
                      {copied === 'config' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied === 'config' ? 'Copied' : 'Copy'}
                    </Button>
                  )}
                </div>
                <pre className="rounded-2xl bg-slate-950/80 p-4 overflow-x-auto text-sm text-slate-100 whitespace-pre-wrap break-all">
                  {configSnippet || `Create a fallback token to generate a ready-to-paste config snippet for ${origin ? `${origin}/mcp` : 'your hosted /mcp endpoint'}.`}
                </pre>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 space-y-2">
                <p>1. Try OAuth first by pointing your client at `/mcp`.</p>
                <p>2. If the client asks for a manual bearer token, create one here.</p>
                <p>3. Paste the token into the MCP config and connect to your hosted Vaulter server.</p>
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-semibold">Issued MCP tokens</h2>
                <p className="text-slate-300 mt-1">These are manual fallback tokens. Revoke any token if a laptop, agent, or shared config should lose access.</p>
              </div>
              <Button variant="outline" onClick={loadTokens} className="border-white/15 text-slate-100 hover:bg-white/10">
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="rounded-2xl bg-black/20 p-8 text-center text-slate-300">Loading MCP tokens...</div>
            ) : tokens.length === 0 ? (
              <div className="rounded-2xl bg-black/20 p-8 text-center text-slate-300">No fallback MCP tokens yet. Create one only if your AI client cannot use browser-based OAuth.</div>
            ) : (
              <div className="space-y-3">
                {tokens.map((token) => (
                  <div key={token.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-medium text-white">{token.label}</p>
                      <div className="text-sm text-slate-400 mt-1 space-y-1">
                        <p>Created {formatDate(token.createdAt)}</p>
                        <p>Last used {formatDate(token.lastUsed)}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleRevoke(token.id)}
                      disabled={revokingId === token.id}
                      className="border-rose-400/20 text-rose-100 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {revokingId === token.id ? 'Revoking...' : 'Revoke'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
