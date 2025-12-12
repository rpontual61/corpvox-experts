import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, DollarSign, Calendar, Search } from 'lucide-react';
import { supabase, formatCurrency, formatDate } from '../../lib/supabase';
import LoadingSpinner from '../LoadingSpinner';

interface Benefit {
  id: string;
  expert_id: string;
  indication_id: string;
  valor_beneficio: number;
  status: string;
  nf_enviada_em: string | null;
  nf_aprovada_em: string | null;
  pagamento_agendado: boolean;
  pagamento_realizado: boolean;
  pagamento_data: string | null;
  data_prevista_pagamento_beneficio: string | null;
  criado_em: string;
  expert?: {
    nome: string;
    email: string;
  };
  indication?: {
    empresa_nome: string;
  };
}

export default function PaymentsPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'scheduled' | 'paid'>('all');

  useEffect(() => {
    loadBenefits();
  }, []);

  const loadBenefits = async () => {
    try {
      // Load benefits with approved NF (aguardando_conferencia was approved -> processando_pagamento or pago)
      const { data, error } = await supabase
        .from('experts_benefits')
        .select(`
          *,
          expert:experts!experts_benefits_expert_id_fkey(nome, email),
          indication:experts_indications!experts_benefits_indication_id_fkey(empresa_nome)
        `)
        .in('status', ['processando_pagamento', 'pago'])
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
          pagamento_agendado: true,
          data_prevista_pagamento_beneficio: scheduledDate,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', benefitId);

      if (error) throw error;

      alert('Pagamento agendado com sucesso!');
      loadBenefits();
    } catch (error) {
      console.error('Error scheduling payment:', error);
      alert('Erro ao agendar pagamento');
    }
  };

  const filteredBenefits = benefits.filter(benefit => {
    const matchesSearch =
      benefit.expert?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      benefit.indication?.empresa_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      benefit.expert?.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && benefit.status === 'processando_pagamento' && !benefit.pagamento_agendado) ||
      (statusFilter === 'scheduled' && benefit.pagamento_agendado && !benefit.pagamento_realizado) ||
      (statusFilter === 'paid' && benefit.pagamento_realizado);

    return matchesSearch && matchesStatus;
  });

  const pendingCount = benefits.filter(b => b.status === 'processando_pagamento' && !b.pagamento_agendado).length;
  const scheduledCount = benefits.filter(b => b.pagamento_agendado && !b.pagamento_realizado).length;
  const paidCount = benefits.filter(b => b.pagamento_realizado).length;
  const totalPending = benefits.filter(b => !b.pagamento_realizado).reduce((sum, b) => sum + (b.valor_beneficio || 0), 0);
  const totalPaid = benefits.filter(b => b.pagamento_realizado).reduce((sum, b) => sum + (b.valor_beneficio || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner message="Carregando pagamentos..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Pagamentos</h1>
        <p className="text-gray-600 mt-1">Gerencie os pagamentos de benefícios aos experts</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Pendentes Agendamento</p>
          <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Agendados</p>
          <p className="text-2xl font-bold text-blue-600">{scheduledCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Pagos</p>
          <p className="text-2xl font-bold text-green-600">{paidCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Pendente</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalPending)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Pago</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
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
      {pendingCount > 0 && (statusFilter === 'all' || statusFilter === 'pending') && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-orange-700">Pendentes de Agendamento ({pendingCount})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expert</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NF Aprovada Em</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBenefits
                  .filter(b => b.status === 'processando_pagamento' && !b.pagamento_agendado)
                  .map((benefit) => (
                    <tr key={benefit.id}>
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
                        {benefit.nf_aprovada_em ? formatDate(benefit.nf_aprovada_em) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <SchedulePaymentButton
                          benefitId={benefit.id}
                          onSchedule={handleSchedulePayment}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scheduled Payments */}
      {scheduledCount > 0 && (statusFilter === 'all' || statusFilter === 'scheduled') && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-blue-700">Pagamentos Agendados ({scheduledCount})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expert</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Prevista</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBenefits
                  .filter(b => b.pagamento_agendado && !b.pagamento_realizado)
                  .map((benefit) => (
                    <tr key={benefit.id}>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          Agendado
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paid Payments */}
      {paidCount > 0 && (statusFilter === 'all' || statusFilter === 'paid') && (
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
                {filteredBenefits
                  .filter(b => b.pagamento_realizado)
                  .map((benefit) => (
                    <tr key={benefit.id}>
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
                  ))}
              </tbody>
            </table>
          </div>
        </div>
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
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        Confirmar Agendamento
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
