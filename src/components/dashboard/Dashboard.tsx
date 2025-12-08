import { useEffect, useState } from 'react';
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
  BookOpen
} from 'lucide-react';
import { ExpertUser } from '../../types/database.types';
import { supabase, formatCurrency, getIndicationStatusColor, getIndicationStatusDisplay } from '../../lib/supabase';

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
  proximoPagamento: number;
  aguardandoNF: number;
}

interface RecentIndication {
  id: string;
  empresa_nome: string;
  status: string;
  criado_em: string;
}

export default function Dashboard({ expert, onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalIndicacoes: 0,
    aguardandoValidacao: 0,
    emProcesso: 0,
    contratadas: 0,
    totalBeneficios: 0,
    proximoPagamento: 0,
    aguardandoNF: 0,
  });
  const [recentIndications, setRecentIndications] = useState<RecentIndication[]>([]);
  const [loading, setLoading] = useState(true);

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

      // Load benefits
      const { data: benefits } = await supabase
        .from('experts_benefits')
        .select('*')
        .eq('expert_id', expert.id);

      // Calculate stats
      const totalIndicacoes = indications?.length || 0;
      const aguardandoValidacao = indications?.filter(i => i.status === 'aguardando_validacao').length || 0;
      const emProcesso = indications?.filter(i => ['em_contato', 'em_analise'].includes(i.status)).length || 0;
      const contratadas = indications?.filter(i => i.status === 'contratou').length || 0;

      const totalBeneficios = benefits?.reduce((sum, b) => sum + (b.valor_beneficio || 0), 0) || 0;
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
        proximoPagamento,
        aguardandoNF,
      });

      // Set recent indications
      setRecentIndications((indications || []).slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  // Check if expert needs to complete setup
  const needsSetup =
    !expert.curso_concluido ||
    !expert.chave_pix_empresa ||
    !expert.aceitou_termo_adesao_em ||
    !expert.aceitou_politica_uso_em;

  const setupTasks = [
    {
      id: 'curso',
      completed: expert.curso_concluido,
      label: 'Concluir curso obrigatório',
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
    {
      id: 'termos',
      completed: !!expert.aceitou_termo_adesao_em && !!expert.aceitou_politica_uso_em,
      label: 'Aceitar termos e políticas',
      icon: FileCheck,
      page: 'meus-dados',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary">
          Olá, {expert.nome.split(' ')[0]}!
        </h2>
        <p className="text-text-secondary mt-1">
          Bem-vindo ao Programa Experts CorpVox
        </p>
      </div>

      {/* Hero Box with Message */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl overflow-hidden relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Message and Steps */}
          <div className="p-8">
            {/* Message */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-text-primary mb-3">
                Você já influencia muitas empresas.
              </h3>
              <h4 className="text-xl font-semibold text-primary-600 mb-4">
                Agora é hora de receber uma renda extra por isso.
              </h4>
              <p className="text-text-secondary text-base">
                Compartilhe a CorpVox com empresas que você conhece e receba benefícios por cada contratação.
              </p>
            </div>

            {/* Steps - How it works */}
            <div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div>
                    <h5 className="font-semibold text-text-primary mb-1">Indique uma empresa</h5>
                    <p className="text-sm text-text-secondary">Cadastre os dados da empresa que você deseja indicar</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div>
                    <h5 className="font-semibold text-text-primary mb-1">Aguarde o contato</h5>
                    <p className="text-sm text-text-secondary">Nossa equipe entrará em contato com a empresa indicada</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div>
                    <h5 className="font-semibold text-text-primary mb-1">Receba seus benefícios</h5>
                    <p className="text-sm text-text-secondary">Quando a empresa contratar, você recebe sua recompensa</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - SST Image */}
          <div className="hidden md:flex items-end justify-end h-full">
            <img
              src="/sst_cropped.png"
              alt="Expert SST"
              className="object-contain object-bottom h-full"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Benefícios */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-6 h-6 text-white" />
                <p className="text-sm font-medium opacity-90">
                  Total de Benefícios
                </p>
              </div>
              <p className="text-3xl font-bold">
                {formatCurrency(stats.totalBeneficios)}
              </p>
            </div>
          </div>

          {/* Total Indicações */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-gray-700" />
                <p className="text-sm text-text-muted">
                  Total de Indicações
                </p>
              </div>
              <p className="text-2xl font-bold text-text-primary">
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
              <p className="text-2xl font-bold text-text-primary">
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
                Complete seu cadastro para começar a indicar
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
                      className="w-full flex items-center justify-between p-3 bg-white rounded-lg hover:bg-orange-50 transition-colors"
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

      {/* Financial Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Próximo Pagamento */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-6 h-6 text-gray-700" />
              <p className="text-sm text-text-muted">
                Próximo Pagamento
              </p>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {formatCurrency(stats.proximoPagamento)}
            </p>
          </div>
        </div>

        {/* Aguardando NF */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-gray-700" />
              <p className="text-sm text-text-muted">
                Aguardando NF
              </p>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {stats.aguardandoNF}
            </p>
          </div>
          {stats.aguardandoNF > 0 && (
            <button
              onClick={() => onNavigate('beneficios')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
            >
              <span>Ver benefícios</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Recent Indications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">
              Indicações Recentes
            </h3>
            <button
              onClick={() => onNavigate('indicacoes')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {recentIndications.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-text-muted mb-4">
                Você ainda não fez nenhuma indicação
              </p>
              {!needsSetup && (
                <button
                  onClick={() => onNavigate('indicacoes')}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Fazer primeira indicação
                </button>
              )}
            </div>
          ) : (
            recentIndications.map((indication) => (
              <div
                key={indication.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onNavigate('indicacoes')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">
                      {indication.empresa_nome}
                    </p>
                    <p className="text-sm text-text-muted mt-1">
                      {new Date(indication.criado_em).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getIndicationStatusColor(indication.status)}`}>
                    {getIndicationStatusDisplay(indication.status)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {!needsSetup && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => onNavigate('indicacoes')}
              className="flex items-center space-x-3 p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <FileText className="w-6 h-6 text-primary-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-primary-900">
                  Nova Indicação
                </p>
                <p className="text-xs text-primary-700">
                  Indicar nova empresa
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('beneficios')}
              className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <DollarSign className="w-6 h-6 text-green-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-green-900">
                  Meus Benefícios
                </p>
                <p className="text-xs text-green-700">
                  Ver pagamentos
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('como-indicar')}
              className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <BookOpen className="w-6 h-6 text-blue-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-blue-900">
                  Como Indicar
                </p>
                <p className="text-xs text-blue-700">
                  Ver guia completo
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
