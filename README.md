# Coherence Foundry

Turnkey website development company. We build WordPress/Avada websites on GoDaddy hosting with AI-powered consulting.

## Repository Structure

```
applications/
  foundry-app/     Next.js management app (clients, projects, invoicing, consulting)
docs/              Company processes and templates
packages/          Shared code (future)
```

## Getting Started

```bash
cd applications/foundry-app
npm install
cp .env.local.example .env.local
# Fill in Supabase, Square, and Anthropic API keys
npm run dev
```
