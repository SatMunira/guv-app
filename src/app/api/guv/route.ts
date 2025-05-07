import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';
import { differenceInMonths, parseISO } from 'date-fns';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json({ error: 'Bitte from und to angeben' }, { status: 400 });
  }

  try {
    // Einnahmen holen
    const { data: einnahmen, error: err1 } = await supabase
      .from('einnahmen')
      .select('*')
      .gte('datum', from)
      .lte('datum', to);

    // Ausgaben holen
    const { data: ausgaben, error: err2 } = await supabase
      .from('ausgaben')
      .select('*')
      .gte('datum', from)
      .lte('datum', to);

    // Abschreibungen holen (aktive)
    const { data: abschreibungen, error: err3 } = await supabase
      .from('abschreibungen')
      .select('*')
      .gt('restdauer', 0);

    if (err1 || err2 || err3) {
      return NextResponse.json({ error: 'Fehler beim Abrufen' }, { status: 500 });
    }

    // Berechnen Einnahmen Brutto/Netto
    const einnahmenBrutto = einnahmen.reduce((sum, e) => sum + e.betrag, 0);
    const einnahmenNetto = einnahmen.reduce(
      (sum, e) => sum + e.betrag / (1 + e.umsatzsteuer / 100),
      0
    );

    // Berechnen Ausgaben Brutto/Netto
    const ausgabenBrutto = ausgaben.reduce((sum, a) => sum + a.betrag, 0);
    const ausgabenNetto = ausgaben.reduce(
      (sum, a) => sum + a.betrag / (1 + a.umsatzsteuer / 100),
      0
    );

    // Berechnen Abschreibungen (lineare Verteilung)
    let abschreibungenSumme = 0;

    for (const ab of abschreibungen) {
      const start = parseISO(ab.start_datum);
      const periodFrom = parseISO(from);
      const periodTo = parseISO(to);

      // Prüfen, ob im gewählten Zeitraum beteiligt
      if (start > periodTo) continue;

      // Berechnen: wie viel Zeit fällt ins gewählte Intervall
      const startEffective = start > periodFrom ? start : periodFrom;
      const monthsInPeriod = differenceInMonths(periodTo, startEffective) + 1; // inkl. Teilmonat

      const abschreibungProMonat = ab.kosten / (ab.dauer * 12);
      const abschreibungBetrag = abschreibungProMonat * monthsInPeriod;

      abschreibungenSumme += abschreibungBetrag;

      // Update: neuer Restwert und Restdauer
      const newRestwert = Math.max(ab.restwert - abschreibungBetrag, 0);
      const monthsUsed = Math.min(monthsInPeriod, ab.restdauer * 12);
      const newRestdauer = Math.max(ab.restdauer - monthsUsed / 12, 0);

      await supabase
        .from('abschreibungen')
        .update({ restwert: newRestwert, restdauer: newRestdauer })
        .eq('id', ab.id);
    }

    // Berechne Endergebnisse
    const bruttoErgebnis = einnahmenBrutto - ausgabenBrutto;
    const nettoErgebnis =
      einnahmenNetto - ausgabenNetto - abschreibungenSumme;

    // Rundung
    const round = (v: number) => Math.round(v * 100) / 100;

    return NextResponse.json(
      {
        bruttoErgebnis: round(bruttoErgebnis),
        nettoErgebnis: round(nettoErgebnis),
        einnahmenBrutto: round(einnahmenBrutto),
        ausgabenBrutto: round(ausgabenBrutto),
        abschreibungenSumme: round(abschreibungenSumme),
        details: {
          einnahmen,
          ausgaben,
          abschreibungen,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
