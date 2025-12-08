import { useEffect, useState } from 'react';
import { DollarSign, Upload, CheckCircle2, Clock, FileText, Calendar, AlertCircle } from 'lucide-react';
import { ExpertUser, ExpertBenefit, ExpertIndication } from '../../types/database.types';
import { supabase, formatCurrency, formatDate, uploadExpertNF } from '../../lib/supabase';

interface BenefitsPageProps {
  expert: ExpertUser;
}

interface BenefitWithIndication extends ExpertBenefit {
  indication?: ExpertIndication;
}

export default function BenefitsPage({ expert }: BenefitsPageProps) {
  const [benefits, setBenefits] = useState<BenefitWithIndication[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pendente: 0,
    pago: 0,
  });

  useEffect(() => {
    loadBenefits();
  }, [expert.id]);

  const loadBenefits = async () => {
    try {
      const { data, error } = await supabase
        .from('experts_benefits')
        .select(`
          *,
          indication:experts_indications(*)
        `)
        .eq('expert_id', expert.id)
        .order('criado_em', { ascending: false });

      if (error) throw error;

      const benefitsData = (data || []).map(item => ({
        ...item,
        indication: Array.isArray(item.indication) ? item.indication[0] : item.indication
      })) as BenefitWithIndication[];

      setBenefits(benefitsData);

      // Calculate stats
      const total = benefitsData.reduce((sum, b) => sum + (b.valor_beneficio || 0), 0);
      const pago = benefitsData.filter(b => b.pagamento_realizado).reduce((sum, b) => sum + (b.valor_beneficio || 0), 0);
      const pendente = total - pago;

      setStats({ total, pendente, pago });
      setLoading(false);
    } catch (error) {
      console.error('Error loading benefits:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary">
          Meus Benefícios
        </h2>
        <p className="text-text-secondary mt-1">
          Acompanhe seus benefícios e pagamentos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium opacity-90">
              Total de Benefícios
            </p>
          </div>
          <p className="text-3xl font-bold">
            {formatCurrency(stats.total)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-sm font-medium text-text-primary">
              Pendente
            </p>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {formatCurrency(stats.pendente)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-text-primary">
              Pago
            </p>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {formatCurrency(stats.pago)}
          </p>
        </div>
      </div>

      {/* Benefits List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {benefits.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-text-muted">
              Você ainda não possui benefícios registrados
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {benefits.map((benefit) => (
              <BenefitCard
                key={benefit.id}
                benefit={benefit}
                expert={expert}
                onUpdate={loadBenefits}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Benefit Card Component
function BenefitCard({
  benefit,
  expert,
  onUpdate,
}: {
  benefit: BenefitWithIndication;
  expert: ExpertUser;
  onUpdate: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const canSendNF = benefit.pode_enviar_nf_a_partir_de &&
    new Date(benefit.pode_enviar_nf_a_partir_de) <= new Date() &&
    !benefit.nf_enviada;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadError('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Formato inválido. Use PDF, JPG ou PNG.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      // Upload file
      const filePath = await uploadExpertNF(expert.id, benefit.id, file);

      // Update benefit
      const { error } = await supabase
        .from('experts_benefits')
        .update({
          nf_enviada: true,
          nf_arquivo_url: filePath,
          nf_enviada_em: new Date().toISOString(),
          nf_data_emissao: new Date().toISOString().split('T')[0],
          nf_valor: benefit.valor_beneficio,
        })
        .eq('id', benefit.id);

      if (error) throw error;

      // Update indication status
      await supabase
        .from('experts_indications')
        .update({ status: 'nf_enviada' })
        .eq('id', benefit.indication_id);

      onUpdate();
    } catch (error) {
      console.error('Error uploading NF:', error);
      setUploadError('Erro ao enviar nota fiscal. Tente novamente.');
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-text-primary">
              {benefit.indication?.empresa_nome || 'Empresa'}
            </h3>
            {benefit.pagamento_realizado ? (
              <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                Pago
              </span>
            ) : benefit.nf_enviada ? (
              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                NF Enviada
              </span>
            ) : canSendNF ? (
              <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                Aguardando NF
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                Processando
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-primary-600 mb-1">
            {formatCurrency(benefit.valor_beneficio || 0)}
          </p>
          <p className="text-sm text-text-muted">
            Contrato: {formatDate(benefit.data_contrato_cliente)}
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {isExpanded ? 'Ocultar' : 'Ver detalhes'}
        </button>
      </div>

      {/* Upload NF Button */}
      {canSendNF && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3 mb-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 mb-1">
                Você já pode enviar a nota fiscal
              </p>
              <p className="text-xs text-yellow-700">
                Envie sua NF no valor de {formatCurrency(benefit.valor_beneficio || 0)} para receber o pagamento no dia {formatDate(benefit.data_prevista_pagamento_beneficio)}.
              </p>
            </div>
          </div>
          <label className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer">
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Enviar Nota Fiscal</span>
              </>
            )}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          {uploadError && (
            <p className="text-sm text-red-600 mt-2">{uploadError}</p>
          )}
        </div>
      )}

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-text-muted">Data do Contrato</p>
                <p className="text-sm text-text-primary font-medium">
                  {formatDate(benefit.data_contrato_cliente)}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-text-muted">Primeiro Pagamento Cliente</p>
                <p className="text-sm text-text-primary font-medium">
                  {formatDate(benefit.data_primeiro_pagamento_cliente)}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-text-muted">Enviar NF a partir de</p>
                <p className="text-sm text-text-primary font-medium">
                  {formatDate(benefit.pode_enviar_nf_a_partir_de)}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-text-muted">Pagamento Previsto</p>
                <p className="text-sm text-text-primary font-medium">
                  {formatDate(benefit.data_prevista_pagamento_beneficio)}
                </p>
              </div>
            </div>
          </div>

          {benefit.nf_enviada && (
            <div className="pt-3 border-t border-gray-200">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-900">
                    Nota Fiscal Enviada
                  </p>
                </div>
                <p className="text-xs text-blue-700">
                  Enviada em: {formatDate(benefit.nf_enviada_em)}
                </p>
                <p className="text-xs text-blue-700">
                  Valor: {formatCurrency(benefit.nf_valor || 0)}
                </p>
              </div>
            </div>
          )}

          {benefit.pagamento_realizado && (
            <div className="pt-3 border-t border-gray-200">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-medium text-green-900">
                    Pagamento Realizado
                  </p>
                </div>
                <p className="text-xs text-green-700">
                  Data: {formatDate(benefit.pagamento_data)}
                </p>
                <p className="text-xs text-green-700">
                  Valor: {formatCurrency(benefit.valor_beneficio || 0)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
