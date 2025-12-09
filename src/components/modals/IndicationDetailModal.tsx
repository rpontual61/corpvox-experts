import { useState } from 'react';
import { X, Building2, User, Mail, Phone, FileText, Calendar, AlertCircle, Edit2, Save } from 'lucide-react';
import { getIndicationStatusColor, getIndicationStatusDisplay, supabase } from '../../lib/supabase';

interface IndicationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  indication: {
    id: string;
    empresa_nome: string;
    empresa_cnpj: string;
    contato_nome: string;
    contato_email: string | null;
    contato_whatsapp: string | null;
    status: string;
    tipo_indicacao: string | null;
    observacoes: string | null;
    criado_em: string;
    motivo_recusa: string | null;
  };
}

export function IndicationDetailModal({ isOpen, onClose, onUpdate, indication }: IndicationDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    empresa_nome: indication.empresa_nome,
    empresa_cnpj: indication.empresa_cnpj,
    contato_nome: indication.contato_nome,
    contato_email: indication.contato_email || '',
    contato_whatsapp: indication.contato_whatsapp || '',
    tipo_indicacao: indication.tipo_indicacao || 'relatorio_tecnico',
  });

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('experts_indications')
        .update({
          empresa_nome: formData.empresa_nome,
          empresa_cnpj: formData.empresa_cnpj,
          contato_nome: formData.contato_nome,
          contato_email: formData.contato_email || null,
          contato_whatsapp: formData.contato_whatsapp || null,
          tipo_indicacao: formData.tipo_indicacao,
        })
        .eq('id', indication.id);

      if (error) throw error;

      setIsEditing(false);
      if (onUpdate) onUpdate();
      alert('Indicação atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating indication:', error);
      alert('Erro ao atualizar indicação. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      empresa_nome: indication.empresa_nome,
      empresa_cnpj: indication.empresa_cnpj,
      contato_nome: indication.contato_nome,
      contato_email: indication.contato_email || '',
      contato_whatsapp: indication.contato_whatsapp || '',
      tipo_indicacao: indication.tipo_indicacao || 'relatorio_tecnico',
    });
    setIsEditing(false);
  };

  const getIndicationTypeDisplay = (type: string | null) => {
    switch (type) {
      case 'relatorio_tecnico':
        return 'Relatório Técnico';
      case 'email':
        return 'E-mail';
      case 'whatsapp_conversa':
        return 'Conversa WhatsApp';
      default:
        return 'Não informado';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-text-primary">
              {isEditing ? 'Editar Indicação' : 'Detalhes da Indicação'}
            </h2>
            <div className="flex items-center space-x-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-5 h-5 text-primary-600" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status destacado */}
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted mb-1">Status atual</p>
                  <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium ${getIndicationStatusColor(indication.status)}`}>
                    {getIndicationStatusDisplay(indication.status)}
                  </span>
                </div>
                <Calendar className="w-8 h-8 text-primary-600" />
              </div>
              {indication.motivo_recusa && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-red-900 mb-1">Motivo da recusa:</p>
                      <p className="text-sm text-red-800">{indication.motivo_recusa}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Informações da Empresa */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Building2 className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-text-primary">Empresa</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-text-muted mb-1">Razão Social</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.empresa_nome}
                      onChange={(e) => setFormData({ ...formData, empresa_nome: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-text-primary">{indication.empresa_nome}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">CNPJ</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.empresa_cnpj}
                      onChange={(e) => setFormData({ ...formData, empresa_cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-text-primary">{indication.empresa_cnpj}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Informações do Contato */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <User className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-text-primary">Contato</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-text-muted mb-1">Nome</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.contato_nome}
                      onChange={(e) => setFormData({ ...formData, contato_nome: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-text-primary">{indication.contato_nome}</p>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Mail className="w-4 h-4 text-text-muted" />
                    <p className="text-xs text-text-muted">E-mail</p>
                  </div>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.contato_email}
                      onChange={(e) => setFormData({ ...formData, contato_email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <p className="text-sm text-text-primary">{indication.contato_email || 'Não informado'}</p>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Phone className="w-4 h-4 text-text-muted" />
                    <p className="text-xs text-text-muted">WhatsApp</p>
                  </div>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.contato_whatsapp}
                      onChange={(e) => setFormData({ ...formData, contato_whatsapp: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <p className="text-sm text-text-primary">{indication.contato_whatsapp || 'Não informado'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tipo de Indicação */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-text-primary">Tipo de Indicação</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                {isEditing ? (
                  <select
                    value={formData.tipo_indicacao}
                    onChange={(e) => setFormData({ ...formData, tipo_indicacao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="relatorio_tecnico">Relatório Técnico</option>
                    <option value="email">E-mail</option>
                    <option value="whatsapp_conversa">Conversa WhatsApp</option>
                  </select>
                ) : (
                  <p className="text-sm text-text-primary">{getIndicationTypeDisplay(indication.tipo_indicacao)}</p>
                )}
              </div>
            </div>

            {/* Observações */}
            {indication.observacoes && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <FileText className="w-5 h-5 text-primary-600" />
                  <h3 className="font-semibold text-text-primary">Observações</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-text-primary whitespace-pre-wrap">{indication.observacoes}</p>
                </div>
              </div>
            )}

            {/* Data de Cadastro */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-text-primary">Data de Cadastro</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-text-primary">
                  {new Date(indication.criado_em).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            {isEditing ? (
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
