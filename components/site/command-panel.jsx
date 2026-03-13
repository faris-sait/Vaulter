'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function CommandPanel({ label, code, title, description, dense = false }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    toast({ title: 'Copied', description: 'Saved to your clipboard.' });
  };

  return (
    <div className="rounded-[1.5rem] border border-purple-500/12 bg-[rgba(6,6,9,0.92)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {label ? <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-purple-300">{label}</p> : null}
          {title ? <h3 className="mt-3 font-display text-xl font-bold tracking-[-0.04em] text-white">{title}</h3> : null}
          {description ? <p className="mt-2 text-sm leading-6 text-purple-200">{description}</p> : null}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="rounded-xl border-purple-500/16 bg-transparent text-white hover:bg-purple-500/8"
        >
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <div className={`mt-4 rounded-[1rem] border border-purple-500/8 bg-black/80 ${dense ? 'p-3' : 'p-4 md:p-5'}`}>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-sm leading-7 text-purple-100">{code}</pre>
      </div>
    </div>
  );
}
