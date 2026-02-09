import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a random 48-byte token
    const token = crypto.randomBytes(48).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { error } = await supabase
      .from('cli_tokens')
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        name: 'Vaulter CLI',
      });

    if (error) {
      console.error('Error creating CLI token:', error);
      return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error('CLI token error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
