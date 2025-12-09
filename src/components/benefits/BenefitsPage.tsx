import { useEffect, useState } from 'react';
import { DollarSign, Upload, CheckCircle2, Clock, FileText, Calendar, AlertCircle } from 'lucide-react';
import { ExpertUser, ExpertBenefit, ExpertIndication } from '../../types/database.types';
import { supabase, formatCurrency, formatDate, uploadExpertNF } from '../../lib/supabase';
import LoadingSpinner from '../LoadingSpinner';

interface BenefitsPageProps {
  expert: ExpertUser;
}

interface BenefitWithIndication extends ExpertBenefit {
  indication?: ExpertIndication;
}

export default function BenefitsPage({ expert }: BenefitsPageProps) {
  const [benefits, setBenefits] = useState<BenefitWithIndication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    pago: 0,
    aguardando_pagamento_cliente: 0,
    liberado_para_nf: 0,
    nf_enviada: 0,
    pago_count: 0,
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
      const pago = benefitsData.filter(b => b.status === 'pago').reduce((sum, b) => sum + (b.valor_beneficio || 0), 0);
      const aguardando_pagamento_cliente = benefitsData.filter(b => b.status === 'aguardando_pagamento_cliente').reduce((sum, b) => sum + (b.valor_beneficio || 0), 0);
      const liberado_para_nf = benefitsData.filter(b => b.status === 'liberado_para_nf').reduce((sum, b) => sum + (b.valor_beneficio || 0), 0);
      const nf_enviada = benefitsData.filter(b => b.status === 'nf_enviada').reduce((sum, b) => sum + (b.valor_beneficio || 0), 0);
      const pago_count = benefitsData.filter(b => b.status === 'pago').length;

      setStats({ total, pago, aguardando_pagamento_cliente, liberado_para_nf, nf_enviada, pago_count });
      setLoading(false);
    } catch (error) {
      console.error('Error loading benefits:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner message="Carregando benefícios..." />
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

      {/* Stats Cards - Row 1: Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
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
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-text-primary">
              Benefícios já pagos
            </p>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.pago)}
          </p>
        </div>
      </div>

      {/* Stats Cards - Row 2: Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs font-medium text-text-primary mb-3">
            Aguardando pagamento cliente
          </p>
          <p className="text-xl font-bold text-text-primary">
            {formatCurrency(stats.aguardando_pagamento_cliente)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs font-medium text-text-primary mb-3">
            Aguardando emissão da sua nota fiscal
          </p>
          <p className="text-xl font-bold text-text-primary">
            {formatCurrency(stats.liberado_para_nf)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs font-medium text-text-primary mb-3">
            Processando pagamento
          </p>
          <p className="text-xl font-bold text-text-primary">
            {formatCurrency(stats.nf_enviada)}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">
          Lista de Benefícios
        </h3>
        <div className="flex items-center space-x-3">
          <label htmlFor="status-filter" className="text-sm text-text-muted">
            Filtrar por status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Todos</option>
            <option value="aguardando_pagamento_cliente">Aguardando pagamento cliente</option>
            <option value="liberado_para_nf">Aguardando emissão da sua nota fiscal</option>
            <option value="nf_enviada">Processando pagamento</option>
            <option value="pago">Pago</option>
          </select>
        </div>
      </div>

      {/* Benefits List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {benefits.filter(b => statusFilter === 'all' || b.status === statusFilter).length === 0 ? (
          <div className="px-6 py-12 text-center">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-text-muted">
              {statusFilter === 'all'
                ? 'Você ainda não possui benefícios registrados'
                : 'Nenhum benefício encontrado com esse status'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {benefits
              .filter(b => statusFilter === 'all' || b.status === statusFilter)
              .map((benefit) => (
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

  const canSendNF = benefit.status === 'liberado_para_nf' && !benefit.nf_enviada;

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
          status: 'nf_enviada',
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
      <div className="mb-3">
        <div className="flex items-center space-x-3 mb-2">
          <h3 className="text-lg font-semibold text-text-primary">
            {benefit.indication?.empresa_nome || 'Empresa'}
          </h3>
          {benefit.status === 'pago' ? (
            <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              Pago
            </span>
          ) : benefit.status === 'nf_enviada' ? (
            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              Processando pagamento
            </span>
          ) : benefit.status === 'liberado_para_nf' ? (
            <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              Emita sua nota fiscal
            </span>
          ) : benefit.status === 'aguardando_pagamento_cliente' ? (
            <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
              Aguardando pagamento cliente
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
              Processando
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-primary-600 mb-2">
          {formatCurrency(benefit.valor_beneficio || 0)}
        </p>
        {benefit.status === 'aguardando_pagamento_cliente' ? (
          <div className="space-y-1">
            <p className="text-sm text-text-muted">
              Aguardando primeiro pagamento do cliente.
            </p>
            <p className="text-sm text-text-muted">
              Previsão para liberação da emissão da sua nota fiscal: {formatDate(benefit.pode_enviar_nf_a_partir_de)}
            </p>
          </div>
        ) : benefit.status === 'liberado_para_nf' ? (
          <p className="text-sm text-text-muted">
            Você já pode emitir e enviar sua nota fiscal!
          </p>
        ) : benefit.status === 'nf_enviada' ? (
          <p className="text-sm text-text-muted">
            Nota fiscal enviada. Pagamento previsto: {formatDate(benefit.data_prevista_pagamento_beneficio)}
          </p>
        ) : benefit.status === 'pago' ? (
          <p className="text-sm text-text-muted">
            Benefício pago em: {formatDate(benefit.data_contrato_cliente)}
          </p>
        ) : (
          <p className="text-sm text-text-muted">
            Contrato: {formatDate(benefit.data_contrato_cliente)}
          </p>
        )}
      </div>

      {/* Upload NF Section */}
      {canSendNF && (
        <div className="mt-4 p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-amber-900">
                Você já pode enviar a nota fiscal
              </p>
              <p className="text-sm text-amber-700">
                Envie sua NF no valor de {formatCurrency(benefit.valor_beneficio || 0)} para receber o pagamento no dia {formatDate(benefit.data_prevista_pagamento_beneficio)}.
              </p>
            </div>
          </div>
          <label className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer shadow-md">
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="font-medium">Enviando...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span className="font-medium">Enviar Nota Fiscal</span>
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
                <p className="text-xs text-text-muted">Previsão de liberação para envio de NF a partir de</p>
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

      {/* Ver detalhes button at bottom */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full mt-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium border-t border-gray-200 pt-4"
      >
        {isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
      </button>
    </div>
  );
}
