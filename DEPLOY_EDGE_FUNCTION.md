# Deploy da Edge Function - Upload de NF

## O que é?

Esta Edge Function permite que experts façam upload de Notas Fiscais de forma **segura**, usando a `SUPABASE_SERVICE_ROLE_KEY` no servidor (bypassa RLS policies).

## Por que usar Edge Function?

✅ **Segurança**: Service role key fica no servidor, não no frontend
✅ **Simples**: Não precisa criar backend completo
✅ **Serverless**: Sem gerenciamento de servidor
✅ **Integrado**: Deploy direto no Supabase
✅ **Isolado**: Não afeta outras aplicações

## Passo a passo para deploy

### 1. Instalar Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Ou via npm
npm install -g supabase
```

### 2. Login no Supabase

```bash
supabase login
```

Isso vai abrir o browser para você fazer login.

### 3. Linkar ao projeto

```bash
cd /Users/raphaelpontual/Desktop/corpvox-experts

# Linkar ao projeto (você vai escolher o projeto na lista)
supabase link --project-ref SEU_PROJECT_REF
```

**Como encontrar o PROJECT_REF:**
- Acesse o dashboard do Supabase
- Vá em `Settings` → `General`
- Copie o `Reference ID`

### 4. Deploy da função

```bash
# Deploy da edge function
supabase functions deploy upload-expert-nf
```

### 5. Configurar variáveis de ambiente (IMPORTANTE!)

A Edge Function precisa da `SERVICE_ROLE_KEY` para funcionar:

```bash
# Pegar a service role key
# Dashboard → Settings → API → service_role (secret)

# Configurar no Supabase
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...SEU_SERVICE_ROLE_KEY_AQUI
```

**ATENÇÃO:** Essa chave é **SECRETA** e tem acesso total ao banco. Nunca exponha no frontend!

### 6. Testar a função

Depois do deploy, teste se está funcionando:

```bash
# URL da função vai ser:
# https://SEU_PROJECT_REF.supabase.co/functions/v1/upload-expert-nf

# Teste via curl (substitua os valores)
curl -X POST \
  https://SEU_PROJECT_REF.supabase.co/functions/v1/upload-expert-nf \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -F "file=@/caminho/para/teste.pdf" \
  -F "expertId=expert-id-aqui" \
  -F "benefitId=benefit-id-aqui" \
  -F "indicationId=indication-id-aqui" \
  -F "valorBeneficio=500.00"
```

## Logs e monitoramento

Para ver logs da função:

```bash
# Logs em tempo real
supabase functions logs upload-expert-nf --tail

# Logs históricos
supabase functions logs upload-expert-nf
```

## Remover políticas RLS antigas (OPCIONAL)

Se você criou políticas RLS permissivas antes, pode removê-las agora:

```sql
-- No SQL Editor do Supabase
DROP POLICY IF EXISTS "Allow anon INSERT on experts-nf" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon SELECT on experts-nf" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon UPDATE on experts-nf" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon DELETE on experts-nf" ON storage.objects;
DROP POLICY IF EXISTS "Allow public INSERT on experts-nf" ON storage.objects;
DROP POLICY IF EXISTS "Allow public SELECT on experts-nf" ON storage.objects;
DROP POLICY IF EXISTS "Allow public UPDATE on experts-nf" ON storage.objects;
DROP POLICY IF EXISTS "Allow public DELETE on experts-nf" ON storage.objects;
```

**Por que remover?** Porque agora a Edge Function usa service_role que bypassa RLS. Não precisa mais das políticas permissivas.

## Estrutura final

```
corpvox-experts/
├── src/
│   ├── components/
│   └── lib/
│       └── supabase.ts          ← Frontend chama a Edge Function
├── supabase/
│   └── functions/
│       └── upload-expert-nf/
│           └── index.ts         ← Edge Function (deploy no Supabase)
└── DEPLOY_EDGE_FUNCTION.md      ← Este arquivo
```

## Checklist de deploy

- [ ] Supabase CLI instalado
- [ ] Login feito (`supabase login`)
- [ ] Projeto linkado (`supabase link`)
- [ ] Edge Function deployada (`supabase functions deploy upload-expert-nf`)
- [ ] Service role key configurada (`supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...`)
- [ ] Testado via curl ou frontend
- [ ] Logs verificados (`supabase functions logs upload-expert-nf`)
- [ ] (Opcional) RLS policies antigas removidas

## Troubleshooting

### Erro: "Missing required fields"
→ Verifique se está enviando todos os campos no FormData (file, expertId, benefitId, indicationId, valorBeneficio)

### Erro: "Failed to upload file to storage"
→ Verifique se a SERVICE_ROLE_KEY está configurada corretamente

### Erro: "Failed to update benefit record in database"
→ Verifique se o benefitId existe e está com status 'liberado_para_nf'

### Erro: CORS
→ Edge Function já tem CORS configurado. Se der erro, verifique se está usando o endpoint correto

## Segurança

✅ **O que está seguro:**
- Service role key no servidor (Edge Function)
- Validações de tipo de arquivo (PDF/XML)
- Validação de tamanho (10MB)
- Upload direto do frontend para Edge Function
- Edge Function atualiza banco de dados

⚠️ **Melhorias futuras (opcional):**
- Adicionar autenticação do expert na Edge Function (verificar se expertId bate com usuário logado)
- Adicionar rate limiting
- Adicionar antivírus scan nos arquivos

## Custo

Edge Functions do Supabase:
- **Free tier**: 500K invocações/mês + 2GB transferência
- **Pro**: 2M invocações/mês + 10GB transferência

Para upload de NF, o free tier é **mais que suficiente** (mesmo com centenas de experts).
