const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
const key = env.split('\n').find(line => line.startsWith('GROQ_API_KEY=')).split('=')[1].trim();

fetch('https://api.groq.com/openai/v1/models', {
  headers: {
    'Authorization': `Bearer ${key}`
  }
}).then(res => res.json()).then(console.log).catch(console.error);