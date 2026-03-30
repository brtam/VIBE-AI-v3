import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// ── Static files (production) ──────────────────────────────────────────────
// Serve the Vite build output. In dev this is unused (Vite serves directly).
const distPath = path.resolve(__dirname, '..', 'dist');
app.use(express.static(distPath));

// ── POST /api/chat ─────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
    const lmStudioUrl = process.env.LM_STUDIO_URL ?? 'http://localhost:1234';

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
        // System prompt for VIBE personality
        const systemPrompt = `You are VIBE (Virtual Interface for Base Operations).
Persona: Highly efficient, slightly cynical cyberpunk system operator.
Context: Local AI Dashboard.
Telemetry: VRAM ${vram ?? 'N/A'}GB, Temp ${temp ?? 'N/A'}°C.
Keep responses concise and technical.`;

        const response = await fetch(`${lmStudioUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'local-model',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message },
                ],
                stream: true,
                temperature: 0.7,
                max_tokens: 1024,
            }),
        });

        if (!response.ok || !response.body) {
            throw new Error(`LM Studio responded with status ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const chunk = JSON.parse(data);
                        const text = chunk.choices?.[0]?.delta?.content;
                        if (text) {
                            res.write(`data: ${JSON.stringify({ text })}\n\n`);
                        }
                    } catch {
                        // Ignore parse errors
                    }
                }
            }
        }

        res.write('data: [DONE]\n\n');
    } catch (err) {
        console.error('[/api/chat]', err);
        res.write(`data: ${JSON.stringify({ error: 'LM Studio connection error' })}\n\n`);
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
