import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X as XIcon, DollarSign, Calendar, FileText, CheckCircle, AlertCircle, Building2, User } from 'lucide-react';
import { supabase, formatDate, formatCurrency } from '../../lib/supabase';
import { ExpertBenefit, ExpertUser } from '../../types/database.types';
import { AdminUser } from '../../types/database.types';
import { logAdminActivity } from '../../lib/adminAuth';
import ConfirmationModal from '../modals/ConfirmationModal';
import AlertModal from '../modals/AlertModal';

interface BenefitDetailModalProps {
  benefit: ExpertBenefit & { expert_nome?: string; empresa_nome?: string };
  admin: AdminUser;
  onClose: () => void;
  onUpdate: () => void;
}

export default function BenefitDetailModal({ benefit, admin, onClose, onUpdate }: BenefitDetailModalProps) {
  const [nfSignedUrl, setNfSignedUrl] = useState<string | null>(null);
  const [expertData, setExpertData] = useState<ExpertUser | null>(null);
  const [showClientPaidConfirm, setShowClientPaidConfirm] = useState(false);
  const [showMarkAsPaidConfirm, setShowMarkAsPaidConfirm] = useState(false);
  const [showApproveNFConfirm, setShowApproveNFConfirm] = useState(false);
  const [showRejectNFModal, setShowRejectNFModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info'
  });
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // Buscar dados do expert e gerar signed URL para NF
  useEffect(() => {
    const loadExpertData = async () => {
      try {
        const { data, error } = await supabase
          .from('experts_users')
          .select('*')
          .eq('id', benefit.expert_id)
          .single();

        if (error) throw error;
        setExpertData(data);
      } catch (error) {
        console.error('Error loading expert data:', error);
      }
    };

    const loadNFSignedUrl = async () => {
      if (benefit.nf_arquivo_url) {
        try {
          console.log('Gerando signed URL para:', benefit.nf_arquivo_url);

          // Chama Edge Function para gerar signed URL (usa service_role)
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          const functionUrl = `${supabaseUrl}/functions/v1/get-expert-nf-url`;

          const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filePath: benefit.nf_arquivo_url
            }),
          });

          const result = await response.json();

          if (!result.success) {
            console.error('Erro ao gerar signed URL:', result.error);
            throw new Error(result.error);
          }

          console.log('Signed URL gerada:', result.signedUrl);
          setNfSignedUrl(result.signedUrl);
        } catch (error) {
          console.error('Error generating signed URL:', error);
        }
      } else {
        console.log('benefit.nf_arquivo_url está vazio');
      }
    };

    loadExpertData();
    loadNFSignedUrl();
  }, [benefit.expert_id, benefit.nf_arquivo_url]);

  const handleClientPaid = async () => {
    try {
      const { error } = await supabase
        .from('experts_benefits')
        .update({
          status: 'liberado_para_nf',
          cliente_pagou_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        })
        .eq('id', benefit.id);

      if (error) throw error;

      await logAdminActivity(
        admin.id,
        'mark_client_paid',
        'benefit',
        benefit.id,
        { old_status: benefit.status, new_status: 'liberado_para_nf' }
      );

      setShowClientPaidConfirm(false);
      setAlertConfig({
        title: 'Sucesso!',
        message: 'Status atualizado para "Liberado para NF". O expert já pode enviar a nota fiscal.',
        type: 'success'
      });
      setShowAlert(true);

      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error updating benefit:', error);
      setShowClientPaidConfirm(false);
      setAlertConfig({
        title: 'Erro',
        message: 'Erro ao atualizar benefício. Tente novamente.',
        type: 'error'
      });
      setShowAlert(true);
    }
  };

  const handleApproveNF = async () => {
    try {
      const { error } = await supabase
        .from('experts_benefits')
        .update({
          status: 'processando_pagamento',
          atualizado_em: new Date().toISOString()
        })
        .eq('id', benefit.id);

      if (error) throw error;

      await logAdminActivity(
        admin.id,
        'approve_nf',
        'benefit',
        benefit.id,
        { nf_arquivo_url: benefit.nf_arquivo_url }
      );

      setShowApproveNFConfirm(false);
      setAlertConfig({
        title: 'Sucesso!',
        message: 'Nota fiscal aprovada! Status atualizado para Processando Pagamento.',
        type: 'success'
      });
      setShowAlert(true);

      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error approving NF:', error);
      setShowApproveNFConfirm(false);
      setAlertConfig({
        title: 'Erro',
        message: 'Erro ao aprovar nota fiscal. Tente novamente.',
        type: 'error'
      });
      setShowAlert(true);
    }
  };

  const handleRejectNF = async () => {
    if (!rejectReason.trim()) {
      setAlertConfig({
        title: 'Atenção',
        message: 'Por favor, informe o motivo da recusa.',
        type: 'warning'
      });
      setShowAlert(true);
      return;
    }

    try {
      const { error } = await supabase
        .from('experts_benefits')
        .update({
          status: 'nf_recusada',
          nf_recusa_justificativa: rejectReason,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', benefit.id);

      if (error) throw error;

      await logAdminActivity(
        admin.id,
        'reject_nf',
        'benefit',
        benefit.id,
        { reason: rejectReason, nf_arquivo_url: benefit.nf_arquivo_url }
      );

      setShowRejectNFModal(false);
      setRejectReason('');
      setAlertConfig({
        title: 'NF Recusada',
        message: 'A nota fiscal foi recusada. O expert poderá enviar uma nova.',
        type: 'success'
      });
      setShowAlert(true);

      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error rejecting NF:', error);
      setAlertConfig({
        title: 'Erro',
        message: 'Erro ao recusar nota fiscal. Tente novamente.',
        type: 'error'
      });
      setShowAlert(true);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      const { error } = await supabase
        .from('experts_benefits')
        .update({
          status: 'pago',
          pagamento_realizado: true,
          pagamento_data: paymentDate,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', benefit.id);

      if (error) throw error;

      // Update indication status
      await supabase
        .from('experts_indications')
        .update({ status: 'pago' })
        .eq('id', benefit.indication_id);

      await logAdminActivity(
        admin.id,
        'mark_benefit_paid',
        'benefit',
        benefit.id,
        { payment_date: paymentDate, valor: benefit.valor_beneficio }
      );

      setShowMarkAsPaidConfirm(false);
      setAlertConfig({
        title: 'Sucesso!',
        message: 'Benefício marcado como pago com sucesso!',
        type: 'success'
      });
      setShowAlert(true);

      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error marking as paid:', error);
      setShowMarkAsPaidConfirm(false);
      setAlertConfig({
        title: 'Erro',
        message: 'Erro ao marcar como pago. Tente novamente.',
        type: 'error'
      });
      setShowAlert(true);
    }
  };

  const getBenefitStatusColor = (status: string) => {
    switch (status) {
      case 'aguardando_pagamento_cliente':
        return 'bg-yellow-100 text-yellow-800';
      case 'liberado_para_nf':
        return 'bg-green-100 text-green-800';
      case 'aguardando_conferencia':
        return 'bg-orange-100 text-orange-800';
      case 'nf_recusada':
        return 'bg-red-100 text-red-800';
      case 'processando_pagamento':
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
      case 'aguardando_conferencia':
        return 'Conferir Nota';
      case 'nf_recusada':
        return 'NF Recusada';
      case 'processando_pagamento':
        return 'Pagamento agendado';
      case 'pago':
        return 'Pago';
      default:
        return status;
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Detalhes do Benefício
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
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getBenefitStatusColor(benefit.status)}`}>
              {getBenefitStatusDisplay(benefit.status)}
            </span>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(benefit.valor_beneficio || 0)}
              </p>
              <p className="text-xs text-gray-500">Valor do Benefício</p>
            </div>
          </div>

          {/* Expert Info */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Expert
            </h4>
            <p className="text-sm font-medium text-gray-900">{benefit.expert_nome || 'N/A'}</p>
          </div>

          {/* Company Info */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Empresa da Indicação
            </h4>
            <p className="text-sm font-medium text-gray-900">{benefit.empresa_nome || 'N/A'}</p>
          </div>

          {/* Dates */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Datas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Data do Contrato</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(benefit.data_contrato_cliente)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">1º Pagamento do Cliente</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(benefit.data_primeiro_pagamento_cliente)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Expert Pode Enviar NF</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(benefit.pode_enviar_nf_a_partir_de)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pagamento Previsto</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(benefit.data_prevista_pagamento_beneficio)}
                </p>
              </div>
              {benefit.cliente_pagou_em && (
                <div>
                  <p className="text-xs text-gray-500">Cliente Pagou em</p>
                  <p className="text-sm font-medium text-green-700">
                    {formatDate(benefit.cliente_pagou_em)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* NF Info */}
          {benefit.nf_enviada && (
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Nota Fiscal
              </h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">NF Enviada</p>
                    <p className="text-xs text-blue-700">
                      Data: {formatDate(benefit.nf_enviada_em)}
                    </p>
                    <p className="text-xs text-blue-700">
                      Valor: {formatCurrency(benefit.nf_valor || 0)}
                    </p>
                  </div>
                  {benefit.nf_arquivo_url && (
                    nfSignedUrl ? (
                      <a
                        href={nfSignedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        Visualizar NF
                      </a>
                    ) : (
                      <div className="px-4 py-2 bg-gray-300 text-gray-500 text-sm rounded-lg">
                        Carregando...
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment Info */}
          {benefit.pagamento_realizado && (
            <div className="border-t border-gray-200 pt-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-medium text-green-900">
                    Pagamento Realizado
                  </p>
                </div>
                <p className="text-xs text-green-700">
                  Data: {formatDate(benefit.pagamento_data)}
                </p>
                <p className="text-xs text-green-700">
                  Valor: {formatCurrency(benefit.valor_beneficio || 0)}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <h4 className="font-semibold text-gray-900">Ações</h4>

            {/* Client Paid Button */}
            {benefit.status === 'aguardando_pagamento_cliente' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-900 mb-1">
                      Aguardando Pagamento do Cliente
                    </p>
                    <p className="text-xs text-yellow-700">
                      Quando o cliente realizar o primeiro pagamento, marque abaixo para liberar o expert enviar a nota fiscal.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowClientPaidConfirm(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Marcar Cliente como Pago</span>
                </button>
              </div>
            )}

            {/* NF Awaiting Confirmation Buttons */}
            {benefit.status === 'aguardando_conferencia' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-900 mb-1">
                      Nota Fiscal Aguardando Conferência
                    </p>
                    <p className="text-xs text-orange-700">
                      Revise a nota fiscal enviada pelo expert. Você pode aprová-la ou recusá-la com uma justificativa.
                    </p>
                  </div>
                </div>

                {/* Dados para Conferência */}
                <div className="bg-white border border-orange-200 rounded-lg p-4 space-y-3">
                  <h5 className="font-semibold text-gray-900 text-sm">Dados para Conferência</h5>

                  {/* Descrição do Serviço */}
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Descrição do Serviço:</p>
                    <p className="text-sm text-white bg-gray-800 rounded-lg p-3">
                      Benefício técnico referente ao Programa Experts CorpVox, conforme regras internas do programa. Indicação técnica da empresa <strong>{benefit.empresa_nome || 'N/A'}.</strong>
                    </p>
                  </div>

                  {/* Dados do Expert */}
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Dados do Expert:</p>
                    {expertData ? (
                      <div className="space-y-1.5 text-sm">
                        <div>
                          <span className="text-gray-600">Razão Social:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {expertData.empresa_nome || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">CNPJ:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {expertData.empresa_cnpj || 'N/A'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Carregando dados...</p>
                    )}
                  </div>

                  {/* Dados da CorpVox */}
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Dados da CorpVox (Tomador do Serviço):</p>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-gray-600">Razão Social:</span>
                        <span className="ml-2 font-medium text-gray-900">CORPVOX TECNOLOGIA DA INFORMAÇÃO LTDA</span>
                      </div>
                      <div>
                        <span className="text-gray-600">CNPJ:</span>
                        <span className="ml-2 font-medium text-gray-900">62.970.282/0001-07</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Inscrição Municipal:</span>
                        <span className="ml-2 font-medium text-gray-900">109550</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Endereço:</span>
                        <span className="ml-2 font-medium text-gray-900">Av. Paulista, 1636, Conjunto 4, Pavimento 15</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Bairro:</span>
                        <span className="ml-2 font-medium text-gray-900">Bela Vista</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Cidade:</span>
                        <span className="ml-2 font-medium text-gray-900">São Paulo – SP</span>
                      </div>
                      <div>
                        <span className="text-gray-600">CEP:</span>
                        <span className="ml-2 font-medium text-gray-900">01310-200</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Telefone:</span>
                        <span className="ml-2 font-medium text-gray-900">(61) 992578817</span>
                      </div>
                      <div>
                        <span className="text-gray-600">E-mail:</span>
                        <span className="ml-2 font-medium text-gray-900">contato@corpvox.com.br</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botão Visualizar NF */}
                {nfSignedUrl && (
                  <a
                    href={nfSignedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white border-2 border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Visualizar Nota Fiscal</span>
                  </a>
                )}

                <div className="flex space-x-3">
                  {/* Botão Recusar */}
                  <button
                    onClick={() => setShowRejectNFModal(true)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <AlertCircle className="w-5 h-5" />
                    <span>Recusar NF</span>
                  </button>

                  {/* Botão Aprovar */}
                  <button
                    onClick={() => setShowApproveNFConfirm(true)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Aprovar NF</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mark as Paid Button */}
            {benefit.status === 'processando_pagamento' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      NF Recebida - Pronto para Pagar
                    </p>
                    <p className="text-xs text-blue-700">
                      A nota fiscal foi enviada. Após realizar o pagamento ao expert, marque abaixo.
                    </p>
                  </div>
                </div>

                {/* Dados do Expert para Pagamento */}
                {expertData && (
                  <div className="bg-white border border-blue-200 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Dados para Pagamento:</p>
                    <div className="space-y-1.5">
                      <div>
                        <p className="text-xs text-gray-500">Empresa</p>
                        <p className="text-sm font-medium text-gray-900">
                          {expertData.empresa_nome || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">CNPJ</p>
                        <p className="text-sm font-medium text-gray-900">
                          {expertData.empresa_cnpj || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Chave PIX</p>
                        <p className="text-sm font-medium text-gray-900 break-all">
                          {expertData.chave_pix_empresa || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Data do Pagamento *
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <button
                  onClick={() => setShowMarkAsPaidConfirm(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <DollarSign className="w-5 h-5" />
                  <span>Marcar como Pago</span>
                </button>
              </div>
            )}

            {/* Info for other statuses */}
            {benefit.status === 'liberado_para_nf' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900 mb-1">
                      Aguardando Nota Fiscal
                    </p>
                    <p className="text-xs text-green-700">
                      O expert já pode enviar a nota fiscal. Aguardando ação do expert.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {benefit.status === 'pago' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900 mb-1">
                      Benefício Finalizado
                    </p>
                    <p className="text-xs text-emerald-700">
                      O pagamento foi realizado ao expert. Fluxo concluído.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showClientPaidConfirm}
        onClose={() => setShowClientPaidConfirm(false)}
        onConfirm={handleClientPaid}
        title="Confirmar Pagamento do Cliente"
        message="Confirma que o cliente realizou o primeiro pagamento? Isso liberará o expert para enviar a nota fiscal."
        type="success"
        confirmText="Confirmar"
        cancelText="Cancelar"
      />

      <ConfirmationModal
        isOpen={showMarkAsPaidConfirm}
        onClose={() => setShowMarkAsPaidConfirm(false)}
        onConfirm={handleMarkAsPaid}
        title="Marcar como Pago"
        message={`Confirma o pagamento de ${formatCurrency(benefit.valor_beneficio || 0)} ao expert na data ${formatDate(paymentDate)}?`}
        type="success"
        confirmText="Confirmar Pagamento"
        cancelText="Cancelar"
      />

      <ConfirmationModal
        isOpen={showApproveNFConfirm}
        onClose={() => setShowApproveNFConfirm(false)}
        onConfirm={handleApproveNF}
        title="Aprovar Nota Fiscal"
        message="Confirma a aprovação desta nota fiscal? O status mudará para 'Processando Pagamento'."
        type="success"
        confirmText="Aprovar"
        cancelText="Cancelar"
      />

      {/* Modal de Recusa de NF */}
      {showRejectNFModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recusar Nota Fiscal</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Informe o motivo da recusa. Esta mensagem será exibida para o expert.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: CNPJ incorreto, valor divergente, data de emissão inválida..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[100px]"
                autoFocus
              />
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectNFModal(false);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRejectNF}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Confirmar Recusa
              </button>
            </div>
          </div>
        </div>
      )}

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
