import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// ── Static files (production) ──────────────────────────────────────────────
// Serve the Vite build output. In dev this is unused (Vite serves directly).
const distPath = path.resolve(__dirname, '..', 'dist');
app.use(express.static(distPath));

// ── POST /api/chat ─────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        res.status(503).json({ error: 'GEMINI_API_KEY not set in environment' });
        return;
    }

    const { message, vram, temp } = req.body as {
        message: string;
        vram: string;
        temp: string;
    };

    if (!message) {
        res.status(400).json({ error: 'message is required' });
        return;
    }

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    try {
        const ai = new GoogleGenAI({ apiKey });
        const chat = ai.chats.create({
            model: 'gemini-2.0-flash',
            config: {
                systemInstruction: `You are VIBE (Virtual Interface for Base Operations).
Persona: Highly efficient, slightly cynical cyberpunk system operator.
Context: Local AI Dashboard.
Telemetry: VRAM ${vram ?? 'N/A'}GB, Temp ${temp ?? 'N/A'}°C.
Keep responses concise and technical.`,
            },
        });

        const result = await chat.sendMessageStream({ message });
        for await (const chunk of result) {
            if (chunk.text) {
                res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
            }
        }
        res.write('data: [DONE]\n\n');
    } catch (err) {
        console.error('[/api/chat]', err);
        res.write(`data: ${JSON.stringify({ error: 'Upstream API error' })}\n\n`);
    } finally {
        res.end();
    }
});

// ── SPA fallback ───────────────────────────────────────────────────────────
// Any route not matched above returns index.html so React Router works.
app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
    console.log(`VIBE backend running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV ?? 'development'}`);
});
