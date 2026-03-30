# VIBE Local AI Ops 3.0

Dashboard de operações de IA local com interface cyberpunk, construído em React 19 + TypeScript + Vite.

## Pré-requisitos

- **Node.js** 18 ou superior → [nodejs.org](https://nodejs.org)
- **LM Studio** rodando localmente com um modelo carregado → [lmstudio.ai](https://lmstudio.ai)
  - Baixe LM Studio, instale um modelo (ex: Mistral, Llama), e rode em paralelo (`Ctrl+K` para iniciar servidor)
  - Padrão: `http://localhost:1234`

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

### 3. Configure LM Studio (se necessário)

Crie o arquivo `.env.local` na raiz do projeto (use o template disponível):

```bash
cp .env.local.example .env.local
```

Por padrão, o projeto conecta em `http://localhost:1234`. Se LM Studio roda em outro host/porta, edite `.env.local`:

```env
LM_STUDIO_URL=http://seu-host:porta
```

> Tudo roda **completamente localmente** — nenhuma requisição sai para a nuvem.

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
- Conecta ao LM Studio local (sem dependências de API na nuvem)

### Deploy rápido (qualquer VPS/servidor)

Você precisa de **LM Studio rodando no mesmo servidor** (ou acessível na rede).

```bash
# 1. Inicie LM Studio no servidor (em outra janela/processo)
# Baixe LM Studio em lmstudio.ai, instale um modelo, e execute

# 2. Na raiz do projeto, configure (opcional, se LM Studio não está no localhost:1234)
export LM_STUDIO_URL=http://localhost:1234
export PORT=3000          # opcional, padrão 3000

# 3. Build + start
npm start
```

Acesse **http://localhost:3000** — o Express serve o React e faz proxy ao LM Studio local.

### Variáveis de ambiente (produção)

| Variável | Obrigatório | Descrição |
|---|---|---|
| `LM_STUDIO_URL` | Não | URL do LM Studio (padrão: `http://localhost:1234`) |
| `PORT` | Não | Porta do servidor VIBE (padrão: `3000`) |
| `NODE_ENV` | Não | Definido como `production` por `server:start` |

### Desenvolvimento vs. Produção

| | `npm run dev` | `npm start` |
|---|---|---|
| Servidor | Vite Dev Server | Express (`server/index.ts`) |
| React | Hot reload em tempo real | Build estático (`dist/`) |
| Proxy `/api/chat` | Plugin Vite (`vite.config.ts`) | Express middleware |
| IA Backend | LM Studio local | LM Studio local |
