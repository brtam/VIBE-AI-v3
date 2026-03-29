# VIBE Local AI Ops 3.0

Dashboard de operações de IA local com interface cyberpunk, construído em React 19 + TypeScript + Vite.

## Pré-requisitos

- **Node.js** 18 ou superior → [nodejs.org](https://nodejs.org)
- **Chave de API do Google Gemini** → [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

---

## Rodando localmente

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd VIBE-AI-v3
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure a chave de API

Crie o arquivo `.env.local` na raiz do projeto (use o template disponível):

```bash
cp .env.local.example .env.local
```

Abra `.env.local` e substitua o valor:

```env
GEMINI_API_KEY=sua_chave_aqui
```

> A chave **nunca é exposta no bundle do cliente** — ela fica no processo do servidor Vite e é usada via proxy SSE interno.

### 4. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse **http://127.0.0.1:3000** no navegador.

---

## Scripts disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento Vite (porta 3000) |
| `npm run build` | Gera o build de produção em `dist/` |
| `npm run preview` | Pré-visualiza o build localmente (sem backend) |
| `npm run server:dev` | Roda o backend Express diretamente (para testes) |
| `npm run server:start` | Inicia o backend Express em modo produção |
| `npm start` | Build + inicia backend Express (deploy completo) |
| `npm test` | Executa todos os testes uma vez |
| `npm run test:watch` | Modo watch — re-executa testes ao salvar |
| `npm run test:coverage` | Gera relatório de cobertura em `coverage/` |
| `npm run lint` | Verifica regras ESLint |
| `npm run lint:fix` | Corrige problemas ESLint automaticamente |
| `npm run format` | Formata todos os arquivos `src/` com Prettier |
| `npm run format:check` | Verifica formatação sem modificar arquivos |

---

## Estrutura do projeto

```
VIBE-AI-v3/
├── index.tsx              # Entry point (createRoot)
├── index.html             # HTML base
├── vite.config.ts         # Config Vite + proxy Gemini (/api/chat, só em dev)
├── vitest.config.ts       # Config de testes
├── eslint.config.js       # Regras ESLint (flat config)
├── .prettierrc            # Formatação Prettier
├── .env.local.example     # Template de variáveis de ambiente
├── server/
│   └── index.ts           # Backend Express (produção: SSE + static files)
└── src/
    ├── App.tsx            # Componente raiz + estado global
    ├── types/index.ts     # Interfaces TypeScript
    ├── data/mocks.ts      # Dados mock (telemetria, arquivos, workflows)
    ├── hooks/
    │   ├── useLocalStorage.ts
    │   └── useSystemTelemetry.ts
    ├── components/        # UI reutilizável
    │   ├── Icon.tsx
    │   ├── Badge.tsx
    │   ├── Button.tsx
    │   ├── MetricCard.tsx
    │   └── Sidebar.tsx
    ├── views/             # Uma view por módulo
    │   ├── DashboardView.tsx
    │   ├── AgentView.tsx
    │   ├── ExplorerView.tsx
    │   ├── WorkflowView.tsx
    │   ├── BlenderView.tsx
    │   └── SettingsView.tsx
    └── test/
        └── setup.ts
```

---

## Funcionalidades

| Módulo | Descrição |
|---|---|
| **Dashboard** | Métricas de sistema em tempo real (VRAM, RAM, Temp) simuladas |
| **Neural Link** | Chat com Gemini AI via proxy server-side seguro |
| **Files** | Explorador de arquivos (dados mock) |
| **Pipelines** | Gerenciador de workflows de IA (simulado) |
| **3D Forge** | Síntese de assets 3D (simulado) |
| **Settings** | Configurações e export de código-fonte |

---

## Rodando em produção

O projeto inclui um backend Express real em `server/index.ts` que:
- Serve os arquivos estáticos gerados pelo `npm run build` (`dist/`)
- Expõe o endpoint `POST /api/chat` com streaming SSE
- Lê `GEMINI_API_KEY` do ambiente do processo (nunca exposta no cliente)

### Deploy rápido (qualquer VPS/servidor)

```bash
# 1. Configure a chave
export GEMINI_API_KEY=sua_chave_aqui
export PORT=3000          # opcional, padrão 3000

# 2. Build + start (um comando só)
npm start
```

Acesse **http://localhost:3000** — o Express serve o React e faz o proxy do Gemini.

### Variáveis de ambiente (produção)

| Variável | Obrigatório | Descrição |
|---|---|---|
| `GEMINI_API_KEY` | Sim | Chave da API Google Gemini |
| `PORT` | Não | Porta do servidor (padrão: `3000`) |
| `NODE_ENV` | Não | Definido como `production` por `server:start` |

### Desenvolvimento vs. Produção

| | `npm run dev` | `npm start` |
|---|---|---|
| Servidor | Vite Dev Server | Express (`server/index.ts`) |
| React | Hot reload em tempo real | Build estático (`dist/`) |
| Proxy `/api/chat` | Plugin Vite (`vite.config.ts`) | Express middleware |
| API key | Processo Vite | Processo Express |
