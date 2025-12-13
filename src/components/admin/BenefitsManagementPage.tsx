import { useEffect, useState } from 'react';
import { Search, Filter, Eye, DollarSign } from 'lucide-react';
import { supabase, formatDate, formatCurrency } from '../../lib/supabase';
import { ExpertBenefit } from '../../types/database.types';
import { AdminUser } from '../../types/database.types';
import LoadingSpinner from '../LoadingSpinner';
import BenefitDetailModal from './BenefitDetailModal';

interface BenefitsManagementPageProps {
  admin: AdminUser;
}

interface BenefitWithExpert extends ExpertBenefit {
  expert_nome?: string;
  empresa_nome?: string;
}

export default function BenefitsManagementPage({ admin }: BenefitsManagementPageProps) {
  const [benefits, setBenefits] = useState<BenefitWithExpert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [totalBenefits, setTotalBenefits] = useState(0);
  const [selectedBenefit, setSelectedBenefit] = useState<BenefitWithExpert | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadBenefits();
    loadMetrics();
  }, []);

  const loadBenefits = async () => {
    try {
      const { data, error } = await supabase
        .from('experts_benefits')
        .select(`
          *,
          expert:experts_users!experts_benefits_expert_id_fkey(nome),
          indication:experts_indications!experts_benefits_indication_id_fkey(empresa_nome)
        `)
        .order('criado_em', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map(item => ({
        ...item,
        expert_nome: (item.expert as any)?.nome || 'N/A',
        empresa_nome: (item.indication as any)?.empresa_nome || 'N/A'
      })) as BenefitWithExpert[];

      setBenefits(formattedData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading benefits:', error);
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const { count: benefitsCount } = await supabase
        .from('experts_benefits')
        .select('*', { count: 'exact', head: true });

      setTotalBenefits(benefitsCount || 0);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  // Filter benefits waiting for NF review (aguardando_conferencia status)
  const waitingForNFReview = benefits.filter((benefit) => {
    const matchesSearch =
      (benefit.expert_nome && benefit.expert_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (benefit.empresa_nome && benefit.empresa_nome.toLowerCase().includes(searchTerm.toLowerCase()));

    return benefit.status === 'aguardando_conferencia' && matchesSearch;
  });

  // Filter all benefits
  const allBenefits = benefits.filter((benefit) => {
    const matchesSearch =
      (benefit.expert_nome && benefit.expert_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (benefit.empresa_nome && benefit.empresa_nome.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || benefit.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getBenefitStatusColor = (status: string) => {
    switch (status) {
      case 'aguardando_pagamento_cliente':
        return 'bg-gray-100 text-gray-800';
      case 'liberado_para_nf':
        return 'bg-blue-100 text-blue-800';
      case 'aguardando_conferencia':
        return 'bg-purple-100 text-purple-800';
      case 'nf_recusada':
        return 'bg-red-100 text-red-800';
      case 'processando_pagamento':
        return 'bg-gray-100 text-gray-800';
      case 'agendado':
        return 'bg-orange-100 text-orange-800';
      case 'pago':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBenefitStatusDisplay = (status: string) => {
    switch (status) {
      case 'aguardando_pagamento_cliente':
        return 'Aguardando Cliente';
      case 'liberado_para_nf':
        return 'Liberado para NF';
      case 'aguardando_conferencia':
        return 'Conferir Nota';
      case 'nf_recusada':
        return 'NF Recusada';
      case 'processando_pagamento':
        return 'Processando pagamento';
      case 'agendado':
        return 'Pagamento Agendado';
      case 'pago':
        return 'Pago';
      default:
        return status;
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
        <h2 className="text-2xl font-bold text-gray-900">
          Gerenciar Benefícios
        </h2>
        <p className="text-gray-600 mt-1">
          Gerencie todos os benefícios pagos aos experts
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col">
          <p className="text-sm text-gray-600 mb-auto">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totalBenefits}</p>
        </div>
        <div className="bg-gray-50 rounded-lg shadow p-6 flex flex-col">
          <p className="text-sm text-gray-800 mb-auto">Aguardando Cliente</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {benefits.filter(b => b.status === 'aguardando_pagamento_cliente').length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-6 flex flex-col">
          <p className="text-sm text-blue-800 mb-auto">Liberado para NF</p>
          <p className="text-2xl font-bold text-blue-900 mt-2">
            {benefits.filter(b => b.status === 'liberado_para_nf').length}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-6 flex flex-col">
          <p className="text-sm text-purple-800 mb-auto">Conferir Nota</p>
          <p className="text-2xl font-bold text-purple-900 mt-2">
            {benefits.filter(b => b.status === 'aguardando_conferencia').length}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-6 flex flex-col">
          <p className="text-sm text-red-800 mb-auto">NF Recusada</p>
          <p className="text-2xl font-bold text-red-900 mt-2">
            {benefits.filter(b => b.status === 'nf_recusada').length}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg shadow p-6 flex flex-col">
          <p className="text-sm text-gray-800 mb-auto">Processando pagamento</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {benefits.filter(b => b.status === 'processando_pagamento').length}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg shadow p-6 flex flex-col">
          <p className="text-sm text-orange-800 mb-auto">Pagamento Agendado</p>
          <p className="text-2xl font-bold text-orange-900 mt-2">
            {benefits.filter(b => b.status === 'agendado').length}
          </p>
        </div>
        <div className="bg-emerald-50 rounded-lg shadow p-6 flex flex-col">
          <p className="text-sm text-emerald-800 mb-auto">Pago</p>
          <p className="text-2xl font-bold text-emerald-900 mt-2">
            {benefits.filter(b => b.status === 'pago').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por expert ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none bg-white"
            >
              <option value="all">Todos os status</option>
              <option value="aguardando_pagamento_cliente">Aguardando Cliente</option>
              <option value="liberado_para_nf">Liberado para NF</option>
              <option value="aguardando_conferencia">Conferir Nota</option>
              <option value="nf_recusada">NF Recusada</option>
              <option value="processando_pagamento">Processando pagamento</option>
              <option value="agendado">Pagamento Agendado</option>
              <option value="pago">Pago</option>
            </select>
          </div>
        </div>
      </div>

      {/* Waiting for NF Review Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-purple-50 border-b border-purple-200 px-6 py-4">
          <h2 className="text-xl font-bold text-purple-900">
            Conferir Nota Fiscal ({waitingForNFReview.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expert
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Contrato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pagamento Previsto
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {waitingForNFReview.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma nota fiscal aguardando conferência
                  </td>
                </tr>
              ) : (
                waitingForNFReview.map((benefit) => (
                  <tr
                    key={benefit.id}
                    onClick={() => {
                      setSelectedBenefit(benefit);
                      setShowModal(true);
                    }}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {benefit.expert_nome}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {benefit.empresa_nome}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(benefit.valor_beneficio || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(benefit.data_contrato_cliente)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBenefitStatusColor(benefit.status)}`}>
                        {getBenefitStatusDisplay(benefit.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(benefit.data_prevista_pagamento_beneficio)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setSelectedBenefit(benefit);
                          setShowModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-900"
                        title="Ver detalhes"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Benefits Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            Todos os Benefícios ({allBenefits.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expert
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Contrato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pagamento Previsto
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allBenefits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Nenhum benefício encontrado
                  </td>
                </tr>
              ) : (
                allBenefits.map((benefit) => (
                  <tr
                    key={benefit.id}
                    onClick={() => {
                      setSelectedBenefit(benefit);
                      setShowModal(true);
                    }}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {benefit.expert_nome}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {benefit.empresa_nome}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(benefit.valor_beneficio || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(benefit.data_contrato_cliente)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBenefitStatusColor(benefit.status)}`}>
                        {getBenefitStatusDisplay(benefit.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(benefit.data_prevista_pagamento_beneficio)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setSelectedBenefit(benefit);
                          setShowModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-900"
                        title="Ver detalhes"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>{waitingForNFReview.length}</strong> notas fiscais aguardando conferência • <strong>{allBenefits.length}</strong> benefícios no total
        </p>
      </div>

      {/* Benefit Detail Modal */}
      {showModal && selectedBenefit && (
        <BenefitDetailModal
          benefit={selectedBenefit}
          admin={admin}
          onClose={() => {
            setShowModal(false);
            setSelectedBenefit(null);
          }}
          onUpdate={() => {
            loadBenefits();
            loadMetrics();
          }}
        />
      )}
    </div>
  );
}
