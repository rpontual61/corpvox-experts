import { useState, useEffect } from 'react';
import { Save, User, Building2, CreditCard, FileCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ExpertUser } from '../../types/database.types';
import { supabase, getClientIP } from '../../lib/supabase';
import { DocumentModal } from '../modals/DocumentModal';
import { PolicyContent, TermoAdesaoContent } from './PolicyContent';

interface MyDataPageProps {
  expert: ExpertUser;
  onUpdate: () => void;
}

export default function MyDataPage({ expert, onUpdate }: MyDataPageProps) {
  const [formData, setFormData] = useState({
    nome: expert.nome,
    telefone_whatsapp: expert.telefone_whatsapp || '',
    empresa_nome: expert.empresa_nome || '',
    empresa_cnpj: expert.empresa_cnpj || '',
    chave_pix_empresa: expert.chave_pix_empresa || '',
    tipo_chave_pix: expert.tipo_chave_pix || 'cnpj',
  });
  const [termsAccepted, setTermsAccepted] = useState({
    termo_adesao: !!expert.aceitou_termo_adesao_em,
    politica_uso: !!expert.aceitou_politica_uso_em,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState<'termo' | 'politica' | null>(null);

  const handleSaveData = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('experts_users')
        .update({
          nome: formData.nome,
          telefone_whatsapp: formData.telefone_whatsapp,
          empresa_nome: formData.empresa_nome,
          empresa_cnpj: formData.empresa_cnpj.replace(/\D/g, ''),
          chave_pix_empresa: formData.chave_pix_empresa,
          tipo_chave_pix: formData.tipo_chave_pix as any,
        })
        .eq('id', expert.id);

      if (updateError) throw updateError;

      setSuccess('Dados atualizados com sucesso!');
      onUpdate();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao atualizar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTerms = async () => {
    if (!termsAccepted.termo_adesao || !termsAccepted.politica_uso) {
      setError('Você precisa aceitar ambos os termos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const ip = await getClientIP();
      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('experts_users')
        .update({
          aceitou_termo_adesao_em: now,
          aceitou_termo_adesao_ip: ip,
          aceitou_politica_uso_em: now,
          aceitou_politica_uso_ip: ip,
        })
        .eq('id', expert.id);

      if (updateError) throw updateError;

      setSuccess('Termos aceitos com sucesso!');
      onUpdate();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao aceitar termos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary">
          Meus Dados
        </h2>
        <p className="text-text-secondary mt-1">
          Gerencie suas informações e configurações
        </p>
      </div>

      {/* Personal Data */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">
            Dados Pessoais
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              E-mail (não editável)
            </label>
            <input
              type="email"
              value={expert.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-text-muted"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              WhatsApp
            </label>
            <input
              type="tel"
              value={formData.telefone_whatsapp}
              onChange={(e) => setFormData({ ...formData, telefone_whatsapp: e.target.value })}
              placeholder="(11) 99999-9999"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Company Data */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">
            Dados da Empresa que emitirá as notas fiscais
          </h3>
        </div>

        <p className="text-sm text-text-secondary mb-6">
          Preencha abaixo os dados da empresa que emitirá a nota fiscal para recebimento dos seus benefícios do Programa Experts.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Razão social
            </label>
            <input
              type="text"
              value={formData.empresa_nome}
              onChange={(e) => setFormData({ ...formData, empresa_nome: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              CNPJ
            </label>
            <input
              type="text"
              value={formData.empresa_cnpj}
              onChange={(e) => setFormData({ ...formData, empresa_cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* PIX Data */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">
            Dados para Pagamento (PIX)
          </h3>
        </div>

        {!expert.pode_emitir_nf && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Você informou que não pode emitir nota fiscal. Neste caso, o pagamento será feito
              diretamente via PIX.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Tipo de Chave PIX
            </label>
            <select
              value={formData.tipo_chave_pix}
              onChange={(e) => setFormData({ ...formData, tipo_chave_pix: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="cnpj">CNPJ</option>
              <option value="email">E-mail</option>
              <option value="telefone">Telefone</option>
              <option value="chave_aleatoria">Chave Aleatória</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Chave PIX
            </label>
            <input
              type="text"
              value={formData.chave_pix_empresa}
              onChange={(e) => setFormData({ ...formData, chave_pix_empresa: e.target.value })}
              placeholder="Digite sua chave PIX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">
            Termos e Políticas
          </h3>
        </div>

        {expert.aceitou_termo_adesao_em && expert.aceitou_politica_uso_em ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-green-800 font-medium mb-2">
                    Termos aceitos com sucesso
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs text-green-700">
                      <span className="font-medium">Termo de Adesão:</span> {new Date(expert.aceitou_termo_adesao_em).toLocaleDateString('pt-BR')} às {new Date(expert.aceitou_termo_adesao_em).toLocaleTimeString('pt-BR')}
                    </p>
                    <p className="text-xs text-green-700">
                      <span className="font-medium">Política de Uso:</span> {new Date(expert.aceitou_politica_uso_em).toLocaleDateString('pt-BR')} às {new Date(expert.aceitou_politica_uso_em).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded opacity-50 cursor-not-allowed"
                  style={{ accentColor: '#653580' }}
                />
                <span className="text-sm text-text-secondary">
                  Li e aceito o <button type="button" onClick={() => setModalOpen('termo')} className="text-primary-600 hover:text-primary-700 underline">Termo de Adesão</button> do Programa Experts
                </span>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded opacity-50 cursor-not-allowed"
                  style={{ accentColor: '#653580' }}
                />
                <span className="text-sm text-text-secondary">
                  Li e aceito a <button type="button" onClick={() => setModalOpen('politica')} className="text-primary-600 hover:text-primary-700 underline">Política de Uso</button> da plataforma
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  Você precisa aceitar os termos para poder fazer indicações e receber benefícios.
                </p>
              </div>
            </div>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted.termo_adesao}
                onChange={(e) => setTermsAccepted({ ...termsAccepted, termo_adesao: e.target.checked })}
                className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-text-secondary">
                Li e aceito o <button type="button" onClick={() => setModalOpen('termo')} className="text-primary-600 hover:text-primary-700 underline">Termo de Adesão</button> do Programa Experts
              </span>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted.politica_uso}
                onChange={(e) => setTermsAccepted({ ...termsAccepted, politica_uso: e.target.checked })}
                className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-text-secondary">
                Li e aceito a <button type="button" onClick={() => setModalOpen('politica')} className="text-primary-600 hover:text-primary-700 underline">Política de Uso</button> da plataforma
              </span>
            </label>

            <button
              onClick={handleAcceptTerms}
              disabled={loading || !termsAccepted.termo_adesao || !termsAccepted.politica_uso}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Salvando...' : 'Aceitar Termos'}
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSaveData}
        disabled={loading}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <span>Salvar Alterações</span>
        )}
      </button>

      {/* Modals */}
      <DocumentModal
        isOpen={modalOpen === 'termo'}
        onClose={() => setModalOpen(null)}
        title="Termo de Adesão do Programa Experts"
        content={<TermoAdesaoContent />}
      />
      <DocumentModal
        isOpen={modalOpen === 'politica'}
        onClose={() => setModalOpen(null)}
        title="Política de Uso e Conduta"
        content={<PolicyContent />}
      />
    </div>
  );
}
