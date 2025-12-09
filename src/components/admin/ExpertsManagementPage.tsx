import { useEffect, useState } from 'react';
import { Search, Filter, Eye } from 'lucide-react';
import { supabase, formatDate, formatPhone } from '../../lib/supabase';
import { ExpertUser } from '../../types/database.types';
import { AdminUser } from '../../types/database.types';
import LoadingSpinner from '../LoadingSpinner';
import ExpertDetailModal from './ExpertDetailModal';

interface ExpertsManagementPageProps {
  admin: AdminUser;
}

interface ExpertWithStats extends ExpertUser {
  total_indications: number;
  approved_indications: number;
  rejected_indications: number;
  indications_with_benefits: number;
  companies_served: number;
  total_benefits: number;
}

export default function ExpertsManagementPage({ admin }: ExpertsManagementPageProps) {
  const [experts, setExperts] = useState<ExpertWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedExpert, setSelectedExpert] = useState<ExpertWithStats | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Metrics
  const [totalExperts, setTotalExperts] = useState(0);

  useEffect(() => {
    loadExperts();
    loadMetrics();
  }, []);

  const loadExperts = async () => {
    try {
      // Get all experts
      const { data: expertsData, error: expertsError } = await supabase
        .from('experts_users')
        .select('*')
        .order('criado_em', { ascending: false });

      if (expertsError) throw expertsError;

      // Get indications count for each expert
      const expertsWithStats = await Promise.all(
        expertsData.map(async (expert) => {
          // Total indications
          const { count: totalCount } = await supabase
            .from('experts_indications')
            .select('*', { count: 'exact', head: true })
            .eq('expert_id', expert.id);

          // Approved indications (not aguardando_validacao or validacao_recusada)
          const { count: approvedCount } = await supabase
            .from('experts_indications')
            .select('*', { count: 'exact', head: true })
            .eq('expert_id', expert.id)
            .not('status', 'in', '(aguardando_validacao,validacao_recusada)');

          // Rejected indications
          const { count: rejectedCount } = await supabase
            .from('experts_indications')
            .select('*', { count: 'exact', head: true })
            .eq('expert_id', expert.id)
            .eq('status', 'validacao_recusada');

          // Indications with benefits (contratou status)
          const { count: benefitIndicationsCount } = await supabase
            .from('experts_indications')
            .select('*', { count: 'exact', head: true })
            .eq('expert_id', expert.id)
            .eq('status', 'contratou');

          // Total benefits amount
          const { data: benefitsData } = await supabase
            .from('experts_benefits')
            .select('valor_beneficio')
            .eq('expert_id', expert.id);

          const totalBenefits = benefitsData?.reduce((sum, b) => sum + (b.valor_beneficio || 0), 0) || 0;

          return {
            ...expert,
            total_indications: totalCount || 0,
            approved_indications: approvedCount || 0,
            rejected_indications: rejectedCount || 0,
            indications_with_benefits: benefitIndicationsCount || 0,
            companies_served: expert.qtd_empresas_atendidas || 0,
            total_benefits: totalBenefits,
          };
        })
      );

      setExperts(expertsWithStats);
      setLoading(false);
    } catch (error) {
      console.error('Error loading experts:', error);
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      // Total experts
      const { count: expertsCount } = await supabase
        .from('experts_users')
        .select('*', { count: 'exact', head: true });

      setTotalExperts(expertsCount || 0);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  // Filter pending experts
  const pendingExperts = experts.filter((expert) => {
    const matchesSearch =
      expert.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expert.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expert.cpf && expert.cpf.includes(searchTerm)) ||
      (expert.telefone_whatsapp && expert.telefone_whatsapp.includes(searchTerm));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && expert.total_indications > 0) ||
      (statusFilter === 'inactive' && expert.total_indications === 0);

    return expert.status === 'pendente' && matchesSearch && matchesStatus;
  });

  // Filter processed experts (approved and rejected)
  const processedExperts = experts.filter((expert) => {
    const matchesSearch =
      expert.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expert.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expert.cpf && expert.cpf.includes(searchTerm)) ||
      (expert.telefone_whatsapp && expert.telefone_whatsapp.includes(searchTerm));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && expert.total_indications > 0) ||
      (statusFilter === 'inactive' && expert.total_indications === 0);

    return expert.status !== 'pendente' && matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Experts</h1>
        <p className="text-gray-600">
          Gerencie todos os experts cadastrados no programa
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{totalExperts}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-6">
          <p className="text-sm text-yellow-800">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-900">
            {experts.filter(e => e.status === 'pendente').length}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-6">
          <p className="text-sm text-green-800">Aprovados</p>
          <p className="text-2xl font-bold text-green-900">
            {experts.filter(e => e.status === 'aprovado').length}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-6">
          <p className="text-sm text-red-800">Reprovados</p>
          <p className="text-2xl font-bold text-red-900">
            {experts.filter(e => e.status === 'reprovado').length}
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
              placeholder="Buscar por nome, e-mail, CPF ou telefone..."
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
              <option value="all">Todos</option>
              <option value="active">Ativos (com indicações)</option>
              <option value="inactive">Inativos (sem indicações)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pending Experts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
          <h2 className="text-lg font-semibold text-yellow-900">
            Experts Aguardando Aprovação ({pendingExperts.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expert
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Indicações
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aprovadas
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reprovadas
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Viraram Benefício
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresas Atendidas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Benefícios
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingExperts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    Nenhum expert aguardando aprovação
                  </td>
                </tr>
              ) : (
                pendingExperts.map((expert) => (
                  <tr key={expert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{expert.nome}</p>
                        <p className="text-sm text-gray-500">
                          PIX: {expert.chave_pix_empresa || 'Não informado'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-900">{expert.email}</p>
                        {expert.telefone_whatsapp && (
                          <p className="text-sm text-gray-500">{formatPhone(expert.telefone_whatsapp)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                      {expert.total_indications}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                      {expert.approved_indications}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                      {expert.rejected_indications}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                      {expert.indications_with_benefits}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                      {expert.companies_served}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(expert.total_benefits)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedExpert(expert);
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

      {/* Processed Experts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Todos os Experts ({processedExperts.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expert
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Indicações
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aprovadas
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reprovadas
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Viraram Benefício
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresas Atendidas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Benefícios
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedExperts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    Nenhum expert encontrado
                  </td>
                </tr>
              ) : (
                processedExperts.map((expert) => (
                  <tr key={expert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{expert.nome}</p>
                        <p className="text-sm text-gray-500">
                          PIX: {expert.chave_pix_empresa || 'Não informado'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-900">{expert.email}</p>
                        {expert.telefone_whatsapp && (
                          <p className="text-sm text-gray-500">{formatPhone(expert.telefone_whatsapp)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                      {expert.total_indications}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                      {expert.approved_indications}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                      {expert.rejected_indications}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                      {expert.indications_with_benefits}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                      {expert.companies_served}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(expert.total_benefits)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedExpert(expert);
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
          <strong>{pendingExperts.length}</strong> experts aguardando aprovação • <strong>{processedExperts.length}</strong> experts processados • Total: <strong>{totalExperts}</strong> experts cadastrados
        </p>
      </div>

      {/* Expert Detail Modal */}
      {showModal && selectedExpert && (
        <ExpertDetailModal
          expert={selectedExpert}
          onClose={() => {
            setShowModal(false);
            setSelectedExpert(null);
          }}
          onUpdate={() => {
            loadExperts();
            loadMetrics();
          }}
        />
      )}
    </div>
  );
}
