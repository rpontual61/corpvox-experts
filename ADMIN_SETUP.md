# 🔐 Observatório Experts - Setup Administrativo

## 📋 Visão Geral

Foi criada uma área administrativa completa para gerenciar o sistema de Experts da CorpVox, acessível em:

**URL**: `https://experts.corpvox.com.br/observatorio`

Esta área permite:
- ✅ Validar e recusar indicações
- ✅ Gerenciar status de indicações
- ✅ Visualizar informações completas de cada indicação
- ✅ Log de atividades dos administradores
- 🔄 Gerenciar benefícios (em desenvolvimento)
- 🔄 Gerenciar experts (em desenvolvimento)

---

## 🗄️ Configuração do Banco de Dados

### 1. Executar Migrations

Você precisa executar as migrations SQL no seu banco Supabase:

#### **Opção 1: Via Supabase CLI**
```bash
cd /Users/raphaelpontual/Desktop/corpvox-experts
supabase db push
```

#### **Opção 2: Via SQL Editor no Supabase Dashboard**

Execute os arquivos na ordem:

**1. [002_update_indications_schema.sql](supabase/migrations/002_update_indications_schema.sql)**
- Adiciona campo `quantidade_funcionarios`
- Remove status antigos (`em_analise`, `beneficio_previsto`)
- Atualiza constraint de status

**2. [003_create_admin_tables.sql](supabase/migrations/003_create_admin_tables.sql)**
- Cria tabela `experts_admin_users` para credenciais
- Cria tabela `experts_admin_sessions` para sessões
- Cria tabela `experts_admin_activity_log` para auditoria

---

## 👤 Criar Usuário Administrador

Após executar as migrations, você precisa criar um usuário admin. Execute no SQL Editor do Supabase:

```sql
-- Criar usuário admin
INSERT INTO public.experts_admin_users (username, password_hash, nome, email, ativo)
VALUES (
  'admin',
  'R@phapontuau0203', -- Senha em texto simples
  'Administrador',
  'admin@corpvox.com.br',
  true
);
```

### 🔑 Credenciais de Acesso

**Usuário**: `admin`
**Senha**: `R@phapontuau0203`

### ⚠️ NOTA - Segurança

O sistema atual usa senha em texto simples para facilitar o uso interno. A senha é armazenada diretamente no campo `password_hash` e validada por comparação direta.

**Para trocar a senha**, basta atualizar o registro no banco:

```sql
UPDATE public.experts_admin_users
SET password_hash = 'SuaNovaSenha'
WHERE username = 'admin';
```

---

## 🚀 Acessar o Observatório

### Desenvolvimento Local

1. **Iniciar o servidor**:
```bash
cd /Users/raphaelpontual/Desktop/corpvox-experts
npm run dev
```

2. **Acessar**:
- Área Experts: `http://localhost:5173`
- **Observatório**: `http://localhost:5173/observatorio`

### Produção

Após fazer deploy na Vercel:
- Área Experts: `https://experts.corpvox.com.br`
- **Observatório**: `https://experts.corpvox.com.br/observatorio`

---

## 📱 Funcionalidades do Observatório

### 1. Dashboard de Indicações

**Rota**: `/observatorio` → Menu "Indicações"

**Recursos**:
- ✅ Lista todas as indicações com filtros
- ✅ Busca por empresa, CNPJ, contato ou nome do expert
- ✅ Filtro por status
- ✅ Cards com estatísticas (Total, Aguardando, Em Contato, Contratou!)
- ✅ Tabela responsiva com:
  - Nome da empresa e CNPJ
  - Nome do expert responsável
  - Quantidade de funcionários
  - Data da indicação
  - Status atual

### 2. Validar Indicação

**Ações disponíveis**:

#### **Para status "Aguardando Validação"**:

1. **Aprovar**
   - Botão verde "Aprovar Indicação"
   - Muda status para "CorpVox em contato"
   - Registra data e admin que validou

2. **Recusar**
   - Campo de texto para motivo da recusa (obrigatório)
   - Botão vermelho "Recusar Indicação"
   - Muda status para "Validação Recusada"
   - Salva motivo no banco

#### **Para outros status**:

- Dropdown para atualizar status manualmente
- Opções: Aguardando Validação, CorpVox em contato, Contratou!, Liberado Envio NF, NF Enviada, Pago
- Botão "Atualizar Status"

### 3. Visualizar Detalhes

Clique no ícone 👁️ para ver modal com:

**Dados da Empresa**:
- Nome
- CNPJ formatado
- Quantidade de funcionários

**Dados do Contato**:
- Nome
- E-mail (se informado)
- WhatsApp (se informado)

**Expert Responsável**:
- Nome do expert que fez a indicação

