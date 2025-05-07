import { NextRequest } from 'next/server';
import supabase from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  const { data, error } = await supabase.from('einnahmen').select('*');

  if (error) {
    console.error('Supabase error:', error);
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  console.log('Supabase data:', data);
  return new Response(JSON.stringify(data), { status: 200 });
}
