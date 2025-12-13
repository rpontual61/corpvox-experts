import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, DollarSign, Calendar, Search, AlertCircle } from 'lucide-react';
import { supabase, formatCurrency, formatDate } from '../../lib/supabase';
import LoadingSpinner from '../LoadingSpinner';
import BenefitDetailModal from './BenefitDetailModal';
import { ExpertBenefit } from '../../types/database.types';
import { AdminUser } from '../../types/database.types';

interface PaymentsPageProps {
  admin: AdminUser;
}

type BenefitWithRelations = ExpertBenefit & {
  expert?: {
    nome: string;
    email: string;
  };
  indication?: {
    empresa_nome: string;
  };
  expert_nome?: string;
  empresa_nome?: string;
};

export default function PaymentsPage({ admin }: PaymentsPageProps) {
  console.log('PaymentsPage renderizando...');
  const [benefits, setBenefits] = useState<BenefitWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'scheduled' | 'paid'>('all');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [benefitToConfirm, setBenefitToConfirm] = useState<string | null>(null);
  const [selectedBenefit, setSelectedBenefit] = useState<BenefitWithRelations | null>(null);

  console.log('selectedBenefit atual:', selectedBenefit?.id);

  useEffect(() => {
    loadBenefits();
  }, []);

  const loadBenefits = async () => {
    try {
      // Load benefits with approved NF (processando_pagamento, agendado, or pago)
      const { data, error } = await supabase
        .from('experts_benefits')
        .select(`
          *,
          expert:experts_users!experts_benefits_expert_id_fkey(nome, email),
          indication:experts_indications!experts_benefits_indication_id_fkey(empresa_nome)
        `)
        .in('status', ['processando_pagamento', 'agendado', 'pago'])
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setBenefits(data || []);
    } catch (error) {
      console.error('Error loading benefits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedulePayment = async (benefitId: string, scheduledDate: string) => {
    try {
      const { error } = await supabase
        .from('experts_benefits')
        .update({
          status: 'agendado',
          data_prevista_pagamento_beneficio: scheduledDate,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', benefitId);

      if (error) throw error;

      setSuccessMessage('Pagamento agendado com sucesso!');
      setShowSuccessModal(true);
      loadBenefits();
    } catch (error) {
      console.error('Error scheduling payment:', error);
      setSuccessMessage('Erro ao agendar pagamento');
      setShowSuccessModal(true);
    }
  };

  const handleConfirmPayment = async () => {
    if (!benefitToConfirm) return;

    try {
      const { error } = await supabase
        .from('experts_benefits')
        .update({
          status: 'pago',
          pagamento_data: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        })
        .eq('id', benefitToConfirm);

      if (error) throw error;

      setSuccessMessage('Pagamento confirmado com sucesso!');
      setShowSuccessModal(true);
      setShowConfirmModal(false);
      setBenefitToConfirm(null);
      loadBenefits();
    } catch (error) {
      console.error('Error confirming payment:', error);
      setSuccessMessage('Erro ao confirmar pagamento');
      setShowSuccessModal(true);
      setShowConfirmModal(false);
      setBenefitToConfirm(null);
    }
  };

  const handleBenefitClick = (benefit: BenefitWithRelations) => {
    console.log('Clicou no benefício:', benefit.id);
    // Add flattened fields for modal compatibility
    const benefitWithFlatFields = {
      ...benefit,
      expert_nome: benefit.expert?.nome,
      empresa_nome: benefit.indication?.empresa_nome
    };
    console.log('Setando selectedBenefit...');
    setSelectedBenefit(benefitWithFlatFields);
  };

  const handleCloseDetailModal = () => {
    setSelectedBenefit(null);
    loadBenefits(); // Reload to get updated data
  };

  const filteredBenefits = benefits.filter(benefit => {
    const matchesSearch =
      benefit.expert?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      benefit.indication?.empresa_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      benefit.expert?.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && benefit.status === 'processando_pagamento') ||
      (statusFilter === 'scheduled' && benefit.status === 'agendado') ||
      (statusFilter === 'paid' && benefit.status === 'pago');

    return matchesSearch && matchesStatus;
  });

  const pendingBenefits = benefits.filter(b => b.status === 'processando_pagamento');
  const scheduledBenefits = benefits.filter(b => b.status === 'agendado');
  const paidBenefits = benefits.filter(b => b.status === 'pago');

  const pendingCount = pendingBenefits.length;
  const scheduledCount = scheduledBenefits.length;
  const paidCount = paidBenefits.length;

  const totalPending = pendingBenefits.reduce((sum, b) => sum + (b.valor_beneficio || 0), 0);
  const totalScheduled = scheduledBenefits.reduce((sum, b) => sum + (b.valor_beneficio || 0), 0);
  const totalPaid = paidBenefits.reduce((sum, b) => sum + (b.valor_beneficio || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner message="Carregando pagamentos..." />
      </div>
    );
  }

  console.log('ANTES DO RETURN PRINCIPAL. selectedBenefit:', selectedBenefit?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Pagamentos</h1>
        <p className="text-gray-600 mt-1">Gerencie os pagamentos de benefícios aos experts</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Total Pendente</p>
          <p className="text-3xl font-bold text-gray-600 mb-1">{formatCurrency(totalPending)}</p>
          <p className="text-sm text-gray-500">{pendingCount} {pendingCount === 1 ? 'benefício' : 'benefícios'}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Total Agendado</p>
          <p className="text-3xl font-bold text-orange-600 mb-1">{formatCurrency(totalScheduled)}</p>
          <p className="text-sm text-gray-500">{scheduledCount} {scheduledCount === 1 ? 'benefício' : 'benefícios'}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Total Pago</p>
          <p className="text-3xl font-bold text-green-600 mb-1">{formatCurrency(totalPaid)}</p>
          <p className="text-sm text-gray-500">{paidCount} {paidCount === 1 ? 'benefício' : 'benefícios'}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por expert ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendentes Agendamento</option>
            <option value="scheduled">Agendados</option>
            <option value="paid">Pagos</option>
          </select>
        </div>
      </div>

      {/* Pending Scheduling */}
      {(statusFilter === 'all' || statusFilter === 'pending') && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700">Pendentes de Agendamento ({pendingCount})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expert</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NF Enviada Em</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBenefits.filter(b => b.status === 'processando_pagamento').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                      Nenhum benefício pendente de agendamento
                    </td>
                  </tr>
                ) : (
                  filteredBenefits
                    .filter(b => b.status === 'processando_pagamento')
                    .map((benefit) => (
                      <tr
                        key={benefit.id}
                        onClick={() => handleBenefitClick(benefit)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{benefit.expert?.nome}</div>
                            <div className="text-sm text-gray-500">{benefit.expert?.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {benefit.indication?.empresa_nome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(benefit.valor_beneficio || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {benefit.nf_enviada_em ? formatDate(benefit.nf_enviada_em) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                          <SchedulePaymentButton
                            benefitId={benefit.id}
                            onSchedule={handleSchedulePayment}
                          />
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scheduled Payments */}
      {(statusFilter === 'all' || statusFilter === 'scheduled') && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-orange-700">Pagamentos Agendados ({scheduledCount})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expert</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Prevista</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBenefits.filter(b => b.status === 'agendado').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                      Nenhum pagamento agendado
                    </td>
                  </tr>
                ) : (
                  filteredBenefits
                    .filter(b => b.status === 'agendado')
                    .map((benefit) => (
                      <tr
                        key={benefit.id}
                        onClick={() => handleBenefitClick(benefit)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{benefit.expert?.nome}</div>
                            <div className="text-sm text-gray-500">{benefit.expert?.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {benefit.indication?.empresa_nome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(benefit.valor_beneficio || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {benefit.data_prevista_pagamento_beneficio ? formatDate(benefit.data_prevista_pagamento_beneficio) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setBenefitToConfirm(benefit.id);
                              setShowConfirmModal(true);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Confirmar Pagamento
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paid Payments */}
      {(statusFilter === 'all' || statusFilter === 'paid') && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-green-700">Pagamentos Realizados ({paidCount})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expert</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Pagamento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBenefits.filter(b => b.status === 'pago').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                      Nenhum pagamento realizado
                    </td>
                  </tr>
                ) : (
                  filteredBenefits
                    .filter(b => b.status === 'pago')
                    .map((benefit) => (
                      <tr
                        key={benefit.id}
                        onClick={() => handleBenefitClick(benefit)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{benefit.expert?.nome}</div>
                            <div className="text-sm text-gray-500">{benefit.expert?.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {benefit.indication?.empresa_nome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(benefit.valor_beneficio || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {benefit.pagamento_data ? formatDate(benefit.pagamento_data) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center space-x-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Pago</span>
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Payment Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-orange-100">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Confirmar Pagamento</h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              Tem certeza que deseja confirmar que o pagamento foi realizado?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setBenefitToConfirm(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPayment}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-green-100">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Sucesso!</h3>
            <p className="text-sm text-gray-600 text-center mb-6">{successMessage}</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Benefit Detail Modal */}
      {selectedBenefit && (
        <BenefitDetailModal
          benefit={selectedBenefit}
          admin={admin}
          onClose={handleCloseDetailModal}
          onUpdate={loadBenefits}
        />
      )}
    </div>
  );
}

// Schedule Payment Button Component
function SchedulePaymentButton({ benefitId, onSchedule }: { benefitId: string; onSchedule: (id: string, date: string) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate) {
      alert('Selecione uma data');
      return;
    }
    onSchedule(benefitId, scheduledDate);
    setShowModal(false);
    setScheduledDate('');
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
      >
        Agendar Pagamento
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agendar Pagamento</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Prevista para Pagamento
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
