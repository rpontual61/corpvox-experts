export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      experts_users: {
        Row: {
          id: string
          email: string
          nome: string
          telefone_whatsapp: string | null
          tipo_perfil: 'sst' | 'business' | null
          empresa_nome: string | null
          empresa_cnpj: string | null
          qtd_empresas_atendidas: number | null
          pode_emitir_nf: boolean
          possui_vinculo_clt: boolean
          detalhes_vinculo_clt: string | null
          curso_concluido: boolean
          curso_concluido_em: string | null
          status: 'pendente' | 'aprovado' | 'reprovado' | 'suspenso'
          motivo_status: string | null
          chave_pix_empresa: string | null
          tipo_chave_pix: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'chave_aleatoria' | null
          aceitou_termo_adesao_em: string | null
          aceitou_termo_adesao_ip: string | null
          aceitou_politica_uso_em: string | null
          aceitou_politica_uso_ip: string | null
          origem_cadastro: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          email: string
          nome: string
          telefone_whatsapp?: string | null
          tipo_perfil?: 'sst' | 'business' | null
          empresa_nome?: string | null
          empresa_cnpj?: string | null
          qtd_empresas_atendidas?: number | null
          pode_emitir_nf?: boolean
          possui_vinculo_clt?: boolean
          detalhes_vinculo_clt?: string | null
          curso_concluido?: boolean
          curso_concluido_em?: string | null
          status?: 'pendente' | 'aprovado' | 'reprovado' | 'suspenso'
          motivo_status?: string | null
          chave_pix_empresa?: string | null
          tipo_chave_pix?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'chave_aleatoria' | null
          aceitou_termo_adesao_em?: string | null
          aceitou_termo_adesao_ip?: string | null
          aceitou_politica_uso_em?: string | null
          aceitou_politica_uso_ip?: string | null
          origem_cadastro?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          email?: string
          nome?: string
          telefone_whatsapp?: string | null
          tipo_perfil?: 'sst' | 'business' | null
          empresa_nome?: string | null
          empresa_cnpj?: string | null
          qtd_empresas_atendidas?: number | null
          pode_emitir_nf?: boolean
          possui_vinculo_clt?: boolean
          detalhes_vinculo_clt?: string | null
          curso_concluido?: boolean
          curso_concluido_em?: string | null
          status?: 'pendente' | 'aprovado' | 'reprovado' | 'suspenso'
          motivo_status?: string | null
          chave_pix_empresa?: string | null
          tipo_chave_pix?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'chave_aleatoria' | null
          aceitou_termo_adesao_em?: string | null
          aceitou_termo_adesao_ip?: string | null
          aceitou_politica_uso_em?: string | null
          aceitou_politica_uso_ip?: string | null
          origem_cadastro?: string | null
          criado_em?: string
          atualizado_em?: string
        }
      }
      experts_otps: {
        Row: {
          id: string
          expert_id: string | null
          email: string
          codigo: string
          valido_ate: string
          usado: boolean
          criado_em: string
        }
        Insert: {
          id?: string
          expert_id?: string | null
          email: string
          codigo: string
          valido_ate: string
          usado?: boolean
          criado_em?: string
        }
        Update: {
          id?: string
          expert_id?: string | null
          email?: string
          codigo?: string
          valido_ate?: string
          usado?: boolean
          criado_em?: string
        }
      }
      experts_indications: {
        Row: {
          id: string
          expert_id: string
          empresa_nome: string
          empresa_cnpj: string
          contato_nome: string
          contato_email: string | null
          contato_whatsapp: string | null
          tipo_indicacao: 'relatorio_tecnico' | 'email' | 'whatsapp_conversa' | null
          observacoes: string | null
          status: 'aguardando_validacao' | 'validacao_recusada' | 'em_contato' | 'em_analise' | 'contratou' | 'beneficio_previsto' | 'liberado_envio_nf' | 'nf_enviada' | 'pago'
          motivo_recusa: string | null
          validada_em: string | null
          validada_por: string | null
          data_expiracao_indicacao: string | null
          expirou: boolean
          contrato_id: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          expert_id: string
          empresa_nome: string
          empresa_cnpj: string
          contato_nome: string
          contato_email?: string | null
          contato_whatsapp?: string | null
          tipo_indicacao?: 'relatorio_tecnico' | 'email' | 'whatsapp_conversa' | null
          observacoes?: string | null
          status?: 'aguardando_validacao' | 'validacao_recusada' | 'em_contato' | 'em_analise' | 'contratou' | 'beneficio_previsto' | 'liberado_envio_nf' | 'nf_enviada' | 'pago'
          motivo_recusa?: string | null
          validada_em?: string | null
          validada_por?: string | null
          data_expiracao_indicacao?: string | null
          expirou?: boolean
          contrato_id?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          expert_id?: string
          empresa_nome?: string
          empresa_cnpj?: string
          contato_nome?: string
          contato_email?: string | null
          contato_whatsapp?: string | null
          tipo_indicacao?: 'relatorio_tecnico' | 'email' | 'whatsapp_conversa' | null
          observacoes?: string | null
          status?: 'aguardando_validacao' | 'validacao_recusada' | 'em_contato' | 'em_analise' | 'contratou' | 'beneficio_previsto' | 'liberado_envio_nf' | 'nf_enviada' | 'pago'
          motivo_recusa?: string | null
          validada_em?: string | null
          validada_por?: string | null
          data_expiracao_indicacao?: string | null
          expirou?: boolean
          contrato_id?: string | null
          criado_em?: string
          atualizado_em?: string
        }
      }
      experts_benefits: {
        Row: {
          id: string
          expert_id: string
          indication_id: string
          valor_mensalidade_cliente: number | null
          multiplicador_interno: number | null
          valor_beneficio: number | null
          data_contrato_cliente: string | null
          data_primeiro_pagamento_cliente: string | null
          data_prevista_pagamento_beneficio: string | null
          pode_enviar_nf_a_partir_de: string | null
          nf_enviada: boolean
          nf_data_emissao: string | null
          nf_valor: number | null
          nf_arquivo_url: string | null
          nf_enviada_em: string | null
          pagamento_realizado: boolean
          pagamento_data: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          expert_id: string
          indication_id: string
          valor_mensalidade_cliente?: number | null
          multiplicador_interno?: number | null
          valor_beneficio?: number | null
          data_contrato_cliente?: string | null
          data_primeiro_pagamento_cliente?: string | null
          data_prevista_pagamento_beneficio?: string | null
          pode_enviar_nf_a_partir_de?: string | null
          nf_enviada?: boolean
          nf_data_emissao?: string | null
          nf_valor?: number | null
          nf_arquivo_url?: string | null
          nf_enviada_em?: string | null
          pagamento_realizado?: boolean
          pagamento_data?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          expert_id?: string
          indication_id?: string
          valor_mensalidade_cliente?: number | null
          multiplicador_interno?: number | null
          valor_beneficio?: number | null
          data_contrato_cliente?: string | null
          data_primeiro_pagamento_cliente?: string | null
          data_prevista_pagamento_beneficio?: string | null
          pode_enviar_nf_a_partir_de?: string | null
          nf_enviada?: boolean
          nf_data_emissao?: string | null
          nf_valor?: number | null
          nf_arquivo_url?: string | null
          nf_enviada_em?: string | null
          pagamento_realizado?: boolean
          pagamento_data?: string | null
          criado_em?: string
          atualizado_em?: string
        }
      }
    }
  }
}

export type ExpertUser = Database['public']['Tables']['experts_users']['Row']
export type ExpertUserInsert = Database['public']['Tables']['experts_users']['Insert']
export type ExpertUserUpdate = Database['public']['Tables']['experts_users']['Update']

export type ExpertOTP = Database['public']['Tables']['experts_otps']['Row']
export type ExpertOTPInsert = Database['public']['Tables']['experts_otps']['Insert']
export type ExpertOTPUpdate = Database['public']['Tables']['experts_otps']['Update']

export type ExpertIndication = Database['public']['Tables']['experts_indications']['Row']
export type ExpertIndicationInsert = Database['public']['Tables']['experts_indications']['Insert']
export type ExpertIndicationUpdate = Database['public']['Tables']['experts_indications']['Update']

export type ExpertBenefit = Database['public']['Tables']['experts_benefits']['Row']
export type ExpertBenefitInsert = Database['public']['Tables']['experts_benefits']['Insert']
export type ExpertBenefitUpdate = Database['public']['Tables']['experts_benefits']['Update']
