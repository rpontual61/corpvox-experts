# Guia de Setup - CorpVox Experts

## Status Atual ✅

O projeto foi criado com sucesso! A estrutura base está pronta com:

- ✅ React + TypeScript + Vite configurado
- ✅ Tailwind CSS com tema CorpVox
- ✅ Supabase integrado (usando mesma configuração do dashboard)
- ✅ Estrutura de pastas organizada
- ✅ Git inicializado com commit inicial
- ✅ Remote configurado para GitHub
- ✅ Dependências instaladas
- ✅ Arquivo vercel.json criado

## Próximos Passos

### 1. Configurar Variáveis de Ambiente Locais

Copie as credenciais do Supabase do projeto corpvox-dashboard:

```bash
cd /Users/raphaelpontual/Desktop/corpvox-experts
cp .env.example .env
```

Depois edite o arquivo `.env` e adicione as mesmas credenciais do dashboard:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

### 2. Testar Localmente

```bash
npm run dev
```

Acesse: http://localhost:5173

### 3. Push para o GitHub

O repositório já está configurado. Faça o push:

```bash
git push -u origin main
```

**Nota**: Você precisará autenticar no GitHub. Se estiver usando token de acesso pessoal, use-o como senha.

### 4. Configurar Vercel

#### Opção A: Via Dashboard Vercel (Recomendado)

1. Acesse: https://vercel.com/
2. Clique em "Add New Project"
3. Importe o repositório: `rpontual61/corpvox-experts`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Adicione as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_NAME=CorpVox Experts`
   - `VITE_APP_ENVIRONMENT=production`

6. Configure o domínio customizado:
   - Vá em Settings > Domains
   - Adicione: `experts.corpvox.com.br`
   - Configure o DNS conforme instruções do Vercel

#### Opção B: Via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

Siga as instruções e configure as variáveis de ambiente quando solicitado.

### 5. Configurar DNS

No seu provedor de DNS (onde está registrado corpvox.com.br), adicione:

**Registro CNAME:**
- Nome: `experts`
- Valor: `cname.vercel-dns.com`
- TTL: 3600 (ou automático)

### 6. Verificar Deploy

Após configurar tudo:
1. Vercel fará deploy automático
2. Acesse: https://experts.corpvox.com.br
3. Teste a autenticação com usuário do Supabase

## Estrutura do Banco de Dados

O projeto usa o mesmo banco Supabase (schema `public`) dos outros projetos CorpVox.

Principais tabelas que serão utilizadas:
- `users` - Usuários do sistema
- `companies` - Empresas
- (Adicione aqui as tabelas específicas do Experts quando definidas)

## Desenvolvimento

### Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

### Estrutura de Pastas

```
src/
├── components/     # Componentes React reutilizáveis
├── hooks/          # Custom hooks
├── lib/            # Configurações (Supabase, etc)
├── types/          # Definições TypeScript
├── utils/          # Funções utilitárias
├── contexts/       # Context API providers
└── styles/         # Estilos adicionais CSS
```

## Troubleshooting

### Erro ao fazer push para GitHub

Se receber erro de autenticação:
1. Gere um Personal Access Token: https://github.com/settings/tokens
2. Use o token como senha quando solicitado

### Erro de build no Vercel

Verifique:
1. Variáveis de ambiente estão configuradas
2. Build command está correto: `npm run build`
3. Output directory está correto: `dist`

### Erro de conexão com Supabase

Verifique:
1. Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão corretas
2. As credenciais são as mesmas do corpvox-dashboard
3. O projeto Supabase está ativo

## Contato

Para dúvidas sobre o setup, consulte a documentação do CorpVox Dashboard que tem a mesma estrutura.
