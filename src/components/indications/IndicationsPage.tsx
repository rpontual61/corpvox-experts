import { useEffect, useState } from 'react';
import { Plus, Search, Filter, Calendar, Building2, User, Phone, Mail, X, AlertCircle, CheckCircle2, ArrowRight, GraduationCap, CreditCard } from 'lucide-react';
import { ExpertUser, ExpertIndication } from '../../types/database.types';
import { supabase, formatDate, formatCNPJ, validateCNPJ, getIndicationStatusColor, getIndicationStatusDisplay, canCreateIndications, getClientIP } from '../../lib/supabase';
import LoadingSpinner from '../LoadingSpinner';

interface IndicationsPageProps {
  expert: ExpertUser;
  onNavigate?: (page: string) => void;
  initialMode?: 'list' | 'new';
}

type ViewMode = 'list' | 'new';

export default function IndicationsPage({ expert, onNavigate, initialMode = 'list' }: IndicationsPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  const [indications, setIndications] = useState<ExpertIndication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [canIndicate, setCanIndicate] = useState(false);

  useEffect(() => {
    loadIndications();
    checkCanIndicate();
  }, [expert.id]);

  const loadIndications = async () => {
    try {
      const { data, error } = await supabase
        .from('experts_indications')
        .select('*')
        .eq('expert_id', expert.id)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setIndications(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading indications:', error);
      setLoading(false);
    }
  };

  const checkCanIndicate = async () => {
    const can = await canCreateIndications(expert.id);
    setCanIndicate(can);
  };

  const filteredIndications = indications.filter((indication) => {
    const matchesSearch =
      indication.empresa_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      indication.empresa_cnpj.includes(searchTerm) ||
      indication.contato_nome.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || indication.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner message="Carregando indicações..." />
      </div>
    );
  }

  if (viewMode === 'new') {
    return <NewIndicationForm expert={expert} onBack={() => { setViewMode('list'); loadIndications(); }} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            Minhas Indicações
          </h2>
          <p className="text-text-secondary mt-1">
            Gerencie suas indicações e acompanhe o status
          </p>
        </div>
        <button
          onClick={() => setViewMode('new')}
          disabled={!canIndicate}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Indicação</span>
        </button>
      </div>

      {/* Setup Tasks - only shown if user needs to complete setup */}
      {!canIndicate && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-orange-900 mb-2">
                Faltam poucos passos para você começar a indicar
              </h3>
              <p className="text-sm text-orange-800 mb-4">
                Você precisa completar algumas etapas antes de poder fazer indicações:
              </p>
              <div className="space-y-2">
                {/* Task: Complete Course */}
                <button
                  onClick={() => onNavigate?.('curso')}
                  disabled={expert.curso_concluido}
                  className="w-full flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors disabled:cursor-default disabled:hover:bg-white"
                >
                  <div className="flex items-center space-x-3">
                    {expert.curso_concluido ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <GraduationCap className="w-5 h-5 text-orange-600" />
                    )}
                    <span className={`text-sm font-medium ${expert.curso_concluido ? 'text-green-900 line-through' : 'text-orange-900'}`}>
                      Leitura do Guia Essencial Expert (10 min)
                    </span>
                  </div>
                  {!expert.curso_concluido && (
                    <ArrowRight className="w-4 h-4 text-orange-600" />
                  )}
                </button>

                {/* Task: Register PIX */}
                <button
                  onClick={() => onNavigate?.('meus-dados')}
                  disabled={!!expert.chave_pix_empresa}
                  className="w-full flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors disabled:cursor-default disabled:hover:bg-white"
                >
                  <div className="flex items-center space-x-3">
                    {expert.chave_pix_empresa ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <CreditCard className="w-5 h-5 text-orange-600" />
                    )}
                    <span className={`text-sm font-medium ${expert.chave_pix_empresa ? 'text-green-900 line-through' : 'text-orange-900'}`}>
                      Cadastrar chave PIX
                    </span>
                  </div>
                  {!expert.chave_pix_empresa && (
                    <ArrowRight className="w-4 h-4 text-orange-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por empresa, CNPJ ou contato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
            >
              <option value="all">Todos os status</option>
              <option value="aguardando_validacao">Aguardando Validação</option>
              <option value="em_contato">CorpVox em contato</option>
              <option value="contratou">Contratou!</option>
              <option value="liberado_envio_nf">Liberado Envio NF</option>
              <option value="nf_enviada">NF Enviada</option>
              <option value="pago">Pago</option>
              <option value="validacao_recusada">Validação Recusada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Indications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredIndications.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-text-muted mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Nenhuma indicação encontrada'
                : 'Você ainda não fez nenhuma indicação.'}
            </p>
            {canIndicate && !searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setViewMode('new')}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
              >
                Fazer primeira indicação
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredIndications.map((indication) => (
              <IndicationCard key={indication.id} indication={indication} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Indication Card Component
function IndicationCard({ indication }: { indication: ExpertIndication }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-text-primary">
              {indication.empresa_nome}
            </h3>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getIndicationStatusColor(indication.status)}`}>
              {getIndicationStatusDisplay(indication.status)}
            </span>
          </div>
          <p className="text-sm text-text-muted">
            CNPJ: {formatCNPJ(indication.empresa_cnpj)}
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {isExpanded ? 'Ocultar' : 'Ver detalhes'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-text-muted">Contato</p>
                <p className="text-sm text-text-primary font-medium">
                  {indication.contato_nome}
                </p>
              </div>
            </div>

            {indication.contato_whatsapp && (
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-text-muted">WhatsApp</p>
                  <p className="text-sm text-text-primary font-medium">
                    {indication.contato_whatsapp}
                  </p>
                </div>
              </div>
            )}

            {indication.contato_email && (
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-text-muted">E-mail</p>
                  <p className="text-sm text-text-primary font-medium">
                    {indication.contato_email}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-text-muted">Data da Indicação</p>
                <p className="text-sm text-text-primary font-medium">
                  {formatDate(indication.criado_em)}
                </p>
              </div>
            </div>
          </div>

          {indication.observacoes && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-text-muted mb-1">Observações</p>
              <p className="text-sm text-text-primary">
                {indication.observacoes}
              </p>
            </div>
          )}

          {indication.status === 'validacao_recusada' && indication.motivo_recusa && (
            <div className="pt-3 border-t border-gray-200">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-800 font-medium mb-1">
                  Motivo da Recusa
                </p>
                <p className="text-sm text-red-700">
                  {indication.motivo_recusa}
                </p>
              </div>
            </div>
          )}

          {indication.expirou && (
            <div className="pt-3 border-t border-gray-200">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-700">
                  Esta indicação expirou após 90 dias sem contratação.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// New Indication Form Component
function NewIndicationForm({ expert, onBack }: { expert: ExpertUser; onBack: () => void }) {
  const [formData, setFormData] = useState({
    empresa_nome: '',
    empresa_cnpj: '',
    quantidade_funcionarios: '',
    contato_nome: '',
    contato_email: '',
    contato_whatsapp: '',
    tipo_indicacao: 'relatorio_tecnico' as 'relatorio_tecnico' | 'email' | 'whatsapp_conversa',
    observacoes: '',
  });
  const [declaracaoAceita, setDeclaracaoAceita] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    // Validate
    const newErrors: Record<string, string> = {};

    if (!formData.empresa_nome.trim()) {
      newErrors.empresa_nome = 'Nome da empresa é obrigatório';
    }

    if (!formData.empresa_cnpj.trim()) {
      newErrors.empresa_cnpj = 'CNPJ é obrigatório';
    } else if (!validateCNPJ(formData.empresa_cnpj)) {
      newErrors.empresa_cnpj = 'CNPJ inválido';
    }

    if (!formData.quantidade_funcionarios.trim()) {
      newErrors.quantidade_funcionarios = 'Quantidade de funcionários é obrigatória';
    } else if (parseInt(formData.quantidade_funcionarios) < 1) {
      newErrors.quantidade_funcionarios = 'Quantidade deve ser maior que zero';
    }

    if (!formData.contato_nome.trim()) {
      newErrors.contato_nome = 'Nome do contato é obrigatório';
    }

    if (!formData.contato_email && !formData.contato_whatsapp) {
      newErrors.contato = 'Informe pelo menos e-mail ou WhatsApp';
    }

    if (!declaracaoAceita) {
      newErrors.declaracao = 'Você precisa aceitar a declaração para continuar';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      // Check if CNPJ already indicated
      const { data: existing } = await supabase
        .from('experts_indications')
        .select('id')
        .eq('empresa_cnpj', formData.empresa_cnpj.replace(/\D/g, ''))
        .single();

      if (existing) {
        setErrors({ empresa_cnpj: 'Esta empresa já foi indicada' });
        setLoading(false);
        return;
      }

      // Create indication
      const { error } = await supabase
        .from('experts_indications')
        .insert({
          expert_id: expert.id,
          empresa_nome: formData.empresa_nome,
          empresa_cnpj: formData.empresa_cnpj.replace(/\D/g, ''),
          quantidade_funcionarios: parseInt(formData.quantidade_funcionarios),
          contato_nome: formData.contato_nome,
          contato_email: formData.contato_email || null,
          contato_whatsapp: formData.contato_whatsapp || null,
          tipo_indicacao: formData.tipo_indicacao,
          observacoes: formData.observacoes || null,
          status: 'aguardando_validacao',
        });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => onBack(), 2000);
    } catch (error) {
      console.error('Error creating indication:', error);
      setErrors({ submit: 'Erro ao criar indicação. Tente novamente.' });
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plus className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">
          Indicação criada com sucesso!
        </h3>
        <p className="text-text-secondary">
          Aguarde a validação da equipe CorpVox.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium mb-4"
        >
          ← Voltar
        </button>
        <h2 className="text-2xl font-bold text-text-primary">
          Nova Indicação
        </h2>
        <p className="text-text-secondary mt-1">
          Preencha os dados da empresa que você deseja indicar
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Empresa Section */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Dados da Empresa
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Nome da Empresa *
              </label>
              <input
                type="text"
                value={formData.empresa_nome}
                onChange={(e) => setFormData({ ...formData, empresa_nome: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Empresa XYZ Ltda"
              />
              {errors.empresa_nome && (
                <p className="text-sm text-red-600 mt-1">{errors.empresa_nome}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                CNPJ *
              </label>
              <input
                type="text"
                value={formData.empresa_cnpj}
                onChange={(e) => setFormData({ ...formData, empresa_cnpj: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
              {errors.empresa_cnpj && (
                <p className="text-sm text-red-600 mt-1">{errors.empresa_cnpj}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Quantidade de Funcionários *
              </label>
              <input
                type="number"
                value={formData.quantidade_funcionarios}
                onChange={(e) => setFormData({ ...formData, quantidade_funcionarios: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="50"
                min="1"
              />
              {errors.quantidade_funcionarios && (
                <p className="text-sm text-red-600 mt-1">{errors.quantidade_funcionarios}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contato Section */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Dados do Contato
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Nome do Contato *
              </label>
              <input
                type="text"
                value={formData.contato_nome}
                onChange={(e) => setFormData({ ...formData, contato_nome: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="João Silva"
              />
              {errors.contato_nome && (
                <p className="text-sm text-red-600 mt-1">{errors.contato_nome}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={formData.contato_email}
                  onChange={(e) => setFormData({ ...formData, contato_email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="joao@empresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.contato_whatsapp}
                  onChange={(e) => setFormData({ ...formData, contato_whatsapp: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            {errors.contato && (
              <p className="text-sm text-red-600">{errors.contato}</p>
            )}
          </div>
        </div>

        {/* Tipo e Observações */}
        <div className="pt-6 border-t border-gray-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Como você indicou esta empresa?
              </label>
              <select
                value={formData.tipo_indicacao}
                onChange={(e) => setFormData({ ...formData, tipo_indicacao: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="relatorio_tecnico">Relatório Técnico</option>
                <option value="email">E-mail</option>
                <option value="whatsapp_conversa">Conversa no WhatsApp</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Observações (opcional)
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Adicione informações relevantes sobre a indicação..."
              />
            </div>
          </div>
        </div>

        {/* Declaração */}
        <div className="pt-6 border-t border-gray-200">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={declaracaoAceita}
                onChange={(e) => setDeclaracaoAceita(e.target.checked)}
                className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                Declaro que realizei a indicação desta empresa e que ela está sob minha responsabilidade técnica.
                Estou ciente de que, em caso de falsidade nas informações prestadas, posso ser excluído do programa
                e não receberei o benefício correspondente a esta indicação.
              </span>
            </label>
            {errors.declaracao && (
              <p className="text-sm text-red-600 mt-2">{errors.declaracao}</p>
            )}
          </div>
        </div>

        {/* Submit */}
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 text-text-primary rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !declaracaoAceita}
            className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Criando...' : 'Criar Indicação'}
          </button>
        </div>
      </form>
    </div>
  );
}
