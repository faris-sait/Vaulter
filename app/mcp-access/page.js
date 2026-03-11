'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { ArrowLeft, Bot, Check, Clock, Copy, ExternalLink, Key, Shield, Trash2 } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 flex flex-col">
      <div className="max-w-7xl mx-auto mb-8 w-full">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between mb-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors mb-5">
              <ArrowLeft className="w-4 h-4" />
              Back to vault
            </Link>
            <div className="flex items-center gap-1 mb-2">
              <Image
                src="/assets/vaulter-logo.svg"
                alt="Vaulter Logo"
                width={90}
                height={90}
                className="vaulter-logo-spin"
              />
              <div>
                <h1 className="text-5xl font-bold text-white tracking-tight">MCP Access</h1>
                <p className="text-purple-200 text-lg font-medium mt-2">Browser OAuth first. Manual tokens only when you need them.</p>
              </div>
            </div>
            <p className="text-purple-300 max-w-3xl">
              Connect Claude Code, OpenCode, Cursor, and other MCP clients to your hosted Vaulter endpoint. This page mirrors the dashboard flow: clear status, one-click token creation, and easy revoke when a device should lose access.
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Fallback Tokens</p>
                  <p className="text-3xl font-bold text-white mt-1">{tokens.length}</p>
                </div>
                <Key className="w-12 h-12 text-purple-400" />
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Preferred Auth</p>
                  <p className="text-3xl font-bold text-white mt-1">OAuth</p>
                </div>
                <Bot className="w-12 h-12 text-blue-400" />
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Latest Token Activity</p>
                  <p className="text-3xl font-bold text-white mt-1">{tokens[0]?.lastUsed ? 'Active' : 'Idle'}</p>
                </div>
                <Clock className="w-12 h-12 text-green-400" />
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 h-full">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Create fallback token</h2>
                  <p className="text-purple-200 mt-2 max-w-2xl">
                    If your MCP client already supports browser sign-in, point it at `/mcp` and stop here. Only create a token when the client explicitly asks for a manual bearer credential.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 mb-6">
                <Input
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="Label this token, for example Claude Code"
                  className="bg-white/10 backdrop-blur-lg border-white/20 text-white placeholder:text-purple-300"
                />
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  <Key className="w-4 h-4 mr-2" />
                  {creating ? 'Creating...' : 'Create token'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <Shield className="w-5 h-5 text-green-400 mb-3" />
                  <p className="text-white font-medium">Separate access</p>
                  <p className="text-sm text-purple-200 mt-2">Keep agent access isolated from your local CLI credentials.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <Bot className="w-5 h-5 text-blue-400 mb-3" />
                  <p className="text-white font-medium">Cross-client fallback</p>
                  <p className="text-sm text-purple-200 mt-2">Use one hosted endpoint everywhere when OAuth is missing.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <Trash2 className="w-5 h-5 text-red-400 mb-3" />
                  <p className="text-white font-medium">Easy revoke</p>
                  <p className="text-sm text-purple-200 mt-2">Delete a single token without affecting the rest of your setup.</p>
                </div>
              </div>

              {freshToken && (
                <div className="rounded-2xl border border-green-400/20 bg-green-500/10 p-5">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <p className="text-green-200 text-sm uppercase tracking-[0.24em]">Copy This Now</p>
                      <h3 className="text-2xl font-semibold text-white mt-2">{freshTokenLabel}</h3>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => copyText(freshToken, 'token')}
                      className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                    >
                      {copied === 'token' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied === 'token' ? 'Copied' : 'Copy token'}
                    </Button>
                  </div>

                  <div className="bg-black/30 rounded-lg p-4 mb-4 font-mono text-sm text-green-100 break-all">
                    {freshToken}
                  </div>

                  <p className="text-sm text-green-100/90">
                    This plaintext token is shown only once. If you lose it, revoke it and create a new one.
                  </p>
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 h-full">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Endpoint and config</h2>
                  <p className="text-purple-200 mt-2">Use browser OAuth first. Keep the manual config below for clients that still need it.</p>
                </div>
                <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                  <a href="https://modelcontextprotocol.io" target="_blank" rel="noreferrer">
                    MCP docs
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>

              <div className="rounded-xl bg-black/20 p-4 mb-4">
                <p className="text-purple-200 text-sm mb-2">Hosted Endpoint</p>
                <p className="font-mono text-white break-all">{origin ? `${origin}/mcp` : '/mcp'}</p>
              </div>

              <div className="rounded-xl bg-black/20 p-4 mb-4">
                <p className="text-purple-200 text-sm mb-3">How to connect</p>
                <div className="space-y-2 text-sm text-purple-100">
                  <p>1. Point your MCP client at ` /mcp ` and try OAuth first.</p>
                  <p>2. If the client asks for a bearer token, create one on this page.</p>
                  <p>3. Paste the fallback token into the client config below.</p>
                </div>
              </div>

              <div className="rounded-xl bg-black/20 p-4">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <p className="text-purple-200 text-sm">Fallback Config</p>
                  {configSnippet && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyText(configSnippet, 'config')}
                      className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                    >
                      {copied === 'config' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied === 'config' ? 'Copied' : 'Copy'}
                    </Button>
                  )}
                </div>
                <pre className="bg-black/40 rounded-lg p-4 overflow-x-auto text-sm text-purple-100 whitespace-pre-wrap break-all">
                  {configSnippet || `Create a fallback token to generate a ready-to-paste config snippet for ${origin ? `${origin}/mcp` : 'your hosted /mcp endpoint'}.`}
                </pre>
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-white">Issued fallback tokens</h2>
                <p className="text-purple-200 mt-2">Revoke any token if a laptop, agent, or shared config should lose access immediately.</p>
              </div>
              <Button variant="outline" onClick={loadTokens} className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="text-center text-white py-12">Loading MCP tokens...</div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <p className="text-purple-200 text-lg">No fallback MCP tokens yet.</p>
                <p className="text-purple-300 text-sm mt-2">Create one only when a client cannot complete browser-based OAuth.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tokens.map((token, index) => (
                  <motion.div
                    key={token.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 hover:bg-white/15 transition-all">
                      <div className="flex items-start justify-between mb-4 gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-1">{token.label}</h3>
                          <p className="text-sm text-purple-200">Created {formatDate(token.createdAt)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRevoke(token.id)}
                          disabled={revokingId === token.id}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/20"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>

                      <div className="bg-black/30 rounded-lg p-3 mb-4 text-sm text-purple-100">
                        <span className="text-purple-300">Last used:</span> {formatDate(token.lastUsed)}
                      </div>

                      <div className="flex items-center justify-between text-sm text-purple-300">
                        <span>Manual bearer fallback</span>
                        <span>{revokingId === token.id ? 'Revoking...' : 'Ready'}</span>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
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
