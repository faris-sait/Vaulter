'use client';

import { useState, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Eye, EyeOff, Copy, Trash2, Key, Clock, Hash, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [keys, setKeys] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [revealedKeys, setRevealedKeys] = useState({});
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    apiKey: '',
    tags: ''
  });

  useEffect(() => {
    if (isLoaded && user) {
      fetchKeys();
    }
  }, [isLoaded, user]);

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
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
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

  const deleteKey = async (id) => {
    if (!confirm('Are you sure you want to delete this key?')) return;
    
    try {
      await fetch(`/api/keys/${id}`, { method: 'DELETE' });
      fetchKeys();
    } catch (error) {
      console.error('Error deleting key:', error);
    }
  };

  const toggleReveal = async (id) => {
    if (revealedKeys[id]) {
      setRevealedKeys(prev => ({ ...prev, [id]: null }));
      return;
    }

    try {
      const res = await fetch(`/api/keys/${id}?decrypt=true`);
      const data = await res.json();
      setRevealedKeys(prev => ({ ...prev, [id]: data.decrypted_key }));
      
      // Log usage
      await fetch(`/api/usage/${id}`, { method: 'POST' });
    } catch (error) {
      console.error('Error revealing key:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const filteredKeys = keys.filter(key =>
    key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (key.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: keys.length,
    recentlyUsed: keys.filter(k => k.last_used).length,
    totalTags: [...new Set(keys.flatMap(k => k.tags || []))].length
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">API Key Manager</h1>
            <p className="text-purple-200">Securely manage your API keys with AES-256 encryption</p>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Total Keys</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <Key className="w-12 h-12 text-purple-400" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Recently Used</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.recentlyUsed}</p>
                </div>
                <Clock className="w-12 h-12 text-blue-400" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
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

        {/* Search and Add */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by name or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 backdrop-blur-lg border-white/20 text-white placeholder:text-purple-300"
            />
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Key
          </Button>
        </div>

        {/* Keys Grid */}
        {loading ? (
          <div className="text-center text-white py-12">Loading keys...</div>
        ) : filteredKeys.length === 0 ? (
          <div className="text-center py-12">
            <Key className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <p className="text-purple-200 text-lg">No API keys yet. Add your first one!</p>
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
                  <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 hover:bg-white/15 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-1">{key.name}</h3>
                        <p className="text-sm text-purple-200">
                          Created {new Date(key.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteKey(key.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/20"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Key Display */}
                    <div className="bg-black/30 rounded-lg p-3 mb-4 font-mono text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300">
                          {revealedKeys[key.id] || key.masked_key}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleReveal(key.id)}
                            className="text-purple-400 hover:text-purple-300"
                          >
                            {revealedKeys[key.id] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(revealedKeys[key.id] || key.masked_key)}
                            className="text-purple-400 hover:text-purple-300"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    {key.tags && key.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {key.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-purple-500/30 text-purple-200 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Usage Info */}
                    <div className="flex items-center gap-4 text-sm text-purple-300">
                      <span>Used: {key.usage_count || 0} times</span>
                      {key.last_used && (
                        <span>Last: {new Date(key.last_used).toLocaleDateString()}</span>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Key Modal */}
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
              className="bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-purple-500/30"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Add New API Key</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowModal(false)}
                  className="text-purple-400 hover:text-purple-300"
                >
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
                    className="bg-white/10 border-white/20 text-white placeholder:text-purple-300"
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
                    className="bg-white/10 border-white/20 text-white placeholder:text-purple-300"
                  />
                  <p className="text-xs text-purple-300 mt-1">
                    Your key will be encrypted with AES-256 before storage
                  </p>
                </div>

                <div>
                  <label className="block text-purple-200 mb-2 text-sm">Tags (comma-separated)</label>
                  <Input
                    type="text"
                    placeholder="e.g., production, openai, critical"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-purple-300"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1 border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    Add Key
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}