# CorpVox Experts - Programa de Indicações

Plataforma web para gerenciamento do Programa Experts CorpVox, permitindo que especialistas (SST e Business) indiquem empresas e recebam benefícios financeiros.

## 🎯 Visão Geral

O Programa Experts CorpVox é uma iniciativa para reconhecer e recompensar profissionais que indicam empresas para utilizar a plataforma CorpVox. Os Experts podem fazer indicações de três formas (relatório técnico, e-mail ou WhatsApp) e receber benefícios financeiros quando as empresas contratam o serviço.

## ✨ Funcionalidades Principais

### Autenticação
- Login via código OTP (One-Time Password) enviado por e-mail
- Sem necessidade de senha
- Sessão persistente no navegador
- Código válido por 15 minutos

### Dashboard
- Visão geral de indicações e benefícios
- Estatísticas em tempo real
- Alertas para pendências (curso, PIX, termos)
- Indicações recentes
- Ações rápidas

### Gerenciamento de Indicações
- Criação de novas indicações
- Validação de CNPJ
- Três tipos de indicação: Relatório Técnico, E-mail, WhatsApp
- Acompanhamento de status em tempo real
- Sistema de expiração (90 dias)
- Filtros e busca

### Benefícios e Pagamentos
- Visualização de todos os benefícios
- Upload de Nota Fiscal
- Rastreamento de pagamentos
- Estatísticas financeiras
- Prazos e datas de pagamento

### Área do Expert
- **Curso Obrigatório**: Treinamento sobre o programa
- **Como Indicar**: Guia completo de indicação
- **Meus Dados**: Gerenciamento de dados pessoais, empresariais e PIX
- **Termos**: Aceitação de termos e políticas

## 🏗️ Arquitetura

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Row Level Security)
- **Storage**: Supabase Storage (para NFs)
- **E-mail**: Sistema de OTP (integração pendente)
- **Deployment**: Vercel

### Estrutura do Banco de Dados

#### Tabelas Principais

**experts_users**
- Dados pessoais e empresariais do Expert
- Status de aprovação
- Dados de PIX
- Controle de curso e termos aceitos

**experts_otps**
- Códigos OTP para autenticação
- Validade de 15 minutos
- Controle de uso único

**experts_indications**
- Indicações feitas pelos Experts
- 9 status possíveis (aguardando_validacao → pago)
- Regra de expiração de 90 dias
- Dados da empresa e contato

**experts_benefits**
- Benefícios financeiros gerados
- Cálculo automático de valores
- Controle de NF e pagamentos
- Datas de envio e pagamento

### Regras de Negócio

#### Pré-requisitos para Indicar
1. Curso obrigatório concluído
2. Chave PIX cadastrada
3. Termo de adesão aceito
4. Política de uso aceita
5. Status "aprovado"

#### Fluxo de Indicação
1. **Aguardando Validação**: Expert cria indicação
2. **Validação Recusada** ou **Em Contato**: Time CorpVox valida
3. **Em Análise**: Empresa em processo de análise
4. **Contratou**: Empresa fechou contrato
5. **Benefício Previsto**: Benefício calculado e registrado
6. **Liberado Envio NF**: Expert pode enviar NF (dia 5-15 do mês)
7. **NF Enviada**: NF recebida e processando
8. **Pago**: Pagamento realizado (dia 15 do mês)

#### Regra dos 90 Dias
- Indicações expiram em 90 dias sem contratação
- Trigger automático marca como expiradas
- Empresas expiradas podem ser indicadas novamente

#### Cálculo de Benefícios
- Valor base: mensalidade do cliente × multiplicador interno
- Multiplicador não é visível ao Expert
- Cálculo automático via trigger no banco

#### Datas de Pagamento
- **Envio NF**: Entre dia 5 e 15 do mês do primeiro pagamento
- **Pagamento Expert**: Dia 15 do mês seguinte

## 📁 Estrutura de Arquivos

```
corpvox-experts/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx           # Tela de login com e-mail
│   │   │   └── OTPVerification.tsx     # Verificação do código OTP
│   │   ├── dashboard/
│   │   │   ├── DashboardLayout.tsx     # Layout com sidebar
│   │   │   └── Dashboard.tsx           # Dashboard principal
│   │   ├── indications/
│   │   │   └── IndicationsPage.tsx     # Gerenciamento de indicações
│   │   ├── benefits/
│   │   │   └── BenefitsPage.tsx        # Gerenciamento de benefícios
│   │   └── content/
│   │       ├── CoursePage.tsx          # Curso obrigatório
│   │       ├── HowToIndicatePage.tsx   # Guia de indicação
│   │       └── MyDataPage.tsx          # Dados do Expert
│   ├── lib/
│   │   └── supabase.ts                 # Cliente Supabase + helpers
│   ├── types/
│   │   └── database.types.ts           # Types do banco de dados
│   ├── App.tsx                         # Componente principal
│   └── main.tsx                        # Entry point
├── supabase/
│   └── migrations/
│       └── 001_create_experts_tables.sql  # Schema completo do banco
├── public/
│   ├── Logo.svg                        # Logo CorpVox
│   └── Icon_positivo.svg               # Ícone CorpVox
└── README.md
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- Projeto Supabase configurado
- Variáveis de ambiente

### Instalação

1. Clone o repositório:
```bash
cd corpvox-experts
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente (`.env`):
```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

4. Execute as migrations no Supabase:
```bash
# Via Supabase CLI
supabase db push

