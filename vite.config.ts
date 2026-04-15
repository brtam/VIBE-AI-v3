import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

// Minimal type for the Vite dev server middleware
type Connect = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    return {
        server: {
            port: 3000,
            host: '127.0.0.1',
        },
        plugins: [
            react(),
            {
                name: 'lm-studio-proxy',
                configureServer(server) {
                    const middleware: Connect = async (req, res, next) => {
                        if (req.url !== '/api/chat') return next();
                        if (req.method !== 'POST') {
                            res.writeHead(405);
                            res.end('Method Not Allowed');
                            return;
                        }

                        const chunks: Buffer[] = [];
                        req.on('data', (chunk) => chunks.push(chunk));
                        await new Promise((resolve) => req.on('end', resolve));

                        let body: { message: string; vram: string; temp: string };
                        try {
                            body = JSON.parse(Buffer.concat(chunks).toString());
                        } catch {
                            res.writeHead(400);
                            res.end('Bad Request');
                            return;
                        }

                        res.writeHead(200, {
                            'Content-Type': 'text/event-stream',
                            'Cache-Control': 'no-cache',
                            'Connection': 'keep-alive',
                        });

                        try {
                            const lmStudioUrl = 'http://localhost:1234';
                            const systemPrompt = `You are VIBE (Virtual Interface for Base Operations).
Persona: Highly efficient, slightly cynical cyberpunk system operator.
Context: Local AI Dashboard.
Telemetry: VRAM ${body.vram}GB, Temp ${body.temp}°C.
Keep responses concise and technical.`;

                            const response = await fetch(`${lmStudioUrl}/v1/chat/completions`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    model: 'local-model',
                                    messages: [
                                        { role: 'system', content: systemPrompt },
                                        { role: 'user', content: body.message },
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
                        } catch (e) {
                            console.error('[lm-studio-proxy]', e);
                            res.write(`data: ${JSON.stringify({ error: 'LM Studio connection error' })}\n\n`);
                        } finally {
                            res.end();
                        }
                    };

                    server.middlewares.use(middleware);
                }
            }
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});
