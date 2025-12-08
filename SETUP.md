# Guia de Setup - CorpVox Experts

## 🎯 Status Atual

✅ **Implementação Completa do Frontend**
- Sistema de autenticação OTP
- Dashboard com estatísticas
- Gerenciamento de indicações
- Sistema de benefícios e pagamentos
- Páginas de conteúdo (curso, guia, dados)
- Layout responsivo e sidebar
- Todos os componentes criados

✅ **Banco de Dados Estruturado**
- Migration completa criada
- 4 tabelas principais
- Triggers e funções automáticas
- Row Level Security configurado

✅ **Documentação Completa**
- README.md atualizado
- Types TypeScript
- Helper functions

## 📋 Próximos Passos

### Passo 1: Configurar o Banco de Dados no Supabase

#### 1.1. Acessar o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Entre no projeto que você usa para o CorpVox Dashboard
3. Vá em **SQL Editor** no menu lateral

#### 1.2. Executar a Migration

1. Abra o arquivo: `/Users/raphaelpontual/Desktop/corpvox-experts/supabase/migrations/001_create_experts_tables.sql`
2. Copie **todo o conteúdo** do arquivo
3. No SQL Editor do Supabase, cole o conteúdo
4. Clique em **Run** (canto inferior direito)
5. Aguarde a confirmação: "Success. No rows returned"

#### 1.3. Criar Bucket de Storage para Notas Fiscais

No SQL Editor, execute:

```sql
-- Criar bucket para armazenar NFs dos Experts
INSERT INTO storage.buckets (id, name, public)
VALUES ('experts-nf', 'experts-nf', false);

-- Política de upload (apenas experts podem fazer upload dos próprios arquivos)
CREATE POLICY "Experts podem fazer upload de NF"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'experts-nf' AND
  auth.uid() IN (
    SELECT id FROM experts_users WHERE email = auth.jwt()->>'email'
  )
);

-- Política de leitura (apenas experts podem ver suas próprias NFs)
CREATE POLICY "Experts podem ver suas próprias NFs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'experts-nf' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM experts_users WHERE email = auth.jwt()->>'email'
  )
);
```

#### 1.4. Verificar Tabelas Criadas

No SQL Editor, execute para verificar:

```sql
-- Listar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'experts_%';

-- Deve retornar:
-- experts_users
-- experts_otps
-- experts_indications
-- experts_benefits
```

### Passo 2: Criar um Expert de Teste

No SQL Editor, crie um usuário Expert para testes:

```sql
INSERT INTO public.experts_users (
  email,
  nome,
  tipo_perfil,
  status,
  pode_emitir_nf,
  possui_vinculo_clt
) VALUES (
  'seu-email@teste.com',  -- ⚠️ ALTERE AQUI para seu e-mail
  'Expert Teste',
  'sst',
  'aprovado',
  true,
  false
);
```

### Passo 3: Configurar Variáveis de Ambiente

#### 3.1. Obter Credenciais do Supabase

