import React, { useState, useEffect } from 'react';
import { Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase, formatDate, calculateBenefitDates } from '../../lib/supabase';
import { logAdminActivity } from '../../lib/adminAuth';
import { Database, AdminUser } from '../../types/database.types';
import { IndicationDetailModal } from '../modals/IndicationDetailModal';

type Indication = Database['public']['Tables']['experts_indications']['Row'] & {
  experts_users: {
    nome: string;
  } | null;
};

type CRMStatus = 'contato_inicial' | 'apresentacao_marcada' | 'apresentacao_feita' | 'proposta_enviada' | 'em_avaliacao' | 'negociacao' | 'contrato_enviado' | 'contrato_assinado' | 'perdido';

interface Column {
  id: CRMStatus;
  title: string;
  color: string;
}

const columns: Column[] = [
  { id: 'contato_inicial', title: 'Contato Inicial', color: 'bg-gray-50 border-gray-300' },
  { id: 'apresentacao_marcada', title: 'Apresentação Marcada', color: 'bg-gray-50 border-gray-300' },
  { id: 'apresentacao_feita', title: 'Apresentação Feita', color: 'bg-gray-50 border-gray-300' },
  { id: 'proposta_enviada', title: 'Proposta Enviada', color: 'bg-gray-50 border-gray-300' },
  { id: 'em_avaliacao', title: 'Em Avaliação', color: 'bg-gray-50 border-gray-300' },
  { id: 'negociacao', title: 'Negociação', color: 'bg-gray-50 border-gray-300' },
  { id: 'contrato_enviado', title: 'Contrato Enviado', color: 'bg-gray-50 border-gray-300' },
  { id: 'contrato_assinado', title: 'Contrato Assinado', color: 'bg-green-50 border-green-300' },
  { id: 'perdido', title: 'Perdidos', color: 'bg-red-50 border-red-400' }
];

interface CRMKanbanPageProps {
  admin: AdminUser;
}

