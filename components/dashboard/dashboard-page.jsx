'use client';

import { useState, useEffect } from 'react';
import { useUser, UserButton, useClerk } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Eye, EyeOff, Copy, Trash2, Key, Clock, Hash, Search, X, Lock, LogIn, Upload, FileText, Check, LayoutDashboard, TerminalSquare, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const { toast } = useToast();
  const [keys, setKeys] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [revealedKeys, setRevealedKeys] = useState({});
  const [loading, setLoading] = useState(false);

  const [showEnvModal, setShowEnvModal] = useState(false);
  const [parsedEnvKeys, setParsedEnvKeys] = useState([]);
  const [envWarnings, setEnvWarnings] = useState([]);
  const [selectedEnvKeys, setSelectedEnvKeys] = useState({});
  const [duplicateKeys, setDuplicateKeys] = useState([]);
  const [duplicateAction, setDuplicateAction] = useState({});
  const [importLoading, setImportLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    apiKey: '',
    tags: ''
  });

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchKeys();
    }
  }, [user]);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      setKeys(data.keys || []);
    } catch (error) {
      console.error('Error fetching keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          apiKey: formData.apiKey,
          tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        })
      });

      if (res.ok) {
        setFormData({ name: '', apiKey: '', tags: '' });
        setShowModal(false);
        fetchKeys();
      }
    } catch (error) {
      console.error('Error creating key:', error);
    }
  };

  const handleDeleteClick = (key) => {
    setKeyToDelete(key);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!keyToDelete) return;

    try {
      await fetch(`/api/keys/${keyToDelete.id}`, { method: 'DELETE' });
      fetchKeys();
    } catch (error) {
      console.error('Error deleting key:', error);
    } finally {
      setShowDeleteModal(false);
      setKeyToDelete(null);
    }
  };

  const toggleReveal = async (id) => {
    if (revealedKeys[id]) {
      setRevealedKeys((prev) => ({ ...prev, [id]: null }));
      return;
    }

    try {
      const res = await fetch(`/api/keys/${id}?decrypt=true`);
      const data = await res.json();
      setRevealedKeys((prev) => ({ ...prev, [id]: data.decrypted_key }));
      await fetch(`/api/usage/${id}`, { method: 'POST' });
    } catch (error) {
      console.error('Error revealing key:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const parseEnvFile = (content) => {
    const lines = content.split('\n');
    const parsedKeys = [];
    const warnings = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        return;
      }

      if (trimmedLine.startsWith('#')) {
        warnings.push(`Line ${index + 1}: Skipped comment "${trimmedLine.substring(0, 50)}${trimmedLine.length > 50 ? '...' : ''}"`);
        return;
      }

      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex === -1) {
        warnings.push(`Line ${index + 1}: Invalid format (no = found) "${trimmedLine.substring(0, 30)}..."`);
        return;
      }

      const name = trimmedLine.substring(0, equalIndex).trim();
      let value = trimmedLine.substring(equalIndex + 1).trim();

      if (
        value.length >= 2 &&
        ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
      ) {
        value = value.slice(1, -1);
      }

      if (!name) {
        warnings.push(`Line ${index + 1}: Empty key name`);
        return;
      }

      if (!value) {
        warnings.push(`Line ${index + 1}: Empty value for key "${name}"`);
        return;
      }

      parsedKeys.push({ name, apiKey: value });
    });

    const nameCount = {};
    parsedKeys.forEach((pk) => {
      nameCount[pk.name] = (nameCount[pk.name] || 0) + 1;
    });
    const internalDuplicates = Object.keys(nameCount).filter((name) => nameCount[name] > 1);
    if (internalDuplicates.length > 0) {
      warnings.push(`Duplicate keys in file (last value will be used): ${internalDuplicates.join(', ')}`);
      const seen = new Set();
      const uniqueKeys = [];
      for (let i = parsedKeys.length - 1; i >= 0; i--) {
        if (!seen.has(parsedKeys[i].name)) {
          seen.add(parsedKeys[i].name);
          uniqueKeys.unshift(parsedKeys[i]);
        }
      }
      return { parsedKeys: uniqueKeys, warnings };
    }

    return { parsedKeys, warnings };
  };

  const handleEnvFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 1MB.',
        variant: 'destructive'
      });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const { parsedKeys, warnings } = parseEnvFile(content);
        setParsedEnvKeys(parsedKeys);
        setEnvWarnings(warnings);

        const selected = {};
        parsedKeys.forEach((key, index) => {
          selected[index] = true;
        });
        setSelectedEnvKeys(selected);

        let existingNames = keys.map((k) => k.name);
        try {
          const freshRes = await fetch('/api/keys');
          const freshData = await freshRes.json();
          if (freshData.keys) {
            existingNames = freshData.keys.map((k) => k.name);
            setKeys(freshData.keys);
          }
        } catch (err) {
          console.error('Error fetching fresh keys:', err);
        }

        const duplicates = parsedKeys.filter((pk) => existingNames.includes(pk.name)).map((pk) => pk.name);
        setDuplicateKeys(duplicates);

        const actions = {};
        duplicates.forEach((name) => {
          actions[name] = 'skip';
        });
        setDuplicateAction(actions);

        setShowEnvModal(true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const toggleEnvKeySelection = (index) => {
    setSelectedEnvKeys((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleDuplicateAction = (keyName, action) => {
    setDuplicateAction((prev) => ({
      ...prev,
      [keyName]: action
    }));
  };

  const handleEnvImport = async () => {
    setImportLoading(true);

    try {
      const keysToImport = parsedEnvKeys.filter((key, index) => {
        if (!selectedEnvKeys[index]) return false;
        if (duplicateKeys.includes(key.name) && duplicateAction[key.name] === 'skip') return false;
        return true;
      });

      const overwriteKeys = parsedEnvKeys
        .filter(
          (key, index) =>
            selectedEnvKeys[index] && duplicateKeys.includes(key.name) && duplicateAction[key.name] === 'overwrite'
        )
        .map((k) => k.name);

      if (keysToImport.length === 0) {
        toast({
          title: 'No keys to import',
          description: 'All keys were either deselected or marked to skip.',
          variant: 'destructive'
        });
        setImportLoading(false);
        return;
      }

      const res = await fetch('/api/keys/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: keysToImport, overwriteKeys })
      });

      const result = await res.json();

      if (res.ok) {
        const successCount = result.success.length + result.overwritten.length;
        const failedCount = result.failed.length;

        let description = `${successCount} key(s) imported`;
        if (result.overwritten.length > 0) {
          description += ` (${result.overwritten.length} overwritten)`;
        }
        if (failedCount > 0) {
          description += `. ${failedCount} failed.`;
        }
        toast({
          title: 'Import successful',
          description
        });

        setShowEnvModal(false);
        setParsedEnvKeys([]);
        setEnvWarnings([]);
        setSelectedEnvKeys({});
        setDuplicateKeys([]);
        setDuplicateAction({});
        fetchKeys();
      } else {
        toast({
          title: 'Import failed',
          description: result.error || 'Unknown error',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error importing keys:', error);
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setImportLoading(false);
    }
  };

  const maskKeyPreview = (key) => {
    if (key.length <= 8) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  const filteredKeys = keys.filter(
    (key) =>
      key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (key.tags || []).some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: keys.length,
    recentlyUsed: keys.filter((k) => k.last_used).length,
    totalTags: [...new Set(keys.flatMap((k) => k.tags || []))].length
  };

  return (
    <div className="vaulter-page flex flex-col">
      <header className="sticky top-0 z-30 border-b border-purple-500/10 bg-[rgba(4,4,6,0.92)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1160px] items-center justify-between gap-6 px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-500/16 bg-purple-500/10">
              <Image
                src="/assets/vaulter-logo.svg"
                alt="Vaulter Logo"
                width={30}
                height={30}
                className="vaulter-logo-spin"
              />
            </div>
            <div>
              <p className="font-display text-[1.8rem] font-bold leading-none tracking-[-0.06em]">Vaulter</p>
              <p className="text-xs text-purple-300">Secure vault workspace</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-white/[0.03] px-4 py-2 text-sm text-white">
              <LayoutDashboard className="h-4 w-4" />
              Vault
            </Link>
            <Link href="/cli" className="rounded-lg px-4 py-2 text-sm text-purple-200/80 transition-colors hover:bg-white/[0.03] hover:text-white">
              CLI
            </Link>
            <Link href="/mcp-access" className="rounded-lg px-4 py-2 text-sm text-purple-200/80 transition-colors hover:bg-white/[0.03] hover:text-white">
              MCP Access
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {user && (
              <>
                <Button asChild variant="outline" className="rounded-xl border-purple-500/14 bg-transparent text-white hover:bg-white/[0.03]">
                  <Link href="/mcp-access">MCP Access</Link>
                </Button>
                <UserButton afterSignOutUrl="/" />
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto mb-8 w-full max-w-[1160px] px-6 pt-12 lg:px-8">
        <div className="mb-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.28em] text-purple-300">Vault overview</p>
            <h1 className="mt-5 text-5xl font-semibold tracking-tight text-white md:text-6xl">Manage encrypted keys without losing your place.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-purple-200">
              Your vault stays focused on the essential actions: search keys, add new secrets, import env files, and move into CLI or MCP workflows when you need them.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-purple-200">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/10 bg-purple-500/[0.05] px-4 py-2">
                <Key className="h-4 w-4 text-purple-300" />
                Encrypted vault storage
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/10 bg-purple-500/[0.05] px-4 py-2">
                <TerminalSquare className="h-4 w-4 text-purple-300" />
                CLI-ready workflows
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/10 bg-purple-500/[0.05] px-4 py-2">
                <Sparkles className="h-4 w-4 text-purple-300" />
                MCP integrations
              </div>
            </div>
          </div>

          <div className="vaulter-surface p-6 md:p-7">
            <p className="text-sm uppercase tracking-[0.28em] text-purple-300">Quick actions</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button
                onClick={() => setShowModal(true)}
                className="justify-start rounded-xl bg-gradient-to-r from-purple-700 to-purple-500 px-5 py-6 text-white hover:from-purple-600 hover:to-fuchsia-500"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add to Vaulter
              </Button>
              <label>
                <input
                  type="file"
                  accept=".env,.env.*,text/plain"
                  onChange={handleEnvFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  className="w-full justify-start rounded-xl border-purple-500/14 bg-transparent px-5 py-6 text-white hover:bg-white/[0.03]"
                  asChild
                >
                  <span>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload .env
                  </span>
                </Button>
              </label>
            </div>
            <p className="mt-4 text-sm leading-6 text-purple-200">Add a single secret, bulk import an env file, or jump to MCP setup from the top navigation.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="rounded-[1.75rem] border-purple-500/12 bg-[rgba(6,6,9,0.92)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Total Keys</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <Key className="w-12 h-12 text-purple-400" />
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="rounded-[1.75rem] border-purple-500/12 bg-[rgba(6,6,9,0.92)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Recently Used</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.recentlyUsed}</p>
                </div>
                <Clock className="w-12 h-12 text-blue-400" />
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="rounded-[1.75rem] border-purple-500/12 bg-[rgba(6,6,9,0.92)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Unique Tags</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalTags}</p>
                </div>
                <Hash className="w-12 h-12 text-green-400" />
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="mb-8 rounded-[1.75rem] border border-purple-500/12 bg-[rgba(6,6,9,0.92)] p-4 md:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by name or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl border-purple-500/10 bg-black/80 text-white placeholder:text-purple-300"
            />
          </div>

          {isLoaded && !user ? (
            <Button
              onClick={() => openSignIn({ afterSignInUrl: '/dashboard' })}
              className="rounded-xl bg-gradient-to-r from-purple-700 to-purple-500 text-white hover:from-purple-600 hover:to-fuchsia-500"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign in to add API keys
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="rounded-xl border-purple-500/14 bg-transparent text-white hover:bg-white/[0.03]">
                  <Link href="/cli">View CLI</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-purple-500/14 bg-transparent text-white hover:bg-white/[0.03]">
                <Link href="/mcp-access">View MCP Access</Link>
              </Button>
            </div>
          )}
        </div>
        </div>

        {!isLoaded ? (
          <div className="text-center text-white py-12">Loading...</div>
        ) : !user ? (
          <div className="text-center py-12">
            <Lock className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <p className="text-purple-200 text-lg">Welcome to Vaulter</p>
            <p className="text-purple-300 text-sm mt-2">Sign in to securely store and manage your API keys</p>
          </div>
        ) : loading ? (
          <div className="text-center text-white py-12">Loading keys...</div>
        ) : filteredKeys.length === 0 ? (
          <div className="text-center py-12">
            <Lock className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <p className="text-purple-200 text-lg">No API keys in your vault yet.</p>
            <p className="text-purple-300 text-sm mt-2">Add your first key to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {filteredKeys.map((key, index) => (
                <motion.div
                  key={key.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="rounded-[1.5rem] border-purple-500/12 bg-[rgba(6,6,9,0.92)] p-6 transition-colors hover:bg-[rgba(9,9,14,0.98)]">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-1">{key.name}</h3>
                        <p className="text-sm text-purple-200">Created {new Date(key.created_at).toLocaleDateString()}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(key)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/20"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="mb-4 rounded-xl border border-purple-500/8 bg-black/80 p-3 font-mono text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300 truncate">{revealedKeys[key.id] || key.masked_key}</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleReveal(key.id)}
                            className="text-purple-400 hover:text-purple-300"
                            title={revealedKeys[key.id] ? 'Hide key' : 'Reveal key'}
                          >
                            {revealedKeys[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(revealedKeys[key.id] || key.masked_key)}
                            className="text-purple-400 hover:text-purple-300"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {key.tags && key.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {key.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-purple-500/30 text-purple-200 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-purple-300">
                      <span>Used: {key.usage_count || 0} times</span>
                      {key.last_used && <span>Last: {new Date(key.last_used).toLocaleDateString()}</span>}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto mt-auto pt-12 w-full">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
            <Lock className="w-4 h-4 text-purple-400" />
            <span className="text-purple-200 text-sm font-medium">Secured by Vaulter</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-[1.75rem] border border-purple-500/14 bg-[rgba(7,7,11,0.96)] p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Add to Vaulter</h2>
                  <p className="text-sm text-purple-300 mt-1">Securely store a new API key</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)} className="text-purple-400 hover:text-purple-300">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-purple-200 mb-2 text-sm">Key Name</label>
                  <Input
                    type="text"
                    placeholder="e.g., OpenAI Production"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="rounded-xl border-purple-500/10 bg-black/80 text-white placeholder:text-purple-300"
                  />
                </div>

                <div>
                  <label className="block text-purple-200 mb-2 text-sm">API Key</label>
                  <Input
                    type="password"
                    placeholder="Enter your API key"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    required
                    className="rounded-xl border-purple-500/10 bg-black/80 text-white placeholder:text-purple-300"
                  />
                  <p className="text-xs text-purple-300 mt-1">Your key will be encrypted with AES-256 before storage</p>
                </div>

                <div>
                  <label className="block text-purple-200 mb-2 text-sm">Tags (comma-separated)</label>
                  <Input
                    type="text"
                    placeholder="e.g., production, openai, critical"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="rounded-xl border-purple-500/10 bg-black/80 text-white placeholder:text-purple-300"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-xl border-purple-500/14 bg-transparent text-purple-200 hover:bg-white/[0.03]"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 rounded-xl bg-gradient-to-r from-purple-700 to-purple-500 text-white hover:from-purple-600 hover:to-fuchsia-500">
                    Add Key
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteModal && keyToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-[1.75rem] border border-red-500/18 bg-[rgba(7,7,11,0.96)] p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Delete Key</h2>
                  <p className="text-sm text-purple-300 mt-1">This action cannot be undone</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDeleteModal(false)}
                  className="text-purple-400 hover:text-purple-300"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="mb-6">
                <p className="text-purple-200">
                  Are you sure you want to delete <span className="text-white font-semibold">{keyToDelete.name}</span>?
                </p>
                <div className="mt-4 rounded-xl border border-purple-500/8 bg-black/80 p-3">
                  <p className="text-purple-300 text-sm font-mono truncate">{keyToDelete.masked_key}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 rounded-xl border-purple-500/14 bg-transparent text-purple-200 hover:bg-white/[0.03]"
                >
                  Cancel
                </Button>
                <Button onClick={confirmDelete} className="flex-1 rounded-xl bg-red-600 text-white hover:bg-red-700">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Key
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEnvModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowEnvModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-purple-500/14 bg-[rgba(7,7,11,0.96)] p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-6 h-6 text-purple-400" />
                    Import from .env
                  </h2>
                  <p className="text-sm text-purple-300 mt-1">Review and import your environment variables</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowEnvModal(false)} className="text-purple-400 hover:text-purple-300">
                  <X className="w-5 h-5" />
                </Button>
              </div>

                <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                <p className="font-medium text-white">Import notes</p>
                <p className="mt-1">Vaulter will only import valid key-value pairs from the selected file.</p>
                {envWarnings.length > 0 && <p className="mt-2 text-amber-200">{envWarnings.length} warning(s) found while parsing this file.</p>}
              </div>

              <div className="flex-1 overflow-y-auto mb-4">
                {parsedEnvKeys.length === 0 ? (
                  <div className="text-center py-8 text-purple-300">No valid keys found in the file</div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-purple-300 mb-2">{parsedEnvKeys.length} keys found - select which to import:</div>
                    {parsedEnvKeys.map((key, index) => {
                      const isDuplicate = duplicateKeys.includes(key.name);
                      const isSelected = selectedEnvKeys[index];

                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border transition-all ${
                            isSelected
                              ? isDuplicate
                                ? 'bg-orange-500/10 border-orange-500/30'
                                : 'bg-purple-500/10 border-purple-500/20'
                              : 'bg-white/[0.02] border-white/5 opacity-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => toggleEnvKeySelection(index)}
                              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-purple-500 border-purple-500' : 'border-purple-400/50 hover:border-purple-400'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium truncate">{key.name}</span>
                                {isDuplicate && <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">Duplicate</span>}
                              </div>
                              <span className="text-purple-300/70 text-sm font-mono">{maskKeyPreview(key.apiKey)}</span>
                            </div>

                            {isDuplicate && isSelected && (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateAction(key.name, 'skip')}
                                  className={`px-2 py-1 text-xs rounded transition-colors ${
                                    duplicateAction[key.name] === 'skip'
                                      ? 'bg-purple-500 text-white'
                                      : 'bg-white/[0.04] text-purple-300 hover:bg-white/[0.08]'
                                  }`}
                                >
                                  Skip
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateAction(key.name, 'overwrite')}
                                  className={`px-2 py-1 text-xs rounded transition-colors ${
                                    duplicateAction[key.name] === 'overwrite'
                                      ? 'bg-orange-500 text-white'
                                      : 'bg-white/[0.04] text-purple-300 hover:bg-white/[0.08]'
                                  }`}
                                >
                                  Overwrite
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-purple-500/20 pt-4">
                <div className="text-sm text-purple-300 mb-4">
                  {(() => {
                    const selectedCount = Object.values(selectedEnvKeys).filter(Boolean).length;
                    const skipCount = Object.entries(duplicateAction).filter(([name, action]) => {
                      const index = parsedEnvKeys.findIndex((k) => k.name === name);
                      return selectedEnvKeys[index] && action === 'skip';
                    }).length;
                    const overwriteCount = Object.entries(duplicateAction).filter(([name, action]) => {
                      const index = parsedEnvKeys.findIndex((k) => k.name === name);
                      return selectedEnvKeys[index] && action === 'overwrite';
                    }).length;
                    const importCount = selectedCount - skipCount;

                    return (
                      <>
                        <span className="text-white font-medium">{importCount}</span> keys will be imported
                        {overwriteCount > 0 && <span className="text-orange-400"> ({overwriteCount} will overwrite existing)</span>}
                        {skipCount > 0 && <span className="text-purple-400"> ({skipCount} duplicates skipped)</span>}
                      </>
                    );
                  })()}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEnvModal(false)}
                    className="flex-1 rounded-xl border-purple-500/14 bg-transparent text-purple-200 hover:bg-white/[0.03]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEnvImport}
                    disabled={importLoading || parsedEnvKeys.length === 0}
                    className="flex-1 rounded-xl bg-gradient-to-r from-purple-700 to-purple-500 text-white hover:from-purple-600 hover:to-fuchsia-500"
                  >
                    {importLoading ? 'Importing...' : 'Import Keys'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
