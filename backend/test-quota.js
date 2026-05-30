import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

for (const model of models) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say hello in one word.' }] }]
        })
      }
    );
    const data = await res.json();
    if (data.error) {
      console.log(`❌ ${model}: ${data.error.status} — ${data.error.message.substring(0, 120)}`);
    } else {
      console.log(`✅ ${model}: WORKS! Response: "${data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()}"`);
    }
  } catch (err) {
    console.log(`❌ ${model}: Fetch error — ${err.message}`);
  }
}
