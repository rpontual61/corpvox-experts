import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X as XIcon, Save, Edit2, DollarSign, CheckCircle } from 'lucide-react';
import { supabase, formatDate, formatPhone, formatCurrency } from '../../lib/supabase';
import { ExpertUser } from '../../types/database.types';
import AlertModal from '../modals/AlertModal';

interface ExpertDetailModalProps {
  expert: ExpertUser;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ExpertDetailModal({ expert, onClose, onUpdate }: ExpertDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nome: expert.nome || '',
    email: expert.email || '',
    cpf: expert.cpf || '',
    telefone_whatsapp: expert.telefone_whatsapp || '',
    chave_pix_empresa: expert.chave_pix_empresa || '',
    empresa_nome: expert.empresa_nome || '',
    empresa_cnpj: expert.empresa_cnpj || '',
    status: expert.status || 'pendente',
    curso_concluido: expert.curso_concluido || false,
    pode_emitir_nf: expert.pode_emitir_nf || false,
    possui_vinculo_clt: expert.possui_vinculo_clt || false,
    detalhes_vinculo_clt: expert.detalhes_vinculo_clt || '',
  });
  const [saving, setSaving] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'warning' | 'info'
  });
  const [benefitsStats, setBenefitsStats] = useState({
    totalBenefits: 0,
    totalPaid: 0
  });

  useEffect(() => {
    loadBenefitsStats();
  }, [expert.id]);

  const loadBenefitsStats = async () => {
    try {
      // Buscar todos os benefícios do expert
      const { data: benefits, error } = await supabase
        .from('experts_benefits')
        .select('valor_beneficio, status')
        .eq('expert_id', expert.id);

      if (error) throw error;

      const total = benefits?.reduce((sum, b) => sum + (b.valor_beneficio || 0), 0) || 0;
      const paid = benefits?.filter(b => b.status === 'pago').reduce((sum, b) => sum + (b.valor_beneficio || 0), 0) || 0;

      setBenefitsStats({
        totalBenefits: total,
        totalPaid: paid
      });
    } catch (error) {
      console.error('Error loading benefits stats:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('experts_users')
        .update({
          nome: formData.nome,
          email: formData.email,
          cpf: formData.cpf || null,
          telefone_whatsapp: formData.telefone_whatsapp || null,
          chave_pix_empresa: formData.chave_pix_empresa || null,
          empresa_nome: formData.empresa_nome || null,
          empresa_cnpj: formData.empresa_cnpj || null,
          status: formData.status,
          curso_concluido: formData.curso_concluido,
          pode_emitir_nf: formData.pode_emitir_nf,
          possui_vinculo_clt: formData.possui_vinculo_clt,
          detalhes_vinculo_clt: formData.detalhes_vinculo_clt || null,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', expert.id);

      if (error) throw error;

      setAlertConfig({
        title: 'Sucesso!',
        message: 'Dados do expert atualizados com sucesso!',
        type: 'success'
      });
      setShowAlert(true);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating expert:', error);
      setAlertConfig({
        title: 'Erro',
        message: 'Erro ao atualizar dados do expert. Tente novamente.',
        type: 'error'
      });
      setShowAlert(true);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nome: expert.nome || '',
      email: expert.email || '',
      cpf: expert.cpf || '',
      telefone_whatsapp: expert.telefone_whatsapp || '',
      chave_pix_empresa: expert.chave_pix_empresa || '',
      empresa_nome: expert.empresa_nome || '',
      empresa_cnpj: expert.empresa_cnpj || '',
      status: expert.status || 'pendente',
      curso_concluido: expert.curso_concluido || false,
      pode_emitir_nf: expert.pode_emitir_nf || false,
      possui_vinculo_clt: expert.possui_vinculo_clt || false,
      detalhes_vinculo_clt: expert.detalhes_vinculo_clt || '',
    });
    setIsEditing(false);
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Detalhes do Expert
          </h3>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>Editar</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Benefits Stats */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-4 flex items-center space-x-3">
              <div className="bg-purple-100 rounded-full p-3">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total em Benefícios</p>
                <p className="text-xl font-bold text-purple-900">{formatCurrency(benefitsStats.totalBenefits)}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 flex items-center space-x-3">
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Já Pago</p>
                <p className="text-xl font-bold text-green-900">{formatCurrency(benefitsStats.totalPaid)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Informações Pessoais</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nome Completo</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">{expert.nome}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">E-mail</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">{expert.email}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">CPF</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="000.000.000-00"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">{expert.cpf || 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Telefone/WhatsApp</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.telefone_whatsapp}
                    onChange={(e) => setFormData({ ...formData, telefone_whatsapp: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="(00) 00000-0000"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">
                    {expert.telefone_whatsapp ? formatPhone(expert.telefone_whatsapp) : 'Não informado'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Informações da Empresa</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Razão Social</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.empresa_nome}
                    onChange={(e) => setFormData({ ...formData, empresa_nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">{expert.empresa_nome || 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">CNPJ da Empresa</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.empresa_cnpj}
                    onChange={(e) => setFormData({ ...formData, empresa_cnpj: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="00.000.000/0000-00"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">{expert.empresa_cnpj || 'Não informado'}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Chave PIX da Empresa</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.chave_pix_empresa}
                    onChange={(e) => setFormData({ ...formData, chave_pix_empresa: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">{expert.chave_pix_empresa || 'Não informado'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Status and Course */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Status e Curso</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Status</label>
                {isEditing ? (
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="reprovado">Reprovado</option>
                  </select>
                ) : (
                  <p className="text-sm font-medium text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      expert.status === 'aprovado' ? 'bg-green-100 text-green-800' :
                      expert.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                      expert.status === 'reprovado' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {expert.status === 'aprovado' ? 'Aprovado' :
                       expert.status === 'pendente' ? 'Pendente' :
                       expert.status === 'reprovado' ? 'Reprovado' : expert.status}
                    </span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Curso Concluído</label>
                {isEditing ? (
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.curso_concluido}
                      onChange={(e) => setFormData({ ...formData, curso_concluido: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-900">Sim</span>
                  </label>
                ) : (
                  <p className="text-sm font-medium text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      expert.curso_concluido ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {expert.curso_concluido ? 'Sim' : 'Não'}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* NF and CLT Information */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Informações Fiscais e Trabalhistas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Pode Emitir NF</label>
                {isEditing ? (
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.pode_emitir_nf}
                      onChange={(e) => setFormData({ ...formData, pode_emitir_nf: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-900">Sim</span>
                  </label>
                ) : (
                  <p className="text-sm font-medium text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      expert.pode_emitir_nf ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {expert.pode_emitir_nf ? 'Sim' : 'Não'}
                    </span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Possui Vínculo CLT</label>
                {isEditing ? (
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.possui_vinculo_clt}
                      onChange={(e) => setFormData({ ...formData, possui_vinculo_clt: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-900">Sim</span>
                  </label>
                ) : (
                  <p className="text-sm font-medium text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      expert.possui_vinculo_clt ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {expert.possui_vinculo_clt ? 'Sim' : 'Não'}
                    </span>
                  </p>
                )}
              </div>
              {(formData.possui_vinculo_clt || expert.detalhes_vinculo_clt) && (
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Detalhes do Vínculo CLT</label>
                  {isEditing ? (
                    <textarea
                      value={formData.detalhes_vinculo_clt}
                      onChange={(e) => setFormData({ ...formData, detalhes_vinculo_clt: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Descreva os detalhes do vínculo CLT..."
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{expert.detalhes_vinculo_clt || 'Não informado'}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Terms and Dates */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Termos e Datas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Termo de Adesão Aceito</label>
                <p className="text-sm font-medium text-gray-900">
                  {expert.aceitou_termo_adesao_em ? formatDate(expert.aceitou_termo_adesao_em) : 'Não aceito'}
                </p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Política de Uso Aceita</label>
                <p className="text-sm font-medium text-gray-900">
                  {expert.aceitou_politica_uso_em ? formatDate(expert.aceitou_politica_uso_em) : 'Não aceita'}
                </p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data de Cadastro</label>
                <p className="text-sm font-medium text-gray-900">{formatDate(expert.criado_em)}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Última Atualização</label>
                <p className="text-sm font-medium text-gray-900">
                  {expert.atualizado_em ? formatDate(expert.atualizado_em) : 'Nunca atualizado'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="border-t border-gray-200 pt-6 flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

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

  return createPortal(modalContent, document.body);
}