1. No Supabase Dashboard, vá em **Settings** > **API**
2. Copie:
   - **Project URL** (exemplo: https://xxxxx.supabase.co)
   - **anon/public key** (chave longa começando com "eyJ...")

#### 3.2. Criar arquivo .env

```bash
cd /Users/raphaelpontual/Desktop/corpvox-experts
```

Crie o arquivo `.env` (se não existir) e adicione:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

⚠️ **Importante**: Substitua pelos valores reais do seu projeto Supabase!

### Passo 4: Testar Localmente

```bash
# No terminal, dentro da pasta do projeto
npm run dev
```

Acesse: http://localhost:5173

**Teste o fluxo:**
1. Digite o e-mail que você criou no Passo 2
2. Veja o código OTP no console do terminal (aparecerá algo como: `OTP Code for seu-email@teste.com: 123456`)
3. Digite o código para entrar
4. Explore o dashboard

### Passo 5: Configurar Integração de E-mail (OTP)

#### Opção A: Resend (Recomendado - Fácil e Gratuito)

1. Crie conta em: https://resend.com/
2. Obtenha sua API Key
3. Adicione ao `.env`:
   ```env
   VITE_RESEND_API_KEY=re_xxxxx
   ```

4. Crie um arquivo `api/send-otp.ts` (função serverless):

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.VITE_RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  const { email, code } = req.body;

  await resend.emails.send({
    from: 'CorpVox Experts <noreply@corpvox.com.br>',
    to: email,
    subject: 'Seu código de acesso - CorpVox Experts',
    html: `
      <h2>Código de Verificação</h2>
      <p>Seu código para acessar a plataforma CorpVox Experts é:</p>
      <h1 style="font-size: 32px; color: #764099;">${code}</h1>
      <p>Este código expira em 15 minutos.</p>
    `
  });

  res.status(200).json({ success: true });
}
```

5. Atualize `src/lib/supabase.ts` linha 78-96:

```typescript
export const sendOTPEmail = async (email: string, code: string): Promise<boolean> => {
  try {
    await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};
```

#### Opção B: Por enquanto, deixar apenas no console

Se preferir configurar o e-mail depois, o sistema já funciona logando o código no console (modo de desenvolvimento).

### Passo 6: Commit e Push para GitHub

```bash
cd /Users/raphaelpontual/Desktop/corpvox-experts

# Adicionar todas as mudanças
git add .

# Fazer commit
git commit -m "Implementação completa do Programa Experts CorpVox"

# Push para GitHub
git push -u origin main
```

**Nota**: Se pedir autenticação, use seu token do GitHub como senha.

### Passo 7: Deploy no Vercel

#### 7.1. Criar Projeto no Vercel

1. Acesse: https://vercel.com/
2. Faça login com sua conta
3. Clique em **"Add New..."** > **"Project"**
4. Selecione **"Import Git Repository"**
5. Encontre `corpvox-experts` na lista
6. Clique em **"Import"**

#### 7.2. Configurar o Build

Na tela de configuração:

- **Framework Preset**: `Vite`
- **Root Directory**: `./` (deixe em branco)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### 7.3. Adicionar Variáveis de Ambiente

Clique em **"Environment Variables"** e adicione:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | https://seu-projeto.supabase.co |
| `VITE_SUPABASE_ANON_KEY` | sua-chave-anonima |
| `VITE_RESEND_API_KEY` | re_xxxxx (se configurou e-mail) |

⚠️ Certifique-se de selecionar **Production**, **Preview** e **Development** para cada variável!

#### 7.4. Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (2-3 minutos)
3. Quando terminar, você verá: "🎉 Congratulations!"
4. Clique em **"Visit"** para ver o site

### Passo 8: Configurar Domínio Personalizado

#### 8.1. No Vercel

1. Vá em **Settings** > **Domains**
2. Digite: `experts.corpvox.com.br`
3. Clique em **"Add"**
4. O Vercel mostrará as instruções de DNS

#### 8.2. No seu Provedor de DNS

No painel onde você gerencia o domínio `corpvox.com.br`, adicione:

**Registro CNAME:**
```
Type: CNAME
Name: experts
Value: cname.vercel-dns.com
TTL: 3600
```

#### 8.3. Aguardar Propagação

- Pode levar de 5 minutos a 48 horas
- Teste em: https://dnschecker.org/
- Digite: `experts.corpvox.com.br`

### Passo 9: Criar Mais Experts

Para adicionar novos Experts, use o SQL Editor do Supabase:

```sql
INSERT INTO public.experts_users (
  email,
  nome,
  telefone_whatsapp,
  tipo_perfil,
  empresa_nome,
  empresa_cnpj,
  status,
  pode_emitir_nf,
  possui_vinculo_clt,
  origem_cadastro
) VALUES (
  'expert@empresa.com',
  'Nome do Expert',
  '(11) 99999-9999',
  'sst',  -- ou 'business'
  'Nome da Empresa',
  '12345678901234',  -- 14 dígitos sem formatação
  'pendente',  -- ou 'aprovado' se já foi validado
  true,  -- se pode emitir nota fiscal
  false,  -- se possui vínculo CLT
  'manual'
);
```

### Passo 10: Testar o Sistema Completo

#### 10.1. Teste o Login
1. Acesse: https://experts.corpvox.com.br
2. Digite um e-mail de Expert cadastrado
3. Verifique se recebeu o código (console ou e-mail)
4. Entre com o código

#### 10.2. Teste o Fluxo do Expert
1. **Dashboard**: Veja as estatísticas
2. **Curso**: Marque como concluído
3. **Meus Dados**:
   - Preencha os dados pessoais
   - Adicione chave PIX
   - Aceite os termos
4. **Indicações**: Crie uma indicação de teste
5. **Benefícios**: (será preenchido quando houver contratos)

#### 10.3. Simular Status de Indicação

Para testar os status, no SQL Editor:

```sql
-- Ver indicação criada
SELECT * FROM experts_indications
WHERE expert_id = (SELECT id FROM experts_users WHERE email = 'seu-email@teste.com');

-- Aprovar indicação (simular validação CorpVox)
UPDATE experts_indications
SET status = 'em_contato', validada_em = NOW()
WHERE id = 'id-da-indicacao';

-- Simular contratação
UPDATE experts_indications
SET status = 'contratou'
WHERE id = 'id-da-indicacao';

-- Criar benefício
INSERT INTO experts_benefits (
  expert_id,
  indication_id,
  valor_mensalidade_cliente,
  multiplicador_interno,
  data_contrato_cliente,
  data_primeiro_pagamento_cliente
) VALUES (
  (SELECT id FROM experts_users WHERE email = 'seu-email@teste.com'),
  'id-da-indicacao',
  1000.00,  -- R$ 1.000 mensalidade cliente
  0.10,     -- 10% de comissão (interno)
  '2024-12-08',
  '2025-01-10'
);
```

## 📊 Estrutura do Banco de Dados

### Tabelas Criadas

#### `experts_users`
Dados dos Experts (SST ou Business):
- Informações pessoais e empresariais
- Status de aprovação
- Dados de PIX
- Controle de curso e termos

#### `experts_otps`
Códigos de autenticação OTP:
- Validade de 15 minutos
- Uso único
- Limpeza automática

#### `experts_indications`
Indicações feitas pelos Experts:
- 9 status possíveis
- Regra de 90 dias
- Dados da empresa indicada

#### `experts_benefits`
Benefícios financeiros:
- Cálculo automático
- Controle de NF
- Datas de pagamento

## 🔧 Próximas Implementações

### Área Administrativa (Separada)

Criar sistema para time CorpVox gerenciar:

1. **Validação de Indicações**
   - Aprovar/recusar indicações
   - Adicionar motivo de recusa
   - Mudar status manualmente

2. **Gestão de Experts**
   - Aprovar cadastros
   - Suspender Experts
   - Ver histórico completo

3. **Controle de Benefícios**
   - Registrar contratos
   - Calcular benefícios
   - Controlar pagamentos
   - Gerar relatórios

4. **Dashboard Administrativo**
   - Estatísticas gerais
   - Experts mais ativos
   - Indicações por período
   - Valor total de benefícios

### Melhorias Sugeridas

- [ ] Notificações por e-mail (status de indicações)
- [ ] Notificações push
- [ ] Exportação de dados (CSV, PDF)
- [ ] Gráficos no dashboard (Recharts)
- [ ] Sistema de mensagens internas
- [ ] Upload de comprovantes de indicação
- [ ] Histórico de alterações
- [ ] Gamificação (rankings, badges)

## 🆘 Troubleshooting

### ❌ Erro: "Missing Supabase environment variables"

**Causa**: Variáveis de ambiente não configuradas

**Solução**:
```bash
# Verifique se o .env existe
cat .env

# Se não existir, crie:
echo "VITE_SUPABASE_URL=https://seu-projeto.supabase.co" > .env
echo "VITE_SUPABASE_ANON_KEY=sua-chave" >> .env
```

### ❌ Erro: "Código inválido ou expirado" no OTP

**Causas possíveis**:
1. Código expirou (15 minutos)
2. Código já foi usado
3. Expert não existe no banco

**Solução**:
```sql
-- Verificar se Expert existe
SELECT * FROM experts_users WHERE email = 'seu-email@teste.com';

-- Se não existir, criar (veja Passo 2)
```

### ❌ Erro: "Não é possível criar indicações"

**Causa**: Pré-requisitos não cumpridos

**Solução**: O Expert precisa ter:
```sql
UPDATE experts_users SET
  curso_concluido = true,
  curso_concluido_em = NOW(),
  chave_pix_empresa = 'sua-chave-pix',
  tipo_chave_pix = 'cnpj',
  aceitou_termo_adesao_em = NOW(),
  aceitou_termo_adesao_ip = '127.0.0.1',
  aceitou_politica_uso_em = NOW(),
  aceitou_politica_uso_ip = '127.0.0.1',
  status = 'aprovado'
WHERE email = 'seu-email@teste.com';
```

### ❌ Erro no Build do Vercel

**Solução**:
1. Vá em **Deployments** no Vercel
2. Clique no deploy com erro
3. Veja os logs completos
4. Verifique:
   - Variáveis de ambiente configuradas
   - `npm run build` funciona localmente
   - Todos os arquivos foram commitados

### ❌ Erro: "relation 'experts_users' does not exist"

**Causa**: Migration não foi executada

**Solução**: Execute novamente o Passo 1.2 (copiar e colar a migration completa no SQL Editor)

### 🔍 Ver Logs de Erros

No Supabase:
1. Vá em **Logs** > **Postgres Logs**
2. Veja erros de queries

No Vercel:
1. Vá em **Deployments**
2. Clique no deploy
3. Veja **Functions** e **Build Logs**

## 📞 Suporte

- **Documentação**: [README.md](README.md)
- **Issues**: https://github.com/rpontual61/corpvox-experts/issues
- **E-mail**: suporte@corpvox.com
- **WhatsApp**: (61) 99257-8817

## ✅ Checklist Final

Antes de colocar em produção, verifique:

- [ ] Migration executada no Supabase
- [ ] Bucket de storage criado
- [ ] Variáveis de ambiente configuradas (local e Vercel)
- [ ] Expert de teste criado
- [ ] Login funcionando
- [ ] Dashboard carregando
- [ ] Indicações sendo criadas
- [ ] Deploy no Vercel com sucesso
- [ ] Domínio personalizado configurado
- [ ] DNS propagado
- [ ] E-mail OTP funcionando (ou console)
- [ ] Teste completo do fluxo
- [ ] Área administrativa planejada

---

**CorpVox © 2024** - A sua plataforma de escuta corporativa 💜
