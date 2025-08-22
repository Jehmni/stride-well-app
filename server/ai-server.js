import express from 'express';
import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors());

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.warn('OPENAI_API_KEY not set — server will fail when trying to call OpenAI');
}

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20 // limit each IP to 20 requests per windowMs
});
app.use('/api/ai/', limiter);

// Simple shared-secret header protection: set AI_PROXY_KEY in env and pass X-AI-PROXY-KEY header from trusted services
const proxyKey = process.env.AI_PROXY_KEY || '';

app.post('/api/ai/meal-plan/generate', async (req, res) => {
  try {
    // Basic auth: reject if the request doesn't include the correct shared secret
    const incomingKey = req.header('X-AI-PROXY-KEY') || '';
    if (proxyKey && incomingKey !== proxyKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userProfile } = req.body;
    if (!userProfile) return res.status(400).json({ error: 'Missing userProfile' });

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body.openaiPayload || req.body)
    });

    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json(data);

    // If client expects parsed JSON, try to parse the assistant content
    try {
      const content = data.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content);

      // Optionally persist the parsed plan to Supabase if service keys are provided and client requests persistence
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && req.body.persist) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
          const userId = req.body.userId || null;
          // Insert into enhanced_meal_plans; adapt fields to your schema as needed
          await sb.from('enhanced_meal_plans').insert([{
            user_id: userId,
            week_start_date: new Date().toISOString().split('T')[0],
            fitness_goal: req.body.userProfile?.fitness_goal || null,
            dietary_preferences: req.body.userProfile?.dietary_preferences || [],
            daily_calories: parsed.daily_calories || null,
            meals: parsed.meals || [],
            grocery_list: parsed.grocery_list || []
          }]);
        } catch (persistErr) {
          console.error('Failed to persist meal plan to Supabase:', persistErr);
        }
      }

      return res.json({ raw: data, parsed });
    } catch (parseErr) {
      return res.json({ raw: data });
    }
  } catch (err) {
    console.error('AI server error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default app;
