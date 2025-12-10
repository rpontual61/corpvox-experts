import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

/**
 * Sanitiza o nome do arquivo para evitar problemas no storage
 */
function sanitizeFileName(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';

  let sanitized = nameWithoutExt
    .replace(/[^\w\s\-\.]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  if (!sanitized) {
    sanitized = `file_${Date.now()}`;
  }

  return sanitized + extension;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key (bypassa RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse the request body
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const expertId = formData.get('expertId') as string;
    const benefitId = formData.get('benefitId') as string;
    const indicationId = formData.get('indicationId') as string;
    const valorBeneficio = formData.get('valorBeneficio') as string;
    const isReplacement = formData.get('isReplacement') === 'true'; // Flag para substituição

    // Validação dos campos obrigatórios
    if (!file || !expertId || !benefitId || !indicationId || !valorBeneficio) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: file, expertId, benefitId, indicationId, valorBeneficio'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validação do tipo de arquivo (PDF ou XML apenas)
    const allowedTypes = ['application/pdf', 'text/xml', 'application/xml'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid file type. Only PDF and XML are allowed.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validação do tamanho do arquivo (max 10MB)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'File size exceeds 10MB limit'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Sanitiza o nome do arquivo
    const sanitizedFileName = sanitizeFileName(file.name);

    // Gera o caminho completo: {expert_id}/{benefit_id}_{timestamp}.ext
    const timestamp = Date.now();
    const fileExt = sanitizedFileName.split('.').pop();
    const filePath = `${expertId}/${benefitId}_${timestamp}.${fileExt}`;

    console.log('Upload NF info:', {
      expertId,
      benefitId,
      indicationId,
      originalName: file.name,
      sanitizedName: sanitizedFileName,
      fullPath: filePath,
      fileSize: file.size,
      fileType: file.type,
      isReplacement
    });

    // Se for substituição, buscar e deletar arquivo antigo
    if (isReplacement) {
      const { data: benefit, error: benefitError } = await supabase
        .from('experts_benefits')
        .select('nf_arquivo_url')
        .eq('id', benefitId)
        .single();

      if (!benefitError && benefit?.nf_arquivo_url) {
        console.log('Deletando arquivo antigo:', benefit.nf_arquivo_url);
        const { error: deleteError } = await supabase.storage
          .from('experts-nf')
          .remove([benefit.nf_arquivo_url]);

        if (deleteError) {
          console.error('Erro ao deletar arquivo antigo:', deleteError);
          // Não falha o upload, apenas loga o erro
        } else {
          console.log('Arquivo antigo deletado com sucesso');
        }
      }
    }

    // Upload do arquivo para o bucket com service role (bypassa RLS)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('experts-nf')
      .upload(filePath, file, {
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to upload file: ${uploadError.message}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Atualiza o registro do benefício no banco (com service role, bypassa RLS)
    const dataEmissao = new Date().toISOString().split('T')[0];
    const dataEnvio = new Date().toISOString();

    const { error: updateBenefitError } = await supabase
      .from('experts_benefits')
      .update({
        status: 'aguardando_conferencia', // Mudou: agora vai para conferência
        nf_enviada: true,
        nf_arquivo_url: filePath,
        nf_enviada_em: dataEnvio,
        nf_data_emissao: dataEmissao,
        nf_valor: parseFloat(valorBeneficio),
        nf_recusa_justificativa: null, // Limpa justificativa de recusa anterior
      })
      .eq('id', benefitId);

    if (updateBenefitError) {
      console.error('Database error (experts_benefits):', updateBenefitError);

      // Tenta fazer cleanup do arquivo enviado
      await supabase.storage
        .from('experts-nf')
        .remove([filePath]);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to update benefit record in database'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Atualiza o status da indicação
    const { error: updateIndicationError } = await supabase
      .from('experts_indications')
      .update({ status: 'nf_enviada' })
      .eq('id', indicationId);

    if (updateIndicationError) {
      console.error('Database error (experts_indications):', updateIndicationError);
      // Não faz rollback aqui porque o benefício já foi atualizado
      // Apenas loga o erro
    }

    // Gera URL pública do arquivo (se o bucket for público)
    const { data: { publicUrl } } = supabase.storage
      .from('experts-nf')
      .getPublicUrl(filePath);

    return new Response(
      JSON.stringify({
        success: true,
        filePath: filePath,
        publicUrl: publicUrl,
        message: 'NF uploaded successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
