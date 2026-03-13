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
                name: 'gemini-proxy',
                configureServer(server) {
                    const middleware: Connect = async (req, res, next) => {
                        if (req.url !== '/api/chat') return next();
                        if (req.method !== 'POST') {
                            res.writeHead(405);
                            res.end('Method Not Allowed');
                            return;
                        }

                        const apiKey = env.GEMINI_API_KEY;
                        if (!apiKey) {
                            res.writeHead(503, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'GEMINI_API_KEY not set in .env.local' }));
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
                            // Dynamic import keeps @google/genai out of the client bundle
                            const { GoogleGenAI } = await import('@google/genai');
                            const ai = new GoogleGenAI({ apiKey });
                            const chat = ai.chats.create({
                                model: 'gemini-2.0-flash',
                                config: {
                                    systemInstruction: `You are VIBE (Virtual Interface for Base Operations).
Persona: Highly efficient, slightly cynical cyberpunk system operator.
Context: Local AI Dashboard.
Telemetry: VRAM ${body.vram}GB, Temp ${body.temp}°C.
Keep responses concise and technical.`
                                }
                            });

                            const result = await chat.sendMessageStream({ message: body.message });
                            for await (const chunk of result) {
                                if (chunk.text) {
                                    res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
                                }
                            }
                            res.write('data: [DONE]\n\n');
                        } catch (e) {
                            console.error('[gemini-proxy]', e);
                            res.write(`data: ${JSON.stringify({ error: 'Upstream API error' })}\n\n`);
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