export const CRMKanbanPage: React.FC<CRMKanbanPageProps> = ({ admin }) => {
  const [indications, setIndications] = useState<Indication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndication, setSelectedIndication] = useState<Indication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [draggedItem, setDraggedItem] = useState<Indication | null>(null);
  const [showLostConfirm, setShowLostConfirm] = useState(false);
  const [indicationToLose, setIndicationToLose] = useState<Indication | null>(null);
  const [expandedAssinado, setExpandedAssinado] = useState(false);
  const [expandedPerdido, setExpandedPerdido] = useState(false);
  const [showBenefitModal, setShowBenefitModal] = useState(false);
  const [indicationToContract, setIndicationToContract] = useState<Indication | null>(null);
  const [benefitData, setBenefitData] = useState({
    valor_beneficio: '',
    data_contrato_cliente: ''
  });

  useEffect(() => {
    loadIndications();
  }, []);

  const loadIndications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('experts_indications')
        .select(`
          *,
          experts_users (
            nome
          )
        `)
        .in('status', ['em_contato', 'contratou', 'perdido'])
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setIndications(data || []);
    } catch (error) {
      console.error('Error loading indications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, indication: Indication) => {
    setDraggedItem(indication);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: CRMStatus | null) => {
    e.preventDefault();

    if (!draggedItem || draggedItem.crm_status === targetStatus) {
      setDraggedItem(null);
      return;
    }

    // Se mover para "contrato_assinado", abrir modal para criar benefício
    if (targetStatus === 'contrato_assinado') {
      setIndicationToContract(draggedItem);
      setShowBenefitModal(true);
      setDraggedItem(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('experts_indications')
        .update({
          crm_status: targetStatus,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', draggedItem.id);

      if (error) throw error;

      await logAdminActivity(
        admin.id,
        'update_crm_status',
        'indication',
        draggedItem.id,
        {
          old_status: draggedItem.crm_status,
          new_status: targetStatus,
          empresa: draggedItem.empresa_nome
        }
      );

      await loadIndications();
    } catch (error) {
      console.error('Error updating CRM status:', error);
    } finally {
      setDraggedItem(null);
    }
  };

  const confirmCreateBenefit = async () => {
    if (!indicationToContract) return;

    if (!benefitData.valor_beneficio || !benefitData.data_contrato_cliente) {
      alert('Por favor, preencha o valor do benefício e a data do contrato.');
      return;
    }

    try {
      // Calcular datas automaticamente
      const calculatedDates = calculateBenefitDates(benefitData.data_contrato_cliente);

      // 0. Verificar se já existe um benefício para esta indicação
      const { data: existingBenefit, error: checkError } = await supabase
        .from('experts_benefits')
        .select('id')
        .eq('indication_id', indicationToContract.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingBenefit) {
        alert('Já existe um benefício criado para esta indicação. Não é possível criar duplicados.');
        return;
      }

      // 1. Atualizar status da indicação para "contratou"
      const { error: indicationError } = await supabase
        .from('experts_indications')
        .update({
          status: 'contratou',
          crm_status: 'contrato_assinado',
          atualizado_em: new Date().toISOString()
        })
        .eq('id', indicationToContract.id);

      if (indicationError) throw indicationError;

      // 2. Criar benefício
      const { error: benefitError } = await supabase
        .from('experts_benefits')
        .insert({
          expert_id: indicationToContract.expert_id,
          indication_id: indicationToContract.id,
          valor_beneficio: parseFloat(benefitData.valor_beneficio),
          data_contrato_cliente: benefitData.data_contrato_cliente,
          ...calculatedDates,
          status: 'aguardando_pagamento_cliente'
        });

      if (benefitError) throw benefitError;

      // 3. Log da atividade
      await logAdminActivity(
        admin.id,
        'create_benefit_from_crm',
        'indication',
        indicationToContract.id,
        {
          empresa: indicationToContract.empresa_nome,
          valor_beneficio: benefitData.valor_beneficio,
          data_contrato: benefitData.data_contrato_cliente
        }
      );

      // 4. Resetar e recarregar
      await loadIndications();
      setShowBenefitModal(false);
      setIndicationToContract(null);
      setBenefitData({ valor_beneficio: '', data_contrato_cliente: '' });
    } catch (error) {
      console.error('Error creating benefit:', error);
      alert('Erro ao criar benefício. Tente novamente.');
    }
  };

  const handleMarkAsLost = (indication: Indication, e: React.MouseEvent) => {
    e.stopPropagation();
    setIndicationToLose(indication);
    setShowLostConfirm(true);
  };

  const confirmMarkAsLost = async () => {
    if (!indicationToLose) return;

    try {
      const { error } = await supabase
        .from('experts_indications')
        .update({
          status: 'perdido',
          crm_status: 'perdido',
          atualizado_em: new Date().toISOString()
        })
        .eq('id', indicationToLose.id);

      if (error) throw error;

      await logAdminActivity(
        admin.id,
        'mark_indication_as_lost',
        'indication',
        indicationToLose.id,
        {
          old_status: indicationToLose.status,
          old_crm_status: indicationToLose.crm_status,
          empresa: indicationToLose.empresa_nome
        }
      );

      await loadIndications();
      setShowLostConfirm(false);
      setIndicationToLose(null);
    } catch (error) {
      console.error('Error marking as lost:', error);
    }
  };

  const getIndicationsByStatus = (status: CRMStatus | null) => {
    return indications.filter(ind => ind.crm_status === status);
  };

  const handleCardClick = (indication: Indication) => {
    setSelectedIndication(indication);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CRM - Pipeline de Vendas</h1>
        <p className="mt-1 text-sm text-gray-600">
          Gerencie o pipeline de vendas das indicações em contato
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total em Pipeline</p>
          <p className="text-2xl font-bold text-gray-900">{indications.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Fazer contato</p>
          <p className="text-2xl font-bold text-yellow-600">{getIndicationsByStatus(null).length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Perdidos</p>
          <p className="text-2xl font-bold text-red-600">{getIndicationsByStatus('perdido').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Contratos Assinados</p>
          <p className="text-2xl font-bold text-green-600">{getIndicationsByStatus('contrato_assinado').length}</p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4" style={{ height: 'calc(100vh - 350px)' }}>
        <div className="inline-flex gap-4 min-w-full h-full">
          {/* Column for indications without CRM status */}
          <div
            className="flex-shrink-0 w-80 h-full"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, null)}
          >
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Fazer contato</h3>
                <span className="bg-white text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {getIndicationsByStatus(null).length}
                </span>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto">
                {getIndicationsByStatus(null).map(indication => (
                  <div
                    key={indication.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, indication)}
                    onClick={() => handleCardClick(indication)}
                    className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-move group relative"
                  >
                    <button
                      onClick={(e) => handleMarkAsLost(indication, e)}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Marcar como perdido"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <h4 className="font-medium text-gray-900 text-sm mb-1 pr-6">{indication.empresa_nome}</h4>
                    <p className="text-xs text-gray-600 mb-2">Expert: {indication.experts_users?.nome || '-'}</p>
                    <p className="text-xs text-gray-500">
                      Contato: {indication.contato_nome}
                    </p>
                    {indication.quantidade_funcionarios && (
                      <p className="text-xs text-gray-500 mt-1">
                        👥 {indication.quantidade_funcionarios} funcionários
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Regular columns (excluding last two) */}
          {columns.slice(0, 7).map(column => (
            <div
              key={column.id}
              className="flex-shrink-0 w-80 h-full"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={`${column.color} border-2 rounded-lg p-4 h-full flex flex-col`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <span className="bg-white text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {getIndicationsByStatus(column.id).length}
                  </span>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {getIndicationsByStatus(column.id).map(indication => (
                    <div
                      key={indication.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, indication)}
                      onClick={() => handleCardClick(indication)}
                      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-move group relative"
                    >
                      <button
                        onClick={(e) => handleMarkAsLost(indication, e)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Marcar como perdido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <h4 className="font-medium text-gray-900 text-sm mb-1 pr-6">{indication.empresa_nome}</h4>
                      <p className="text-xs text-gray-600 mb-2">Expert: {indication.experts_users?.nome || '-'}</p>
                      <p className="text-xs text-gray-500">
                        Contato: {indication.contato_nome}
                      </p>
                      {indication.quantidade_funcionarios && (
                        <p className="text-xs text-gray-500 mt-1">
                          👥 {indication.quantidade_funcionarios} funcionários
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Contrato Assinado Column - Collapsible */}
          <div className={`flex-shrink-0 h-full transition-all ${expandedAssinado ? 'w-80' : 'w-16'}`}>
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 h-full relative flex flex-col">
              {!expandedAssinado ? (
                <button
                  onClick={() => setExpandedAssinado(true)}
                  className="absolute inset-0 flex flex-col items-center justify-center hover:bg-green-100 transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-green-700" />
                  <span className="text-xs font-semibold text-green-700 mt-2" style={{ writingMode: 'vertical-rl' }}>
                    Contrato Assinado ({getIndicationsByStatus('contrato_assinado').length})
                  </span>
                </button>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Contrato Assinado</h3>
                    <div className="flex items-center gap-2">
                      <span className="bg-white text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {getIndicationsByStatus('contrato_assinado').length}
                      </span>
                      <button
                        onClick={() => setExpandedAssinado(false)}
                        className="p-1 hover:bg-green-100 rounded transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-green-700" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'contrato_assinado')}>
                    {getIndicationsByStatus('contrato_assinado').map(indication => (
                      <div
                        key={indication.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, indication)}
                        onClick={() => handleCardClick(indication)}
                        className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-move"
                      >
                        <h4 className="font-medium text-gray-900 text-sm mb-1">{indication.empresa_nome}</h4>
                        <p className="text-xs text-gray-600 mb-2">Expert: {indication.experts_users?.nome || '-'}</p>
                        <p className="text-xs text-gray-500">
                          Contato: {indication.contato_nome}
                        </p>
                        {indication.quantidade_funcionarios && (
                          <p className="text-xs text-gray-500 mt-1">
                            👥 {indication.quantidade_funcionarios} funcionários
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Perdidos Column - Collapsible */}
          <div className={`flex-shrink-0 h-full transition-all ${expandedPerdido ? 'w-80' : 'w-16'}`}>
            <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 h-full relative flex flex-col">
              {!expandedPerdido ? (
                <button
                  onClick={() => setExpandedPerdido(true)}
                  className="absolute inset-0 flex flex-col items-center justify-center hover:bg-red-100 transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-red-700" />
                  <span className="text-xs font-semibold text-red-700 mt-2" style={{ writingMode: 'vertical-rl' }}>
                    Perdidos ({getIndicationsByStatus('perdido').length})
                  </span>
                </button>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Perdidos</h3>
                    <div className="flex items-center gap-2">
                      <span className="bg-white text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {getIndicationsByStatus('perdido').length}
                      </span>
                      <button
                        onClick={() => setExpandedPerdido(false)}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-red-700" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'perdido')}>
                    {getIndicationsByStatus('perdido').map(indication => (
                      <div
                        key={indication.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, indication)}
                        onClick={() => handleCardClick(indication)}
                        className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-move"
                      >
                        <h4 className="font-medium text-gray-900 text-sm mb-1">{indication.empresa_nome}</h4>
                        <p className="text-xs text-gray-600 mb-2">Expert: {indication.experts_users?.nome || '-'}</p>
                        <p className="text-xs text-gray-500">
                          Contato: {indication.contato_nome}
                        </p>
                        {indication.quantidade_funcionarios && (
                          <p className="text-xs text-gray-500 mt-1">
                            👥 {indication.quantidade_funcionarios} funcionários
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lost Confirmation Modal */}
      {showLostConfirm && indicationToLose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Marcar como Perdido?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Tem certeza que deseja marcar a indicação <strong>{indicationToLose.empresa_nome}</strong> como perdida?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLostConfirm(false);
                  setIndicationToLose(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmMarkAsLost}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Benefit Creation Modal */}
      {showBenefitModal && indicationToContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Criar Benefício</h3>
            <p className="text-sm text-gray-600 mb-4">
              Indicação: <strong>{indicationToContract.empresa_nome}</strong>
            </p>

            <div className="space-y-4">
              {/* Valor do Benefício */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor do Benefício (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={benefitData.valor_beneficio}
                  onChange={(e) => setBenefitData({ ...benefitData, valor_beneficio: e.target.value })}
                  placeholder="Ex: 1500.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Data do Contrato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data da Assinatura do Contrato *
                </label>
                <input
                  type="date"
                  value={benefitData.data_contrato_cliente}
                  onChange={(e) => setBenefitData({ ...benefitData, data_contrato_cliente: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Preview das datas calculadas */}
              {benefitData.data_contrato_cliente && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-blue-900">Datas Calculadas Automaticamente:</p>
                  <div className="space-y-1 text-xs text-blue-800">
                    <p>📅 Previsão de 1º pagamento do cliente: {formatDate(calculateBenefitDates(benefitData.data_contrato_cliente).data_primeiro_pagamento_cliente)}</p>
                    <p>📝 Previsão de liberação de emissão da NF do Expert: {formatDate(calculateBenefitDates(benefitData.data_contrato_cliente).pode_enviar_nf_a_partir_de)}</p>
                    <p>💰 Previsão de pagamento ao expert: {formatDate(calculateBenefitDates(benefitData.data_contrato_cliente).data_prevista_pagamento_beneficio)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBenefitModal(false);
                  setIndicationToContract(null);
                  setBenefitData({ valor_beneficio: '', data_contrato_cliente: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmCreateBenefit}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirmar e Criar Benefício
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <IndicationDetailModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedIndication(null);
        }}
        onUpdate={loadIndications}
        indication={selectedIndication || {
          id: '',
          empresa_nome: '',
          empresa_cnpj: '',
          contato_nome: '',
          contato_email: null,
          contato_whatsapp: null,
          status: '',
          tipo_indicacao: null,
          observacoes: null,
          criado_em: '',
          motivo_recusa: null,
        }}
      />
    </div>
  );
};
