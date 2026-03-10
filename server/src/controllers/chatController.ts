import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';

const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

const SYSTEM_PROMPT = `Tu es un assistant sportif expert intégré dans l'application G1Club. 
Tu aides les coachs, dirigeants et sportifs avec des conseils sur la gestion d'équipe, la préparation physique, 
les stratégies sportives, le suivi des performances et toute question liée au sport.
Réponds toujours en français de manière concise et professionnelle.`;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// POST /api/chat — envoie un message à Ollama
export const chatWithOllama = async (req: AuthRequest, res: Response) => {
  try {
    const { messages, stream = false } = req.body as { messages: ChatMessage[]; stream?: boolean };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'messages requis' });
    }

    const fullMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ];

    const ollamaRes = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: fullMessages,
        stream: false,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!ollamaRes.ok) {
      const err = await ollamaRes.text();
      console.error('Ollama error:', err);
      return res.status(502).json({ message: 'Ollama indisponible', detail: err });
    }

    const data = await ollamaRes.json() as any;
    const reply = data?.message?.content ?? data?.response ?? '';

    res.json({ reply, model: OLLAMA_MODEL });
  } catch (error: any) {
    if (error?.name === 'TimeoutError' || error?.cause?.code === 'ECONNREFUSED') {
      return res.status(503).json({
        message: 'Ollama non disponible. Vérifiez que le service est démarré sur le VPS.',
      });
    }
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/chat/status — vérifie si Ollama est disponible
export const getOllamaStatus = async (_req: AuthRequest, res: Response) => {
  try {
    const r = await fetch(`${OLLAMA_BASE}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) return res.json({ available: false });
    const data = await r.json() as any;
    const models: string[] = (data?.models ?? []).map((m: any) => m.name);
    res.json({ available: true, models, activeModel: OLLAMA_MODEL });
  } catch {
    res.json({ available: false, models: [], activeModel: OLLAMA_MODEL });
  }
};