**Informações Adicionais**:
- Tipo de indicação (Relatório Técnico, E-mail, WhatsApp)
- Observações (se houver)
- Data da indicação

**Status Atual**:
- Badge colorido com status

### 4. Log de Atividades

Toda ação de administrador é registrada automaticamente:
- Login/Logout
- Validação de indicações
- Recusa de indicações
- Atualização de status
- Inclui: timestamp, IP, admin responsável, detalhes da ação

---

## 🎨 Mudanças no Sistema Expert

### Status Atualizados

Os status foram simplificados e renomeados:

| Status Antigo | Status Novo | Cor |
|--------------|-------------|-----|
| aguardando_validacao | Aguardando Validação | Amarelo |
| validacao_recusada | Validação Recusada | Vermelho |
| em_contato | **CorpVox em contato** | **Roxo** (antes era azul) |
| ~~em_analise~~ | REMOVIDO | - |
| contratou | **Contratou!** (com exclamação) | Verde |
| ~~beneficio_previsto~~ | REMOVIDO | - |
| liberado_envio_nf | Liberado Envio NF | Verde-água |
| nf_enviada | NF Enviada | Ciano |
| pago | Pago | Verde esmeralda |

### Novo Campo: Quantidade de Funcionários

- ✅ Adicionado ao formulário de nova indicação
- ✅ Campo obrigatório (validação: número > 0)
- ✅ Visível na tabela de gerenciamento
- ✅ Salvo no banco de dados

### Checkbox de Declaração

Ao criar nova indicação, o expert deve:

✅ Marcar checkbox declarando:
> "Declaro que realizei a indicação desta empresa e que ela está sob minha responsabilidade técnica. Estou ciente de que, em caso de falsidade nas informações prestadas, posso ser excluído do programa e não receberei o benefício correspondente a esta indicação."

- Botão "Criar Indicação" só fica ativo após marcar
- Validação implementada

---

## 📂 Estrutura de Arquivos Criados

```
corpvox-experts/
├── src/
│   ├── AdminApp.tsx                          # App principal do admin
│   ├── lib/
│   │   └── adminAuth.ts                      # Funções de autenticação admin
│   ├── components/
│   │   └── admin/
│   │       ├── AdminLoginPage.tsx            # Página de login
│   │       ├── AdminLayout.tsx               # Layout com sidebar
│   │       └── IndicationsManagementPage.tsx # Gerenciamento de indicações
│   └── types/
│       └── database.types.ts                 # Types atualizados
├── supabase/
│   └── migrations/
│       ├── 002_update_indications_schema.sql # Atualiza schema de indicações
│       └── 003_create_admin_tables.sql       # Cria tabelas de admin
└── public/
    └── observatorio/
        └── index.html                        # HTML da área admin
```

---

## 🔄 Próximos Passos (Em Desenvolvimento)

### Gerenciamento de Benefícios
- Criar benefícios automaticamente quando status = "Contratou!"
- Definir valores e multiplicadores
- Gerenciar datas (1º pagamento, data prevista, pode enviar NF)
- Validar NFs enviadas
- Marcar pagamentos como realizados

### Gerenciamento de Experts
- Listar todos os experts
- Aprovar/reprovar cadastros
- Visualizar histórico de indicações por expert
- Estatísticas de performance

### Dashboard Administrativo
- Gráficos de indicações por período
- Estatísticas de conversão
- Total de benefícios pagos
- Experts mais ativos

---

## 🚨 Checklist de Deploy

Antes de fazer deploy para produção:

- [ ] Executar migrations no Supabase de produção
- [ ] Criar usuário admin inicial
- [ ] **IMPLEMENTAR** autenticação segura com bcrypt
- [ ] Testar acesso em `/observatorio`
- [ ] Testar validação e recusa de indicações
- [ ] Testar atualização de status
- [ ] Verificar logs de atividade
- [ ] Configurar variáveis de ambiente (.env)

---

## 🆘 Troubleshooting

### Erro: "Usuário ou senha inválidos"
- Verifique se o usuário admin foi criado no banco
- Senha temporária: `admin123`
- Username: `admin`

### Erro: "Column não existe"
- Execute as migrations 002 e 003
- Verifique se foram aplicadas corretamente

### Página em branco em /observatorio
- Verifique console do navegador
- Certifique-se que o servidor está rodando
- Limpe cache do navegador

### Sessão expira rapidamente
- Sessões duram 8 horas
- Verifique a tabela `experts_admin_sessions`
- Função `clean_expired_experts_admin_sessions()` remove sessões antigas

---

## 📞 Contato

Para dúvidas ou sugestões sobre o Observatório Experts, entre em contato com a equipe de desenvolvimento.

---

**Última atualização**: 2025-12-09
**Versão**: 1.0.0
