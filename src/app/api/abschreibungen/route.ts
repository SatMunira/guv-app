import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

export async function POST(request: Request) {
    try {
      const body = await request.json();
      const { name, kosten, dauer, start_datum } = body;
  
      if (!name || !kosten || !dauer || !start_datum) {
        return NextResponse.json({ error: 'Fehlende Felder' }, { status: 400 });
      }
  
      const { data, error } = await supabase.from('abschreibungen').insert([
        {
          name,
          kosten,
          dauer,
          start_datum,
          restwert: kosten,
          restdauer: dauer,
        },
      ]);
  
      if (error) {
        console.error(error);
        return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 });
      }
  
      return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
    }
  }

  export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
  
    let query = supabase.from('abschreibungen').select('*');
  
    if (active === 'true') {
      query = query.gt('restdauer', 0);
    }
  
    const { data, error } = await query;
  
    if (error) {
      console.error(error);
      return NextResponse.json({ error: 'Fehler beim Abrufen' }, { status: 500 });
    }
  
    return NextResponse.json({ data }, { status: 200 });
  }
  