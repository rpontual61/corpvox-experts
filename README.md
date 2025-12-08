# CorpVox Experts

Plataforma de Especialistas do CorpVox - Sistema para gestão de experts e análises especializadas.

## Stack Tecnológica

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (compartilhado com outras soluções CorpVox)
- **Deployment**: Vercel

## Estrutura do Projeto

```
corpvox-experts/
├── src/
│   ├── components/     # Componentes React
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Configurações e utilitários
│   ├── types/          # Definições de tipos TypeScript
│   ├── utils/          # Funções utilitárias
│   ├── contexts/       # Context API
│   └── styles/         # Estilos adicionais
├── public/             # Arquivos estáticos
└── ...
```

## Configuração Local

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/corpvox-experts.git
cd corpvox-experts
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Supabase.

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa o linter

## Deployment

O projeto está configurado para deploy automático no Vercel:
- **Produção**: https://experts.corpvox.com.br
- Commits na branch `main` disparam deploy automático

## Banco de Dados

Utiliza o mesmo banco de dados Supabase (schema `public`) das outras aplicações CorpVox:
- corpvox-dashboard
- corpvox-main
- corpvox-observatorio

## Licença

Propriedade da CorpVox - Todos os direitos reservados
