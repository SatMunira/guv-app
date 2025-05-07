import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

export async function POST(request: Request) {
    try {
      const body = await request.json();
      const { datum, betrag, kategorie, umsatzsteuer } = body;
  
      if (!datum || !betrag || !kategorie || umsatzsteuer === undefined) {
        return NextResponse.json({ error: 'Fehlende Felder' }, { status: 400 });
      }
  
      const { data, error } = await supabase.from('ausgaben').insert([
        { datum, betrag, kategorie, umsatzsteuer },
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
    const from = searchParams.get('from');
    const to = searchParams.get('to');
  
    if (!from || !to) {
      return NextResponse.json({ error: 'Bitte from und to angeben' }, { status: 400 });
    }
  
    const { data, error } = await supabase
      .from('ausgaben')
      .select('*')
      .gte('datum', from)
      .lte('datum', to);
  
    if (error) {
      console.error(error);
      return NextResponse.json({ error: 'Fehler beim Abrufen' }, { status: 500 });
    }
  
    return NextResponse.json({ data }, { status: 200 });
  }
  