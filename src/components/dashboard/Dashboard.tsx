import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  TrendingUp,
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  GraduationCap,
  CreditCard,
  FileCheck,
  BookOpen,
  ClipboardCheck,
  UserPlus,
  Headphones,
  Gift,
  Plus,
  Minus,
  LayoutGrid,
  List,
  Calendar,
  Upload
} from 'lucide-react';
import { ExpertUser, ExpertBenefit, ExpertIndication } from '../../types/database.types';
import { supabase, formatCurrency, getIndicationStatusColor, getIndicationStatusDisplay, getIndicationTypeDisplay, uploadExpertNF } from '../../lib/supabase';
import { PolicyModal } from '../modals/PolicyModal';
import { IndicationDetailModal } from '../modals/IndicationDetailModal';
import LoadingSpinner from '../LoadingSpinner';

interface DashboardProps {
  expert: ExpertUser;
  onNavigate: (page: string) => void;
}

interface Stats {
  totalIndicacoes: number;
  aguardandoValidacao: number;
  emProcesso: number;
  contratadas: number;
  totalBeneficios: number;
  beneficiosPagos: number;
  proximoPagamento: number;
  aguardandoNF: number;
}

interface RecentIndication {
  id: string;
  empresa_nome: string;
  status: string;
  criado_em: string;
}

interface BenefitWithIndication extends ExpertBenefit {
  indication?: {
    empresa_nome: string;
  };
}

