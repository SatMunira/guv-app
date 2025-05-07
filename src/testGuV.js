const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function runTest() {
  try {
    // Step 1: Add Abschreibung
    const addResponse = await fetch(`${BASE_URL}/api/abschreibungen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Testmaschine',
        kosten: 12000,
        dauer: 3,
        start_datum: '2025-01-01',
      }),
    });
    const addResult = await addResponse.json();
    console.log('Step 1 - Add Abschreibung:', addResult);

    // Step 2: Run GuV
    const guvResponse = await fetch(
      `${BASE_URL}/api/guv?from=2025-01-01&to=2025-12-31`
    );
    const guvResult = await guvResponse.json();
    console.log('Step 2 - GuV Ergebnis:', guvResult);

    // Step 3: Check Abschreibungen after update
    const abschreibungenResponse = await fetch(
      `${BASE_URL}/api/abschreibungen?active=true`
    );
    const abschreibungenResult = await abschreibungenResponse.json();
    console.log('Step 3 - Abschreibungen nach Update:', abschreibungenResult);
  } catch (error) {
    console.error('Fehler beim Testlauf:', error);
  }
}

runTest();