# Ou copie o conteúdo de supabase/migrations/001_create_experts_tables.sql
# e execute no SQL Editor do Supabase Dashboard
```

5. Crie o bucket de storage para NFs:
```sql
-- No SQL Editor do Supabase
INSERT INTO storage.buckets (id, name, public)
VALUES ('experts-nf', 'experts-nf', false);
```

6. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

7. Acesse: http://localhost:5173

## 🔐 Segurança

### Row Level Security (RLS)
- Todas as tabelas têm RLS ativado
- Experts só veem seus próprios dados
- Políticas baseadas em JWT do Supabase

### Validações
- CNPJ validado no frontend e backend
- Verificação de duplicidade de indicações
- Controle de status e transições
- Validação de arquivos (tamanho, tipo)

### Auditoria
- IP capturado em aceite de termos
- Timestamps automáticos (created_at, updated_at)
- Histórico de modificações via triggers

## 📊 Status das Indicações

| Status | Descrição | Cor |
|--------|-----------|-----|
| Aguardando Validação | Indicação criada pelo Expert | Amarelo |
| Validação Recusada | Indicação não aprovada pelo time | Vermelho |
| Em Contato | Time CorpVox contatando empresa | Azul |
| Em Análise | Empresa analisando proposta | Roxo |
| Contratou | Empresa fechou contrato | Verde |
| Benefício Previsto | Benefício calculado e aguardando | Índigo |
| Liberado Envio NF | Expert pode enviar nota fiscal | Teal |
| NF Enviada | Nota fiscal enviada e processando | Ciano |
| Pago | Pagamento realizado | Verde Esmeralda |

## 🔄 Integrações Pendentes

### E-mail (OTP)
Atualmente o OTP é apenas logado no console. Para produção, integrar com:
- Resend
- SendGrid
- Amazon SES
- Outro serviço de e-mail

Função a implementar: `sendOTPEmail()` em `src/lib/supabase.ts`

### Área Administrativa
Sistema separado para:
- Validar indicações
- Gerenciar status
- Controlar benefícios
- Aprovar/reprovar Experts
- Relatórios gerenciais

## 🎨 Design System

### Cores Principais
- **Primary**: Roxo CorpVox (#764099)
- **Success**: Verde (#10B981)
- **Warning**: Amarelo (#F59E0B)
- **Error**: Vermelho (#EF4444)

### Componentes
- Cards com sombra sutil
- Bordas arredondadas (rounded-xl)
- Espaçamentos consistentes (p-6, space-y-6)
- Animações suaves (transition-colors, hover states)
- Responsivo (mobile-first)

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview da build
npm run preview

# Lint
npm run lint
```

## 🌐 Deploy

### Vercel (Recomendado)
1. Conecte o repositório no Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### Outras Plataformas
- Netlify
- AWS Amplify
- Cloudflare Pages

## 📱 Mobile

A aplicação é totalmente responsiva e funciona perfeitamente em dispositivos móveis:
- Menu lateral colapsável
- Cards adaptáveis
- Touch-friendly
- Formulários otimizados

## 🧪 Testing (A Implementar)

Sugestões de testes:
- Unit tests (Vitest)
- Integration tests (Testing Library)
- E2E tests (Playwright/Cypress)
- Load testing (k6)

## 📈 Melhorias Futuras

- [ ] Notificações push
- [ ] Dashboard com gráficos avançados (Recharts)
- [ ] Exportação de dados (CSV, PDF)
- [ ] Histórico de alterações
- [ ] Sistema de mensagens internas
- [ ] Gamificação (badges, rankings)
- [ ] Programa de referência entre Experts
- [ ] Integração com CRM
- [ ] Analytics completo

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Propriedade da CorpVox. Todos os direitos reservados.

## 👥 Autores

- **CorpVox Team** - [corpvox.com](https://corpvox.com)

## 📞 Suporte

Para dúvidas ou suporte:
- E-mail: suporte@corpvox.com
- WhatsApp: (61) 99257-8817

---

**CorpVox © 2024** - A sua plataforma de escuta corporativa 💜
