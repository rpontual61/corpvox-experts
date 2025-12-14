import { useEffect, useState } from 'react';
import { DollarSign, Upload, CheckCircle2, Clock, FileText, Calendar, AlertCircle, ArrowRight, Search } from 'lucide-react';
import { ExpertUser, ExpertBenefit, ExpertIndication } from '../../types/database.types';
import { supabase, formatCurrency, formatDate, uploadExpertNF } from '../../lib/supabase';
import LoadingSpinner from '../LoadingSpinner';

interface BenefitsPageProps {
  expert: ExpertUser;
  onUpdate?: () => void;
}

interface BenefitWithIndication extends ExpertBenefit {
  indication?: ExpertIndication;
}

export default function BenefitsPage({ expert, onUpdate }: BenefitsPageProps) {
  const [benefits, setBenefits] = useState<BenefitWithIndication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pago: 0,
    aguardando_pagamento_cliente: 0,
    liberado_para_nf: 0,
    aguardando_conferencia: 0,
    nf_recusada: 0,
    processando_pagamento: 0,
    agendado: 0,
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
      const aguardando_conferencia = benefitsData.filter(b => b.status === 'aguardando_conferencia').reduce((sum, b) => sum + (b.valor_beneficio || 0), 0);
      const nf_recusada = benefitsData.filter(b => b.status === 'nf_recusada').reduce((sum, b) => sum + (b.valor_beneficio || 0), 0);
      const processando_pagamento = benefitsData.filter(b => b.status === 'processando_pagamento').reduce((sum, b) => sum + (b.valor_beneficio || 0), 0);
      const agendado = benefitsData.filter(b => b.status === 'agendado').reduce((sum, b) => sum + (b.valor_beneficio || 0), 0);
      const nf_enviada = benefitsData.filter(b => b.status === 'nf_enviada').reduce((sum, b) => sum + (b.valor_beneficio || 0), 0);
      const pago_count = benefitsData.filter(b => b.status === 'pago').length;

      setStats({ total, pago, aguardando_pagamento_cliente, liberado_para_nf, aguardando_conferencia, nf_recusada, processando_pagamento, agendado, nf_enviada, pago_count });
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
        <button
          onClick={() => setStatusFilter('all')}
          className={`bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-sm p-6 text-white text-left transition-all hover:shadow-lg ${
            statusFilter === 'all' ? 'ring-4 ring-primary-300' : ''
          }`}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium opacity-90">
              Benefícios gerados
            </p>
          </div>
          <p className="text-3xl font-bold">
            {formatCurrency(stats.total)}
          </p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'pago' ? 'all' : 'pago')}
          className={`bg-white rounded-xl shadow-sm border p-6 text-left transition-all hover:shadow-md ${
            statusFilter === 'pago' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200'
          }`}
        >
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
        </button>
      </div>

      {/* Stats Cards - Row 2: Status */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <button
          onClick={() => setStatusFilter(statusFilter === 'aguardando_pagamento_cliente' ? 'all' : 'aguardando_pagamento_cliente')}
          className={`bg-white rounded-xl shadow-sm border p-4 text-left transition-all hover:shadow-md ${
            statusFilter === 'aguardando_pagamento_cliente' ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200'
          }`}
        >
          <p className="text-xs font-medium text-text-primary mb-2">
            Aguardando pagamento cliente
          </p>
          <p className="text-lg font-bold text-text-primary">
            {formatCurrency(stats.aguardando_pagamento_cliente)}
          </p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'liberado_para_nf' ? 'all' : 'liberado_para_nf')}
          className={`bg-white rounded-xl shadow-sm border p-4 text-left transition-all hover:shadow-md ${
            statusFilter === 'liberado_para_nf' ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200'
          }`}
        >
          <p className="text-xs font-medium text-text-primary mb-2">
            Liberada emissão de Nota Fiscal
          </p>
          <p className="text-lg font-bold text-text-primary">
            {formatCurrency(stats.liberado_para_nf)}
          </p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'aguardando_conferencia' ? 'all' : 'aguardando_conferencia')}
          className={`bg-white rounded-xl shadow-sm border p-4 text-left transition-all hover:shadow-md ${
            statusFilter === 'aguardando_conferencia' ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200'
          }`}
        >
          <p className="text-xs font-medium text-text-primary mb-2">
            Notas em conferência
          </p>
          <p className="text-lg font-bold text-text-primary">
            {formatCurrency(stats.aguardando_conferencia)}
          </p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'nf_recusada' ? 'all' : 'nf_recusada')}
          className={`bg-white rounded-xl shadow-sm border p-4 text-left transition-all hover:shadow-md ${
            statusFilter === 'nf_recusada' ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200'
          }`}
        >
          <p className="text-xs font-medium text-text-primary mb-2">
            Notas recusadas
          </p>
          <p className="text-lg font-bold text-text-primary">
            {formatCurrency(stats.nf_recusada)}
          </p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'processando_pagamento' ? 'all' : 'processando_pagamento')}
          className={`bg-white rounded-xl shadow-sm border p-4 text-left transition-all hover:shadow-md ${
            statusFilter === 'processando_pagamento' ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200'
          }`}
        >
          <p className="text-xs font-medium text-text-primary mb-2">
            Processando pagamento
          </p>
          <p className="text-lg font-bold text-text-primary">
            {formatCurrency(stats.processando_pagamento)}
          </p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'agendado' ? 'all' : 'agendado')}
          className={`bg-white rounded-xl shadow-sm border p-4 text-left transition-all hover:shadow-md ${
            statusFilter === 'agendado' ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200'
          }`}
        >
          <p className="text-xs font-medium text-text-primary mb-2">
            Pagamentos agendados
          </p>
          <p className="text-lg font-bold text-text-primary">
            {formatCurrency(stats.agendado)}
          </p>
        </button>
      </div>

      {/* Divider */}
      <div className="py-8">
        <div className="border-t border-gray-200"></div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-text-primary">
          Lista de Benefícios
        </h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {/* Status Filter */}
          <div className="flex items-center space-x-3">
            <label htmlFor="benefit-status-filter" className="text-sm text-text-muted whitespace-nowrap">
              Filtrar por status:
            </label>
            <select
              id="benefit-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Todos</option>
              <option value="aguardando_pagamento_cliente">Aguardando pagamento cliente</option>
              <option value="liberado_para_nf">Liberada emissão de Nota Fiscal</option>
              <option value="aguardando_conferencia">Conferindo Nota Fiscal</option>
              <option value="nf_recusada">Notas recusadas</option>
              <option value="processando_pagamento">Processando pagamento</option>
              <option value="agendado">Pagamento Agendado</option>
              <option value="pago">Pago</option>
            </select>
          </div>
        </div>
      </div>

      {/* Benefits Grid */}
      {benefits.filter(b => {
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
        const matchesSearch = searchTerm === '' ||
          (b.indication?.empresa_nome && b.indication.empresa_nome.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesStatus && matchesSearch;
      }).length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-12 text-center">
          <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-text-muted">
            {searchTerm || statusFilter !== 'all'
              ? 'Nenhum benefício encontrado'
              : 'Você ainda não possui benefícios registrados'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits
            .filter(b => {
              const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
              const matchesSearch = searchTerm === '' ||
                (b.indication?.empresa_nome && b.indication.empresa_nome.toLowerCase().includes(searchTerm.toLowerCase()));
              return matchesStatus && matchesSearch;
            })
            .map((benefit) => (
              <BenefitCard
                key={benefit.id}
                benefit={benefit}
                expert={expert}
                onUpdate={() => { loadBenefits(); onUpdate?.(); }}
              />
            ))}
        </div>
      )}
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
  const [showNFModal, setShowNFModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const canSendNF = benefit.status === 'liberado_para_nf' && !benefit.nf_enviada;
  const nfRejected = benefit.status === 'nf_recusada';

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadError('Arquivo muito grande. Máximo 10MB.');
      setSelectedFile(null);
      return;
    }

    const allowedTypes = ['application/pdf', 'text/xml', 'application/xml'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Formato inválido. Use PDF ou XML.');
      setSelectedFile(null);
      return;
    }

    setUploadError('');
    setSelectedFile(file);
  };

  const handleUploadSubmit = async (isReplacement: boolean = false) => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError('');

    try {
      // Upload via Edge Function (já atualiza o banco de dados também)
      await uploadExpertNF(
        expert.id,
        benefit.id,
        benefit.indication_id,
        benefit.valor_beneficio,
        selectedFile,
        isReplacement
      );

      // Fechar modais e mostrar sucesso
      setShowNFModal(false);
      setShowReplaceModal(false);
      setUploading(false);
      setSelectedFile(null);
      onUpdate();
    } catch (error) {
      console.error('Error uploading NF:', error);
      setUploadError('Erro ao enviar nota fiscal. Tente novamente.');
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-text-primary mb-2 truncate">
            {benefit.indication?.empresa_nome || 'Empresa'}
          </h3>
          {benefit.status === 'pago' ? (
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
              Pago
            </span>
          ) : benefit.status === 'agendado' ? (
            <span className="px-2.5 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
              Pagamento Agendado
            </span>
          ) : benefit.status === 'processando_pagamento' ? (
            <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
              Processando pagamento
            </span>
          ) : benefit.status === 'aguardando_conferencia' ? (
            <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
              Conferindo Nota Fiscal
            </span>
          ) : benefit.status === 'nf_recusada' ? (
            <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
              NF Recusada
            </span>
          ) : benefit.status === 'liberado_para_nf' ? (
            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              Emita sua nota fiscal
            </span>
          ) : benefit.status === 'aguardando_pagamento_cliente' ? (
            <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
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
        ) : benefit.status === 'aguardando_conferencia' ? (
          <p className="text-sm text-text-muted">
            Nota enviada em {formatDate(benefit.nf_enviada_em)}. Estamos conferindo os dados.
          </p>
        ) : benefit.status === 'nf_recusada' ? (
          <p className="text-sm text-text-muted">
            Nota fiscal recusada. Faça o reenvio.
          </p>
        ) : benefit.status === 'processando_pagamento' ? (
          <p className="text-sm text-text-muted">
            Nota fiscal aprovada. Previsão de pagamento em {formatDate(benefit.data_prevista_pagamento_beneficio)}
          </p>
        ) : benefit.status === 'agendado' ? (
          <p className="text-sm text-text-muted">
            Pagamento agendado para {formatDate(benefit.data_prevista_pagamento_beneficio)}
          </p>
        ) : benefit.status === 'pago' ? (
          <p className="text-sm text-text-muted">
            Pago em {formatDate(benefit.pagamento_data)}
          </p>
        ) : (
          <p className="text-sm text-text-muted">
            Contrato: {formatDate(benefit.data_contrato_cliente)}
          </p>
        )}
        {/* Alerta de NF Recusada */}
        {nfRejected && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 mb-1">
                  Nota Fiscal Recusada
                </p>
                <p className="text-xs text-red-700 mb-2">
                  <strong>Motivo:</strong> {benefit.nf_recusa_justificativa || 'Não informado'}
                </p>
                <p className="text-xs text-red-600">
                  Por favor, corrija o problema e envie uma nova nota fiscal.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNFModal(true)}
              className="w-full mt-3 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
            >
              Enviar Nova Nota Fiscal
            </button>
          </div>
        )}

        {/* Enviar NF Button */}
        {canSendNF && (
          <button
            onClick={() => setShowNFModal(true)}
            className="w-full mt-4 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center justify-center space-x-2"
          >
            <span>🎉</span>
            <span>Enviar Nota Fiscal</span>
          </button>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            <div className="space-y-3">
              {/* Data do Contrato - SEMPRE */}
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-text-muted">Data do Contrato</p>
                  <p className="text-sm text-text-primary font-medium">
                    {formatDate(benefit.data_contrato_cliente)}
                  </p>
                </div>
              </div>

              {/* Cliente Pagou em - Mostrar quando já pagou */}
              {benefit.cliente_pagou_em && (
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-text-muted">Cliente Pagou em</p>
                    <p className="text-sm text-green-700 font-medium">
                      {formatDate(benefit.cliente_pagou_em)}
                    </p>
                  </div>
                </div>
              )}

              {/* Previsão de liberação para envio de NF - Apenas se NF ainda não foi enviada/aprovada */}
              {['liberado_para_nf', 'nf_recusada'].includes(benefit.status) && (
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-text-muted">Você pode enviar NF a partir de</p>
                    <p className="text-sm text-text-primary font-medium">
                      {formatDate(benefit.pode_enviar_nf_a_partir_de)}
                    </p>
                  </div>
                </div>
              )}

              {/* Pagamento Previsto - Apenas se ainda não foi pago ou agendado */}
              {['aguardando_pagamento_cliente', 'liberado_para_nf', 'aguardando_conferencia', 'nf_recusada', 'processando_pagamento'].includes(benefit.status) && (
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-text-muted">Previsão de Pagamento</p>
                    <p className="text-sm text-text-primary font-medium">
                      {formatDate(benefit.data_prevista_pagamento_beneficio)}
                    </p>
                  </div>
                </div>
              )}

              {/* Pagamento Agendado - Quando status = agendado */}
              {benefit.status === 'agendado' && (
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-text-muted">Pagamento Agendado Para</p>
                    <p className="text-sm text-orange-700 font-medium">
                      {formatDate(benefit.data_prevista_pagamento_beneficio)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {benefit.nf_enviada && (
              <div className="pt-3 border-t border-gray-200">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-900">
                        Nota Fiscal Enviada
                      </p>
                    </div>
                    {/* Botão Substituir NF - só aparece se NF ainda não foi aprovada */}
                    {['aguardando_conferencia', 'nf_recusada'].includes(benefit.status) && (
                      <button
                        onClick={() => setShowReplaceModal(true)}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer transition-colors"
                      >
                        Substituir Nota
                      </button>
                    )}
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

      {/* NF Upload Modal */}
      {showNFModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-semibold text-text-primary">
                Enviar Nota Fiscal
              </h3>
              <button
                onClick={() => setShowNFModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 space-y-6">
              {/* Valor e Data Limite */}
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <h4 className="font-semibold text-primary-900 mb-3">Informações do Benefício</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-primary-700">Valor da Nota Fiscal:</span>
                    <span className="text-base font-semibold text-primary-900">
                      {formatCurrency(benefit.valor_beneficio || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-primary-700">Data Limite para Emissão:</span>
                    <span className="text-base font-semibold text-primary-900">
                      {(() => {
                        // Extract year and month from the string to avoid timezone issues
                        const dateStr = benefit.pode_enviar_nf_a_partir_de;
                        const [year, month] = dateStr.split('-');
                        return formatDate(`${year}-${month}-10`);
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Descrição do Serviço */}
              <div>
                <h4 className="font-semibold text-text-primary mb-2">Descrição do Serviço</h4>
                <p className="text-sm text-white bg-gray-800 rounded-lg p-3">
                  Benefício técnico referente ao Programa Experts CorpVox, conforme regras internas do programa. Indicação técnica da empresa <strong>{benefit.indication?.empresa_nome || 'N/A'}.</strong>
                </p>
              </div>

              {/* Dados da CorpVox */}
              <div>
                <h4 className="font-semibold text-text-primary mb-3">Dados da CorpVox para Emissão da NF</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <span className="font-medium text-text-primary">Razão Social:</span>
                      <span className="ml-2 text-text-secondary">CORPVOX TECNOLOGIA DA INFORMAÇÃO LTDA</span>
                    </div>
                    <div>
                      <span className="font-medium text-text-primary">CNPJ:</span>
                      <span className="ml-2 text-text-secondary">62.970.282/0001-07</span>
                    </div>
                    <div>
                      <span className="font-medium text-text-primary">Inscrição Municipal:</span>
                      <span className="ml-2 text-text-secondary">109550</span>
                    </div>
                    <div>
                      <span className="font-medium text-text-primary">Endereço:</span>
                      <span className="ml-2 text-text-secondary">Av. Paulista, 1636, Conjunto 4, Pavimento 15</span>
                    </div>
                    <div>
                      <span className="font-medium text-text-primary">Bairro:</span>
                      <span className="ml-2 text-text-secondary">Bela Vista</span>
                    </div>
                    <div>
                      <span className="font-medium text-text-primary">Cidade:</span>
                      <span className="ml-2 text-text-secondary">São Paulo – SP</span>
                    </div>
                    <div>
                      <span className="font-medium text-text-primary">CEP:</span>
                      <span className="ml-2 text-text-secondary">01310-200</span>
                    </div>
                    <div>
                      <span className="font-medium text-text-primary">Telefone:</span>
                      <span className="ml-2 text-text-secondary">(61) 992578817</span>
                    </div>
                    <div>
                      <span className="font-medium text-text-primary">E-mail:</span>
                      <span className="ml-2 text-text-secondary">contato@corpvox.com.br</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alert sobre Informações Exatas */}
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h5 className="font-semibold text-amber-900 mb-1">Atenção - Informações Obrigatórias</h5>
                    <p className="text-sm text-amber-800">
                      A Nota Fiscal somente será considerada válida se emitida EXATAMENTE com as informações acima: descrição do serviço e todos os dados da CorpVox.
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Section */}
              <div>
                <h4 className="font-semibold text-text-primary mb-3">Enviar Nota Fiscal</h4>

                {!selectedFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                    <input
                      type="file"
                      id={`nf-upload-${benefit.id}`}
                      accept=".pdf,.xml"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="hidden"
                    />
                    <label
                      htmlFor={`nf-upload-${benefit.id}`}
                      className="cursor-pointer inline-flex flex-col items-center"
                    >
                      <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm font-medium text-text-primary">
                        Clique para selecionar o arquivo
                      </span>
                      <span className="text-xs text-text-muted mt-1">
                        PDF ou XML (máx. 10MB)
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="border-2 border-primary-300 bg-primary-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <svg className="w-10 h-10 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-text-muted mt-1">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        disabled={uploading}
                        className="ml-3 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Remover arquivo"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <p className="mt-2 text-sm text-red-600">{uploadError}</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3 rounded-b-xl">
              <button
                onClick={() => {
                  setShowNFModal(false);
                  setSelectedFile(null);
                  setUploadError('');
                }}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              {selectedFile && (
                <button
                  onClick={() => handleUploadSubmit(false)}
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </span>
                  ) : (
                    'Enviar'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Substituição de NF */}
      {showReplaceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-semibold text-text-primary">
                Substituir Nota Fiscal
              </h3>
              <button
                onClick={() => {
                  setShowReplaceModal(false);
                  setUploadError('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 space-y-4">
              {/* Aviso */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> O arquivo atual será substituído pelo novo. Esta ação não pode ser desfeita.
                </p>
              </div>

              {/* Info do arquivo atual */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 mb-1">
                  <strong>Arquivo atual enviado em:</strong> {formatDate(benefit.nf_enviada_em)}
                </p>
                <p className="text-xs text-blue-700">
                  <strong>Valor:</strong> {formatCurrency(benefit.nf_valor || 0)}
                </p>
              </div>

              {/* Upload Section */}
              <div>
                <h4 className="font-semibold text-text-primary mb-3">Selecionar Novo Arquivo</h4>

                {!selectedFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                    <input
                      type="file"
                      id={`nf-replace-upload-${benefit.id}`}
                      accept=".pdf,.xml"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="hidden"
                    />
                    <label
                      htmlFor={`nf-replace-upload-${benefit.id}`}
                      className="cursor-pointer inline-flex flex-col items-center"
                    >
                      <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm font-medium text-text-primary">
                        Clique para selecionar o arquivo
                      </span>
                      <span className="text-xs text-text-muted mt-1">
                        PDF ou XML (máx. 10MB)
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="border-2 border-primary-300 bg-primary-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <svg className="w-10 h-10 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-text-muted mt-1">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        disabled={uploading}
                        className="ml-3 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Remover arquivo"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <p className="mt-2 text-sm text-red-600">{uploadError}</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3 rounded-b-xl">
              <button
                onClick={() => {
                  setShowReplaceModal(false);
                  setSelectedFile(null);
                  setUploadError('');
                }}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              {selectedFile && (
                <button
                  onClick={() => handleUploadSubmit(true)}
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </span>
                  ) : (
                    'Substituir'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