export default function Dashboard({ expert, onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalIndicacoes: 0,
    aguardandoValidacao: 0,
    emProcesso: 0,
    contratadas: 0,
    totalBeneficios: 0,
    beneficiosPagos: 0,
    proximoPagamento: 0,
    aguardandoNF: 0,
  });
  const [recentIndications, setRecentIndications] = useState<RecentIndication[]>([]);
  const [recentBenefits, setRecentBenefits] = useState<BenefitWithIndication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [isHeroExpanded, setIsHeroExpanded] = useState(true);
  const [indicationsViewMode, setIndicationsViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIndication, setSelectedIndication] = useState<ExpertIndication | null>(null);
  const [showIndicationModal, setShowIndicationModal] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<BenefitWithIndication | null>(null);
  const [showNFModal, setShowNFModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Check if user needs to accept policy
  useEffect(() => {
    if (!expert.aceitou_politica_uso_em) {
      setShowPolicyModal(true);
    }
  }, [expert.aceitou_politica_uso_em]);

  useEffect(() => {
    loadDashboardData();
  }, [expert.id]);

  const loadDashboardData = async () => {
    try {
      // Load indications
      const { data: indications } = await supabase
        .from('experts_indications')
        .select('*')
        .eq('expert_id', expert.id)
        .order('criado_em', { ascending: false });

      // Load benefits with indication data
      const { data: benefits } = await supabase
        .from('experts_benefits')
        .select(`
          *,
          indication:experts_indications(empresa_nome)
        `)
        .eq('expert_id', expert.id)
        .order('criado_em', { ascending: false })
        .limit(10);

      // Calculate stats
      const totalIndicacoes = indications?.length || 0;
      const aguardandoValidacao = indications?.filter(i => i.status === 'aguardando_validacao').length || 0;
      const emProcesso = indications?.filter(i => ['em_contato', 'em_analise'].includes(i.status)).length || 0;
      const contratadas = indications?.filter(i => i.status === 'contratou').length || 0;

      const totalBeneficios = benefits?.reduce((sum, b) => sum + (b.valor_beneficio || 0), 0) || 0;
      const beneficiosPagos = benefits?.filter(b => b.pagamento_realizado).reduce((sum, b) => sum + (b.valor_beneficio || 0), 0) || 0;
      const aguardandoNF = benefits?.filter(b => !b.nf_enviada && b.pode_enviar_nf_a_partir_de && new Date(b.pode_enviar_nf_a_partir_de) <= new Date()).length || 0;

      // Calculate next payment
      const proximoPagamento = benefits?.find(b =>
        !b.pagamento_realizado &&
        b.nf_enviada &&
        b.data_prevista_pagamento_beneficio
      )?.valor_beneficio || 0;

      setStats({
        totalIndicacoes,
        aguardandoValidacao,
        emProcesso,
        contratadas,
        totalBeneficios,
        beneficiosPagos,
        proximoPagamento,
        aguardandoNF,
      });

      // Set recent indications (limit to 10)
      setRecentIndications((indications || []).slice(0, 10));

      // Set recent benefits
      const benefitsData = (benefits || []).map(item => ({
        ...item,
        indication: Array.isArray(item.indication) ? item.indication[0] : item.indication
      })) as BenefitWithIndication[];
      setRecentBenefits(benefitsData);

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const handlePolicyAccept = async () => {
    try {
      // Get user IP address
      let userIp = 'unknown';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        userIp = ipData.ip;
      } catch (error) {
        console.error('Error fetching IP:', error);
      }

      // Update expert with policy acceptance
      const { error } = await supabase
        .from('experts_users')
        .update({
          aceitou_politica_uso_em: new Date().toISOString(),
          aceitou_politica_uso_ip: userIp,
        })
        .eq('id', expert.id);

      if (error) {
        console.error('Error saving policy acceptance:', error);
        alert('Erro ao registrar aceite da política. Por favor, tente novamente.');
        return;
      }

      // Close modal and reload page to get updated expert data
      setShowPolicyModal(false);
      window.location.reload();
    } catch (error) {
      console.error('Error accepting policy:', error);
      alert('Erro ao registrar aceite da política. Por favor, tente novamente.');
    }
  };

  const handleIndicationClick = async (indicationId: string) => {
    try {
      // Load full indication details
      const { data, error } = await supabase
        .from('experts_indications')
        .select('*')
        .eq('id', indicationId)
        .single();

      if (error) throw error;

      setSelectedIndication(data);
      setShowIndicationModal(true);
    } catch (error) {
      console.error('Error loading indication details:', error);
      alert('Erro ao carregar detalhes da indicação.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBenefit) return;

    // Validate file (mantém validações no frontend também)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadError('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    const allowedTypes = ['application/pdf', 'text/xml', 'application/xml'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Formato inválido. Use PDF ou XML.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      // Upload via Edge Function (já atualiza o banco de dados também)
      await uploadExpertNF(
        expert.id,
        selectedBenefit.id,
        selectedBenefit.indication_id,
        selectedBenefit.valor_beneficio,
        file,
        false // não é substituição (é primeiro envio)
      );

      // Fechando o modal e recarregando dados
      setShowNFModal(false);
      setSelectedBenefit(null);
      await loadDashboardData();
    } catch (error) {
      console.error('Error uploading NF:', error);
      setUploadError('Erro ao enviar nota fiscal. Tente novamente.');
      setUploading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    // Parse date string directly to avoid timezone issues
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  // Check if expert needs to complete setup
  const needsSetup =
    !expert.curso_concluido ||
    !expert.chave_pix_empresa;

  const setupTasks = [
    {
      id: 'curso',
      completed: expert.curso_concluido,
      label: 'Leitura do Guia Essencial Expert (10 min)',
      icon: GraduationCap,
      page: 'curso',
    },
    {
      id: 'pix',
      completed: !!expert.chave_pix_empresa,
      label: 'Cadastrar chave PIX',
      icon: CreditCard,
      page: 'meus-dados',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner message="Carregando dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center md:items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            Olá, <span className="text-primary-600">{expert.nome.split(' ')[0]}</span>!
          </h2>
          <p className="text-text-secondary mt-1">
            <span className="hidden md:inline">Boas vindas ao Programa Experts CorpVox</span>
            <span className="md:hidden">
              Boas vindas ao Programa<br />Experts CorpVox
            </span>
          </p>
        </div>
        <button
          onClick={() => !needsSetup && onNavigate('indicacoes:new')}
          disabled={needsSetup}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium ${
            needsSetup
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
          title={needsSetup ? 'Complete os passos necessários para criar indicações' : 'Criar nova indicação'}
        >
          <Plus className="w-5 h-5 hidden md:block" />
          <span>Nova Indicação</span>
        </button>
      </div>

      {/* Hero Box with Message */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl overflow-visible relative">
        {/* Toggle Button - Outside box at top right */}
        <button
          onClick={() => setIsHeroExpanded(!isHeroExpanded)}
          className="absolute -top-3 -right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white border-2 border-primary-200 hover:bg-primary-50 hover:border-primary-300 transition-all shadow-md"
          aria-label={isHeroExpanded ? "Minimizar" : "Expandir"}
        >
          {isHeroExpanded ? (
            <Minus className="w-5 h-5 text-primary-600" />
          ) : (
            <Plus className="w-5 h-5 text-primary-600" />
          )}
        </button>

        <div className={`transition-all duration-300 ${isHeroExpanded ? 'p-8 md:px-12 md:py-8' : 'p-6 md:px-8 md:py-6'}`}>
          {/* Top Section: Title + Image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left: Title and Subtitle */}
            <div className="text-center md:text-left">
              {/* Badge */}
              <div className="inline-flex items-center px-3 py-1.5 bg-gray-700 text-white text-sm font-medium rounded-full mb-4">
                Receba benefícios por sua indicação
              </div>

              <h3 className={`font-bold leading-tight transition-all duration-300 ${
                isHeroExpanded
                  ? 'text-2xl md:text-3xl mb-4'
                  : 'text-lg md:text-xl mb-2'
              }`}>
                <span className="text-text-primary">Você já orienta muitas empresas.</span>
                <br />
                <span className="text-primary-600">Agora pode ser reconhecido por isso.</span>
              </h3>

              {isHeroExpanded && (
                <p className="text-text-secondary text-base leading-relaxed max-w-xl mx-auto md:mx-0">
                  Identifique empresas que ainda não possuem um canal seguro de denúncias, conforme a NR-01. Se a empresa contratar o CorpVox, <span className="font-semibold">você recebe um benefício pelo seu apontamento técnico.</span>
                </p>
              )}
            </div>

            {/* Right: Image */}
            <div className={`flex justify-center md:justify-end relative transition-all duration-300 ${
              isHeroExpanded ? 'mb-0' : '-mb-6 md:-mb-6'
            }`}>
              <img
                src="/sst_cropped.png"
                alt="Expert SST"
                className={`object-contain object-bottom opacity-90 relative transition-all duration-300 ${
                  isHeroExpanded
                    ? 'max-h-64 md:max-h-96 md:-mt-20'
                    : 'max-h-32 md:max-h-48 md:-mt-10'
                }`}
              />
            </div>
          </div>

          {/* Divider line and Steps - Only show when expanded */}
          {isHeroExpanded && (
            <>
              {/* Divider line */}
              <div className="border-t border-gray-300 -mx-8 md:-mx-12 mt-0 mb-10"></div>

              {/* Bottom Section: Steps - Horizontal with dividers */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-primary-200">
            {/* Step 1 */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left md:pr-6">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mb-3">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <h5 className="font-bold text-text-primary text-base mb-2">Faça a indicação técnica</h5>
              <p className="text-text-secondary text-sm leading-relaxed">Quando aplicável, mencione o CorpVox em seus relatórios como uma opção técnica adequada para empresas sem canal seguro de denúncias.</p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left md:px-6">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mb-3">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <h5 className="font-bold text-text-primary text-base mb-2">Registre a empresa aqui</h5>
              <p className="text-text-secondary text-sm leading-relaxed">Cadastro simples e rápido na plataforma.</p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left md:px-6">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mb-3">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <h5 className="font-bold text-text-primary text-base mb-2">O time CorpVox assume o contato</h5>
              <p className="text-text-secondary text-sm leading-relaxed">Nossa equipe conduz todo o processo. Você não vende, não negocia e não participa da decisão.</p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left md:pl-6">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mb-3">
                <span className="text-white text-sm font-bold">4</span>
              </div>
              <h5 className="font-bold text-text-primary text-base mb-2">Receba seus benefícios</h5>
              <p className="text-text-secondary text-sm leading-relaxed">Se a empresa contratar o CorpVox, seu benefício é liberado. O valor pode variar de <span className="font-bold">R$ 400 a R$ 1.500</span>, de acordo com o plano contratado.</p>
            </div>
          </div>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards - Row 1: Benefícios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Total Benefícios */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-6 h-6 text-white" />
                <p className="text-sm font-medium opacity-90">
                  Total de Benefícios
                </p>
              </div>
              <p className="text-xl md:text-3xl font-bold">
                {formatCurrency(stats.totalBeneficios)}
              </p>
            </div>
          </div>

          {/* Benefícios já pagos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 text-gray-700" />
                <p className="text-sm text-text-muted">
                  Benefícios já pagos
                </p>
              </div>
              <p className="text-xl md:text-2xl font-bold text-green-600">
                {formatCurrency(stats.beneficiosPagos)}
              </p>
            </div>
          </div>
      </div>

      {/* Stats Cards - Row 2: Indicações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Total Indicações */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-gray-700" />
                <p className="text-sm text-text-muted">
                  Total de Indicações
                </p>
              </div>
              <p className="text-xl md:text-2xl font-bold text-text-primary">
                {stats.totalIndicacoes}
              </p>
            </div>
          </div>

          {/* Empresas Contratantes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 text-gray-700" />
                <p className="text-sm text-text-muted">
                  Empresas Contratantes
                </p>
              </div>
              <p className="text-xl md:text-2xl font-bold text-text-primary">
                {stats.contratadas}
              </p>
            </div>
          </div>
      </div>

      {/* Setup Tasks - only shown if user needs to complete setup */}
      {needsSetup && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-8">
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
                {setupTasks.map((task) => {
                  const Icon = task.icon;
                  return (
                    <button
                      key={task.id}
                      onClick={() => onNavigate(task.page)}
                      className="w-full flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Icon className="w-5 h-5 text-orange-600" />
                        )}
                        <span className={`text-sm font-medium ${task.completed ? 'text-green-900 line-through' : 'text-orange-900'}`}>
                          {task.label}
                        </span>
                      </div>
                      {!task.completed && (
                        <ArrowRight className="w-4 h-4 text-orange-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Indications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">
              Indicações recentes
            </h3>
            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              {recentIndications.length > 0 && (
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setIndicationsViewMode('grid')}
                    className={`p-1.5 rounded transition-colors ${
                      indicationsViewMode === 'grid'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Visualização em grade"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIndicationsViewMode('list')}
                    className={`p-1.5 rounded transition-colors ${
                      indicationsViewMode === 'list'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Visualização em lista"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button
                onClick={() => onNavigate('indicacoes')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
              >
                <span>Ver todas</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {recentIndications.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-text-muted mb-4">
              Você ainda não fez nenhuma indicação.
            </p>
            <button
              onClick={() => onNavigate('indicacoes')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
            >
              Fazer primeira indicação
            </button>
          </div>
        ) : indicationsViewMode === 'grid' ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentIndications.map((indication) => (
                <div
                  key={indication.id}
                  className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:bg-gray-100 hover:border-primary-200 transition-all cursor-pointer"
                  onClick={() => handleIndicationClick(indication.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getIndicationStatusColor(indication.status)}`}>
                      {getIndicationStatusDisplay(indication.status)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-text-primary mb-2 line-clamp-2">
                    {indication.empresa_nome}
                  </h4>
                  <p className="text-xs text-text-muted">
                    {new Date(indication.criado_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    CNPJ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentIndications.map((indication) => (
                  <tr
                    key={indication.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleIndicationClick(indication.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-text-primary">
                        {indication.empresa_nome}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-text-muted">
                        {indication.empresa_cnpj}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-text-muted">
                        {getIndicationTypeDisplay(indication.tipo_indicacao)}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-text-muted">
                        {new Date(indication.criado_em).toLocaleDateString('pt-BR')}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getIndicationStatusColor(indication.status)}`}>
                        {getIndicationStatusDisplay(indication.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Benefits */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">
              Meus benefícios
            </h3>
            <button
              onClick={() => onNavigate('beneficios')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {recentBenefits.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-text-muted">
                Você ainda não possui benefícios registrados
              </p>
            </div>
          ) : (
            recentBenefits.map((benefit) => (
              <div
                key={benefit.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onNavigate('beneficios')}
                  >
                    <p className="font-medium text-text-primary">
                      {benefit.indication?.empresa_nome || 'Empresa não identificada'}
                    </p>
                    <p className="text-sm text-text-muted mt-1">
                      {benefit.status === 'aguardando_pagamento_cliente'
                        ? 'Aguardando o primeiro pagamento da empresa.'
                        : benefit.status === 'liberado_para_nf'
                        ? `Liberado para emissão de nota fiscal desde ${formatDate(benefit.pode_enviar_nf_a_partir_de)}`
                        : benefit.status === 'aguardando_conferencia'
                        ? `Nota enviada em ${formatDate(benefit.nf_enviada_em)}. Estamos conferindo os dados.`
                        : benefit.status === 'nf_recusada'
                        ? 'Nota fiscal recusada. Faça o reenvio.'
                        : benefit.status === 'processando_pagamento'
                        ? `Nota fiscal aprovada. Previsão de pagamento em ${formatDate(benefit.data_prevista_pagamento_beneficio)}`
                        : benefit.status === 'agendado'
                        ? `Pagamento agendado para ${formatDate(benefit.data_prevista_pagamento_beneficio)}`
                        : benefit.status === 'pago'
                        ? `Pago em ${formatDate(benefit.pagamento_data)}`
                        : formatDate(benefit.criado_em)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(benefit.valor_beneficio || 0)}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {benefit.status === 'pago' ? 'Pago' : benefit.status === 'agendado' ? `Pagamento agendado para ${formatDate(benefit.data_prevista_pagamento_beneficio)}` : benefit.status === 'processando_pagamento' ? 'Processando pagamento' : benefit.status === 'aguardando_conferencia' ? 'Conferindo Nota Fiscal' : benefit.status === 'nf_enviada' ? 'Processando pagamento' : benefit.status === 'liberado_para_nf' ? 'Emita sua nota fiscal' : 'Aguardando pagamento cliente'}
                    </p>
                  </div>
                  {benefit.status === 'liberado_para_nf' && !benefit.nf_enviada && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBenefit(benefit);
                        setShowNFModal(true);
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium flex items-center space-x-1.5 whitespace-nowrap"
                    >
                      <span>🎉</span>
                      <span>Enviar nota fiscal</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Policy Modal */}
      <PolicyModal
        isOpen={showPolicyModal}
        onAccept={handlePolicyAccept}
      />

      {/* Indication Detail Modal */}
      {selectedIndication && (
        <IndicationDetailModal
          isOpen={showIndicationModal}
          onClose={() => {
            setShowIndicationModal(false);
            setSelectedIndication(null);
          }}
          onUpdate={() => {
            loadDashboardData();
            setShowIndicationModal(false);
            setSelectedIndication(null);
          }}
          indication={selectedIndication}
        />
      )}

      {/* NF Upload Modal */}
      {showNFModal && selectedBenefit && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-semibold text-text-primary">
                Enviar Nota Fiscal
              </h3>
              <button
                onClick={() => {
                  setShowNFModal(false);
                  setSelectedBenefit(null);
                }}
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
                      {formatCurrency(selectedBenefit.valor_beneficio || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-primary-700">Data Limite para Emissão:</span>
                    <span className="text-base font-semibold text-primary-900">
                      {(() => {
                        // Extract year and month from the string to avoid timezone issues
                        const dateStr = selectedBenefit.pode_enviar_nf_a_partir_de;
                        const [year, month] = dateStr.split('-');
                        return formatDate(`${year}-${month}-10`);
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-primary-700">Previsão de Pagamento:</span>
                    <span className="text-base font-semibold text-primary-900">
                      {formatDate(selectedBenefit.data_prevista_pagamento_beneficio)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Descrição do Serviço */}
              <div>
                <h4 className="font-semibold text-text-primary mb-2">Descrição do Serviço</h4>
                <p className="text-sm text-white bg-gray-800 rounded-lg p-3">
                  Benefício técnico referente ao Programa Experts CorpVox, conforme regras internas do programa. Indicação técnica da empresa <strong>{selectedBenefit.indication?.empresa_nome || 'N/A'}.</strong>
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
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id={`nf-upload-dashboard-${selectedBenefit.id}`}
                    accept=".pdf,.xml"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <label
                    htmlFor={`nf-upload-dashboard-${selectedBenefit.id}`}
                    className="cursor-pointer inline-flex flex-col items-center"
                  >
                    <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm font-medium text-text-primary">
                      {uploading ? 'Enviando...' : 'Clique para selecionar o arquivo'}
                    </span>
                    <span className="text-xs text-text-muted mt-1">
                      PDF ou XML (máx. 10MB)
                    </span>
                  </label>
                </div>
                {uploadError && (
                  <p className="text-sm text-red-600 mt-2">{uploadError}</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3 rounded-b-xl">
              <button
                onClick={() => {
                  setShowNFModal(false);
                  setSelectedBenefit(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
