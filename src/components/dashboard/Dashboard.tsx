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
  FileCheck
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

      {/* Setup Alert */}
      {needsSetup && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-yellow-900 mb-2">
                Complete seu cadastro para começar a indicar
              </h3>
              <p className="text-sm text-yellow-800 mb-4">
                Você precisa completar algumas etapas antes de poder fazer indicações:
              </p>
              <div className="space-y-2">
                {setupTasks.map((task) => {
                  const Icon = task.icon;
                  return (
                    <button
                      key={task.id}
                      onClick={() => onNavigate(task.page)}
                      className="w-full flex items-center justify-between p-3 bg-white rounded-lg hover:bg-yellow-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Icon className="w-5 h-5 text-yellow-600" />
                        )}
                        <span className={`text-sm font-medium ${task.completed ? 'text-green-900 line-through' : 'text-yellow-900'}`}>
                          {task.label}
                        </span>
                      </div>
                      {!task.completed && (
                        <ArrowRight className="w-4 h-4 text-yellow-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Indicações */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-text-primary mb-1">
            {stats.totalIndicacoes}
          </p>
          <p className="text-sm text-text-muted">
            Total de Indicações
          </p>
        </div>

        {/* Aguardando Validação */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary mb-1">
            {stats.aguardandoValidacao}
          </p>
          <p className="text-sm text-text-muted">
            Aguardando Validação
          </p>
        </div>

        {/* Em Processo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary mb-1">
            {stats.emProcesso}
          </p>
          <p className="text-sm text-text-muted">
            Em Processo
          </p>
        </div>

        {/* Contratadas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary mb-1">
            {stats.contratadas}
          </p>
          <p className="text-sm text-text-muted">
            Contratadas
          </p>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Benefícios */}
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
            {formatCurrency(stats.totalBeneficios)}
          </p>
        </div>

        {/* Próximo Pagamento */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-text-primary">
              Próximo Pagamento
            </p>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {formatCurrency(stats.proximoPagamento)}
          </p>
        </div>

        {/* Aguardando NF */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-sm font-medium text-text-primary">
              Aguardando NF
            </p>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {stats.aguardandoNF}
          </p>
          {stats.aguardandoNF > 0 && (
            <button
              onClick={() => onNavigate('beneficios')}
              className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
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
