import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Edit2,
  Save,
  X as XIcon,
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  Users
} from 'lucide-react';
import { supabase, formatDate, formatCNPJ, getIndicationStatusDisplay, getIndicationStatusColor, calculateBenefitDates } from '../../lib/supabase';
import { ExpertIndication } from '../../types/database.types';
import { AdminUser } from '../../types/database.types';
import { logAdminActivity } from '../../lib/adminAuth';
import LoadingSpinner from '../LoadingSpinner';
import ConfirmationModal from '../modals/ConfirmationModal';
import AlertModal from '../modals/AlertModal';

interface IndicationsManagementPageProps {
  admin: AdminUser;
}

export default function IndicationsManagementPage({ admin }: IndicationsManagementPageProps) {
  const [indications, setIndications] = useState<(ExpertIndication & { expert_nome?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expertFilter, setExpertFilter] = useState('all');
  const [hideLost, setHideLost] = useState(true);
  const [selectedIndication, setSelectedIndication] = useState<(ExpertIndication & { expert_nome?: string }) | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'success' as 'success' | 'error' | 'warning' | 'info' });

  useEffect(() => {
    loadIndications();
  }, []);

  const loadIndications = async () => {
    try {
      const { data, error } = await supabase
        .from('experts_indications')
        .select(`
          *,
          expert:experts_users!experts_indications_expert_id_fkey(nome)
        `)
        .order('criado_em', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(item => ({
        ...item,
        expert_nome: (item.expert as any)?.nome || 'N/A'
      }));

      setIndications(formattedData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading indications:', error);
      setLoading(false);
    }
  };

  // Split indications into two groups
  const pendingIndications = indications.filter((indication) => {
    const matchesSearch =
      indication.empresa_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      indication.empresa_cnpj.includes(searchTerm) ||
      indication.contato_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (indication.expert_nome && indication.expert_nome.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesExpert = expertFilter === 'all' || indication.expert_nome === expertFilter;

    return indication.status === 'aguardando_validacao' && matchesSearch && matchesExpert;
  });

  const processedIndications = indications.filter((indication) => {
    const matchesSearch =
      indication.empresa_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      indication.empresa_cnpj.includes(searchTerm) ||
      indication.contato_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (indication.expert_nome && indication.expert_nome.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || indication.status === statusFilter;
    const matchesExpert = expertFilter === 'all' || indication.expert_nome === expertFilter;
    const matchesLostFilter = !hideLost || indication.status !== 'perdido';

    return indication.status !== 'aguardando_validacao' && matchesSearch && matchesStatus && matchesExpert && matchesLostFilter;
  });

  // Get unique expert names for filter
  const uniqueExperts = Array.from(new Set(indications.map(ind => ind.expert_nome).filter(Boolean))).sort();

  const handleViewDetails = (indication: typeof indications[0]) => {
    setSelectedIndication(indication);
    setShowModal(true);
  };

  const handleUpdateStatus = async (indicationId: string, newStatus: string, motivo?: string) => {
    try {
      const updateData: any = { status: newStatus };

      if (newStatus === 'validacao_recusada' && motivo) {
        updateData.motivo_recusa = motivo;
      }

      if (newStatus === 'em_contato') {
        updateData.validada_em = new Date().toISOString();
        updateData.validada_por = admin.id;
      }

      const { error } = await supabase
        .from('experts_indications')
        .update(updateData)
        .eq('id', indicationId);

      if (error) throw error;

      await logAdminActivity(
        admin.id,
        `update_indication_status_${newStatus}`,
        'indication',
        indicationId,
        { old_status: selectedIndication?.status, new_status: newStatus, motivo }
      );

      await loadIndications();
      setShowModal(false);
      setSelectedIndication(null);

      setAlertConfig({
        title: 'Sucesso!',
        message: 'Status atualizado com sucesso!',
        type: 'success'
      });
      setShowAlert(true);
    } catch (error) {
      console.error('Error updating status:', error);
      setAlertConfig({
        title: 'Erro',
        message: 'Erro ao atualizar status. Tente novamente.',
        type: 'error'
      });
      setShowAlert(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner message="Carregando indicações..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Gerenciar Indicações
        </h2>
        <p className="text-gray-600 mt-1">
          Validar, recusar e gerenciar todas as indicações
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{indications.length}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-6">
          <p className="text-sm text-yellow-800">Aguardando</p>
          <p className="text-2xl font-bold text-yellow-900">
            {indications.filter(i => i.status === 'aguardando_validacao').length}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-6">
          <p className="text-sm text-purple-800">Em Contato</p>
          <p className="text-2xl font-bold text-purple-900">
            {indications.filter(i => i.status === 'em_contato').length}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-6">
          <p className="text-sm text-green-800">Contratou!</p>
          <p className="text-2xl font-bold text-green-900">
            {indications.filter(i => i.status === 'contratou').length}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg shadow p-6">
          <p className="text-sm text-gray-800">Perdidos</p>
          <p className="text-2xl font-bold text-gray-900">
            {indications.filter(i => i.status === 'perdido').length}
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
              placeholder="Buscar por empresa, CNPJ, contato ou expert..."
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
              <option value="aguardando_validacao">Aguardando Validação</option>
              <option value="em_contato">CorpVox em contato</option>
              <option value="contratou">Contratou!</option>
              <option value="validacao_recusada">Validação Recusada</option>
              <option value="perdido">Perdido</option>
            </select>
          </div>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={expertFilter}
              onChange={(e) => setExpertFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none bg-white"
            >
              <option value="all">Todos os experts</option>
              {uniqueExperts.map((expertName) => (
                <option key={expertName} value={expertName}>
                  {expertName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pending Indications Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
          <h2 className="text-xl font-bold text-yellow-900">
            Aguardando Validação ({pendingIndications.length})
          </h2>
        </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[25%]" />
                <col className="w-[20%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expert
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Funcionários
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingIndications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Nenhuma indicação aguardando validação
                    </td>
                  </tr>
                ) : (
                  pendingIndications.map((indication) => (
                    <tr key={indication.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {indication.empresa_nome}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatCNPJ(indication.empresa_cnpj)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {indication.expert_nome}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {indication.quantidade_funcionarios || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(indication.criado_em)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getIndicationStatusColor(indication.status)}`}>
                          {getIndicationStatusDisplay(indication.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(indication)}
                          className="text-purple-600 hover:text-purple-900"
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

      {/* Processed Indications Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Todas as Indicações ({processedIndications.length})
          </h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hideLost}
              onChange={(e) => setHideLost(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Ocultar Perdidos</span>
          </label>
        </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[25%]" />
                <col className="w-[20%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expert
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Funcionários
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedIndications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Nenhuma indicação encontrada
                    </td>
                  </tr>
                ) : (
                  processedIndications.map((indication) => (
                    <tr key={indication.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {indication.empresa_nome}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatCNPJ(indication.empresa_cnpj)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {indication.expert_nome}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {indication.quantidade_funcionarios || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(indication.criado_em)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getIndicationStatusColor(indication.status)}`}>
                          {getIndicationStatusDisplay(indication.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(indication)}
                          className="text-purple-600 hover:text-purple-900"
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

      {/* Detail Modal */}
      {showModal && selectedIndication && (
        <IndicationDetailModal
          indication={selectedIndication}
          admin={admin}
          onClose={() => {
            setShowModal(false);
            setSelectedIndication(null);
          }}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </div>
  );
}

// Detail Modal Component
interface IndicationDetailModalProps {
  indication: ExpertIndication & { expert_nome?: string };
  admin: AdminUser;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string, motivo?: string) => void;
}

function IndicationDetailModal({ indication, admin, onClose, onUpdateStatus }: IndicationDetailModalProps) {
  const [recusaMotivo, setRecusaMotivo] = useState('');
  const [newStatus, setNewStatus] = useState(indication.status);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' as 'success' | 'error' | 'warning' | 'info' });

  // Benefit data fields (shown when status = 'contratou')
  const [benefitData, setBenefitData] = useState({
    valor_beneficio: '',
    data_contrato_cliente: ''
  });

  // Load existing benefit data if indication already has a benefit
  useEffect(() => {
    const loadBenefitData = async () => {
      if (indication.status === 'contratou') {
        try {
          const { data, error } = await supabase
            .from('experts_benefits')
            .select('valor_beneficio, data_contrato_cliente')
            .eq('indication_id', indication.id)
            .single();

          if (data && !error) {
            setBenefitData({
              valor_beneficio: data.valor_beneficio?.toString() || '',
              data_contrato_cliente: data.data_contrato_cliente || ''
            });
          }
        } catch (error) {
          console.error('Error loading benefit data:', error);
        }
      }
    };

    loadBenefitData();
  }, [indication.id, indication.status]);

  // Calculate dates automatically when contract date changes
  const calculatedDates = benefitData.data_contrato_cliente
    ? calculateBenefitDates(benefitData.data_contrato_cliente)
    : null;

  const handleApprove = () => {
    setShowApproveConfirm(true);
  };

  const confirmApprove = () => {
    onUpdateStatus(indication.id, 'em_contato');
  };

  const handleReject = () => {
    if (!recusaMotivo.trim()) {
      setAlertConfig({
        title: 'Motivo obrigatório',
        message: 'Por favor, informe o motivo da recusa antes de continuar.',
        type: 'warning'
      });
      setShowAlert(true);
      return;
    }
    setShowRejectConfirm(true);
  };

  const confirmReject = () => {
    onUpdateStatus(indication.id, 'validacao_recusada', recusaMotivo);
  };

  const handleUpdateStatus = async () => {
    // Validate benefit data if status is 'contratou'
    if (newStatus === 'contratou') {
      if (!benefitData.valor_beneficio || !benefitData.data_contrato_cliente) {
        setAlertConfig({
          title: 'Campos obrigatórios',
          message: 'Por favor, preencha o valor do benefício e a data do contrato antes de continuar.',
          type: 'warning'
        });
        setShowAlert(true);
        return;
      }
    }
    setShowUpdateConfirm(true);
  };

  const confirmUpdateStatus = async () => {
    try {
      // Update indication status
      const { error: indicationError } = await supabase
        .from('experts_indications')
        .update({
          status: newStatus,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', indication.id);

      if (indicationError) throw indicationError;

      // If status is 'contratou', create benefit record
      if (newStatus === 'contratou' && calculatedDates) {
        const { error: benefitError } = await supabase
          .from('experts_benefits')
          .insert({
            expert_id: indication.expert_id,
            indication_id: indication.id,
            valor_beneficio: parseFloat(benefitData.valor_beneficio),
            data_contrato_cliente: benefitData.data_contrato_cliente,
            data_primeiro_pagamento_cliente: calculatedDates.data_primeiro_pagamento_cliente,
            pode_enviar_nf_a_partir_de: calculatedDates.pode_enviar_nf_a_partir_de,
            data_prevista_pagamento_beneficio: calculatedDates.data_prevista_pagamento_beneficio,
            status: 'aguardando_pagamento_cliente',
            nf_enviada: false,
            pagamento_realizado: false
          });

        if (benefitError) throw benefitError;
      }

      // Log activity
      await logAdminActivity(
        admin.id,
        `update_indication_status_${newStatus}`,
        'indication',
        indication.id,
        { old_status: indication.status, new_status: newStatus, benefit_data: newStatus === 'contratou' ? benefitData : null }
      );

      setShowUpdateConfirm(false);
      setAlertConfig({
        title: 'Sucesso!',
        message: newStatus === 'contratou'
          ? 'Status atualizado e benefício criado com sucesso!'
          : 'Status atualizado com sucesso!',
        type: 'success'
      });
      setShowAlert(true);

      // Wait for alert then close and reload
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error updating status:', error);
      setShowUpdateConfirm(false);
      setAlertConfig({
        title: 'Erro',
        message: 'Erro ao atualizar status. Tente novamente.',
        type: 'error'
      });
      setShowAlert(true);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Detalhes da Indicação
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getIndicationStatusColor(indication.status)}`}>
              {getIndicationStatusDisplay(indication.status)}
            </span>
            <span className="text-sm text-gray-500">
              ID: {indication.id.slice(0, 8)}...
            </span>
          </div>

          {/* Company Info */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Dados da Empresa
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Nome</p>
                <p className="text-sm font-medium text-gray-900">{indication.empresa_nome}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">CNPJ</p>
                <p className="text-sm font-medium text-gray-900">{formatCNPJ(indication.empresa_cnpj)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Quantidade de Funcionários</p>
                <p className="text-sm font-medium text-gray-900">
                  {indication.quantidade_funcionarios || 'Não informado'}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Dados do Contato
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Nome</p>
                <p className="text-sm font-medium text-gray-900">{indication.contato_nome}</p>
              </div>
              {indication.contato_email && (
                <div>
                  <p className="text-xs text-gray-500">E-mail</p>
                  <p className="text-sm font-medium text-gray-900">{indication.contato_email}</p>
                </div>
              )}
              {indication.contato_whatsapp && (
                <div>
                  <p className="text-xs text-gray-500">WhatsApp</p>
                  <p className="text-sm font-medium text-gray-900">{indication.contato_whatsapp}</p>
                </div>
              )}
            </div>
          </div>

          {/* Expert Info */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Expert Responsável
            </h4>
            <p className="text-sm font-medium text-gray-900">{indication.expert_nome}</p>
          </div>

          {/* Other Info */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Informações Adicionais</h4>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Tipo de Indicação</p>
                <p className="text-sm font-medium text-gray-900">
                  {indication.tipo_indicacao === 'relatorio_tecnico' && 'Relatório Técnico'}
                  {indication.tipo_indicacao === 'email' && 'E-mail'}
                  {indication.tipo_indicacao === 'whatsapp_conversa' && 'Conversa WhatsApp'}
                </p>
              </div>
              {indication.observacoes && (
                <div>
                  <p className="text-xs text-gray-500">Observações</p>
                  <p className="text-sm text-gray-900">{indication.observacoes}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">Data da Indicação</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(indication.criado_em)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {indication.status === 'aguardando_validacao' && (
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h4 className="font-semibold text-gray-900">Ações</h4>

              {/* Approve */}
              <button
                onClick={handleApprove}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Aprovar Indicação</span>
              </button>

              {/* Reject */}
              <div className="space-y-2">
                <textarea
                  placeholder="Motivo da recusa..."
                  value={recusaMotivo}
                  onChange={(e) => setRecusaMotivo(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <button
                  onClick={handleReject}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  <span>Recusar Indicação</span>
                </button>
              </div>
            </div>
          )}

          {/* Update Status */}
          {indication.status !== 'aguardando_validacao' && (
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h4 className="font-semibold text-gray-900">Atualizar Status</h4>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="aguardando_validacao">Aguardando Validação</option>
                <option value="em_contato">CorpVox em contato</option>
                <option value="contratou">Contratou!</option>
                <option value="validacao_recusada">Validação Recusada</option>
                <option value="perdido">Perdido</option>
              </select>

              {indication.status === 'contratou' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    ℹ️ Esta indicação já virou contrato. Gerencie o benefício na <strong>aba Benefícios</strong>.
                  </p>
                </div>
              )}

              {/* Benefit Data Fields - shown when status is 'contratou' */}
              {newStatus === 'contratou' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                  <p className="text-sm font-medium text-green-900 mb-2">
                    Dados do Benefício
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Valor do Benefício (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={benefitData.valor_beneficio}
                        onChange={(e) => setBenefitData({ ...benefitData, valor_beneficio: e.target.value })}
                        placeholder="Ex: 1500.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Data da Assinatura do Contrato *
                      </label>
                      <input
                        type="date"
                        value={benefitData.data_contrato_cliente}
                        onChange={(e) => setBenefitData({ ...benefitData, data_contrato_cliente: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>

                    {/* Calculated Dates Preview */}
                    {calculatedDates && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-medium text-blue-900">Datas Calculadas Automaticamente:</p>
                        <div className="space-y-1 text-xs text-blue-800">
                          <p>📅 Previsão de 1º pagamento do cliente: {formatDate(calculatedDates.data_primeiro_pagamento_cliente)}</p>
                          <p>📝 Previsão de liberação de emissão da NF do Expert: {formatDate(calculatedDates.pode_enviar_nf_a_partir_de)}</p>
                          <p>💰 Previsão de pagamento ao expert: {formatDate(calculatedDates.data_prevista_pagamento_beneficio)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleUpdateStatus}
                disabled={newStatus === indication.status}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-5 h-5" />
                <span>{newStatus === 'contratou' ? 'Criar Benefício' : 'Atualizar Status'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={confirmApprove}
        title="Aprovar Indicação"
        message='Deseja aprovar esta indicação e marcar como "CorpVox em contato"?'
        type="success"
        confirmText="Aprovar"
        cancelText="Cancelar"
      />

      <ConfirmationModal
        isOpen={showRejectConfirm}
        onClose={() => setShowRejectConfirm(false)}
        onConfirm={confirmReject}
        title="Recusar Indicação"
        message="Tem certeza que deseja recusar esta indicação? Esta ação não pode ser desfeita."
        type="danger"
        confirmText="Recusar"
        cancelText="Cancelar"
      />

      <ConfirmationModal
        isOpen={showUpdateConfirm}
        onClose={() => setShowUpdateConfirm(false)}
        onConfirm={confirmUpdateStatus}
        title="Atualizar Status"
        message={`Deseja atualizar o status para "${getIndicationStatusDisplay(newStatus)}"?`}
        type="warning"
        confirmText="Atualizar"
        cancelText="Cancelar"
      />

      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
}
