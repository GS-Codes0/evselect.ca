/* EVSelect.ca — Netlify Serverless Function: NVIDIA NIM Chat Proxy
 * Endpoint: POST /.netlify/functions/chat
 * Body:     { messages: [{ role, content }, ...] }
 * Returns:  { reply: "..." }
 *
 * Environment variable required:
 *   NVIDIA_API_KEY — set in Netlify Dashboard → Site Settings → Environment Variables
 */
'use strict';

const NVIDIA_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL           = 'meta/llama-3.1-8b-instruct';

const SYSTEM_PROMPT =
  "You are EVSelect.ca's assistant for Canadian EV buyers. " +
  'Focus exclusively on: the 2026 Federal EVAP rebate ($5,000 BEV, $50k transaction cap), ' +
  'EV cold-weather range degradation in Canada, heat pump efficiency benefits, ' +
  'provincial rebate stacking, and the EVSelect platform tools. ' +
  'Always answer in under 3 sentences.';

exports.handler = async function handler(event) {
  /* Only accept POST */
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  /* Parse request body */
  let messages;
  try {
    const body = JSON.parse(event.body || '{}');
    messages = Array.isArray(body.messages) ? body.messages : [];
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }

  /* Validate API key */
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.error('EVSelect chat: NVIDIA_API_KEY environment variable is not set.');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server configuration error' })
    };
  }

  /* Build message chain: system prompt + caller-supplied history */
  const fullMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages
  ];

  /* Call NVIDIA NIM */
  try {
    const nimRes = await fetch(NVIDIA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model:       MODEL,
        messages:    fullMessages,
        temperature: 0.4,
        max_tokens:  160,
        stream:      false
      })
    });

    if (!nimRes.ok) {
      const errText = await nimRes.text();
      console.error(`EVSelect chat: NVIDIA NIM responded ${nimRes.status}: ${errText}`);
      return {
        statusCode: nimRes.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Upstream error ${nimRes.status}` })
      };
    }

    const data = await nimRes.json();
    const reply = (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content || ''
    ).trim();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    console.error('EVSelect chat: fetch to NVIDIA NIM failed:', err.message);
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Gateway error' })
    };
  }
};
