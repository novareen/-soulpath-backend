const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.post('/wisdom', (req, res) => {
  const { question, systemPrompt } = req.body;

  const data = JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question }
    ],
  });

  const options = {
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const request = https.request(options, (response) => {
    let body = '';
    response.on('data', (chunk) => body += chunk);
    response.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        if (parsed.choices) {
          res.json({ wisdom: parsed.choices[0].message.content });
        } else {
          res.status(400).json({ error: 'API error', details: parsed });
        }
      } catch (e) {
        res.status(500).json({ error: 'Parse error' });
      }
    });
  });

  request.on('error', (error) => {
    res.status(500).json({ error: error.message });
  });

  request.write(data);
  request.end();
});

app.get('/', (req, res) => {
  res.json({ status: 'Soulpath backend is running!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});