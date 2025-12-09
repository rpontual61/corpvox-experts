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

  // Filter benefits waiting for NF (liberado_para_nf status)
  const waitingForNF = benefits.filter((benefit) => {
    const matchesSearch =
      (benefit.expert_nome && benefit.expert_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (benefit.empresa_nome && benefit.empresa_nome.toLowerCase().includes(searchTerm.toLowerCase()));

    return benefit.status === 'liberado_para_nf' && matchesSearch;
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
        return 'bg-yellow-100 text-yellow-800';
      case 'liberado_para_nf':
        return 'bg-green-100 text-green-800';
      case 'nf_enviada':
        return 'bg-blue-100 text-blue-800';
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
      case 'nf_enviada':
        return 'NF Enviada';
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{totalBenefits}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-6">
          <p className="text-sm text-yellow-800">Aguardando Cliente</p>
          <p className="text-2xl font-bold text-yellow-900">
            {benefits.filter(b => b.status === 'aguardando_pagamento_cliente').length}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-6">
          <p className="text-sm text-green-800">Liberado para NF</p>
          <p className="text-2xl font-bold text-green-900">
            {benefits.filter(b => b.status === 'liberado_para_nf').length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-6">
          <p className="text-sm text-blue-800">NF Enviada</p>
          <p className="text-2xl font-bold text-blue-900">
            {benefits.filter(b => b.status === 'nf_enviada').length}
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
              <option value="nf_enviada">NF Enviada</option>
              <option value="pago">Pago</option>
            </select>
          </div>
        </div>
      </div>

      {/* Waiting for NF Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-green-50 border-b border-green-200 px-6 py-4">
          <h2 className="text-xl font-bold text-green-900">
            Liberados para NF ({waitingForNF.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[20%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
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
                  Pagamento Previsto
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {waitingForNF.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nenhum benefício liberado para NF
                  </td>
                </tr>
              ) : (
                waitingForNF.map((benefit) => (
                  <tr key={benefit.id} className="hover:bg-gray-50">
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
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(benefit.data_prevista_pagamento_beneficio)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
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
                  <tr key={benefit.id} className="hover:bg-gray-50">
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
                    <td className="px-6 py-4 text-right text-sm font-medium">
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
          <strong>{waitingForNF.length}</strong> benefícios liberados para NF • <strong>{allBenefits.length}</strong> benefícios no total
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
