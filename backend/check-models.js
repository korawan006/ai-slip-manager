import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY not found in .env');
  process.exit(1);
}

const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
const data = await res.json();

if (data.error) {
  console.error('API Error:', data.error.message);
  process.exit(1);
}

console.log('Available models:\n');
data.models.forEach(m => {
  console.log(`  ${m.name}  —  ${m.displayName}`);
});
