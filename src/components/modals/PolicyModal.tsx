import React, { useState } from 'react';
import { X } from 'lucide-react';

interface PolicyModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ isOpen, onAccept }) => {
  const [accepted, setAccepted] = useState(false);

  if (!isOpen) return null;

  const handleAccept = () => {
    if (accepted) {
      onAccept();
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-col items-center p-8 pb-6 border-b border-gray-200">
          <img
            src="/Corpvox_experts.png"
            alt="CorpVox Experts"
            className="h-12 mb-6"
          />
          <p className="text-base text-text-secondary text-center">
            Antes de continuar, você precisa ler e concordar com a <span className="font-bold">Política de Uso e Conduta do Programa Experts.</span>
          </p>
        </div>

        {/* Scrollable Policy Content */}
        <div className="flex-1 overflow-y-auto p-8 text-sm text-text-secondary leading-relaxed bg-gray-50">
          <h3 className="text-xl font-bold text-text-primary mb-4">
            POLÍTICA DE USO E CONDUTA DO PROGRAMA EXPERTS CORPVOX
          </h3>

          <p className="mb-4">
            A Política de Uso e Conduta estabelece os princípios e regras que devem ser seguidos pelos participantes do Programa Experts CorpVox. Ao aceitar esta Política, o Expert confirma que compreende e concorda com todas as diretrizes a seguir.
          </p>

          <h4 className="text-lg font-semibold text-text-primary mt-6 mb-3">
            1. Independência técnica
          </h4>
          <p className="mb-2">
            O Expert participa do Programa de forma autônoma.
          </p>
          <p className="mb-4">
            Não atua como vendedor, representante, preposto ou agente comercial da CorpVox.
          </p>

          <h4 className="text-lg font-semibold text-text-primary mt-6 mb-3">
            2. Finalidade das indicações
          </h4>
          <p className="mb-2">
            A indicação deve ser:
          </p>
          <ul className="list-disc pl-6 mb-2 space-y-1">
            <li>técnica</li>
            <li>legítima</li>
            <li>baseada em contato real</li>
            <li>feita dentro das normas aplicáveis de SST e compliance</li>
            <li>realizada sem pressão ou interesse comercial</li>
          </ul>
          <p className="mb-4">
            A decisão de contratação é sempre da empresa indicada.
          </p>

          <h4 className="text-lg font-semibold text-text-primary mt-6 mb-3">
            3. Veracidade das informações
          </h4>
          <p className="mb-2">
            O Expert é responsável pela veracidade dos dados cadastrados, incluindo:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>suas informações pessoais</li>
            <li>dados das empresas indicadas</li>
            <li>dados bancários</li>
            <li>informações sobre a forma de indicação</li>
          </ul>

          <h4 className="text-lg font-semibold text-text-primary mt-6 mb-3">
            4. Condutas proibidas
          </h4>
          <p className="mb-2">
            O Expert não pode:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>prometer condições comerciais</li>
            <li>negociar em nome da CorpVox</li>
            <li>enviar propostas ou preços</li>
            <li>cadastrar CNPJs que não correspondam a empresas reais que tenha atendido ou analisado</li>
            <li>realizar indicações em massa ou aleatórias</li>
            <li>criar expectativas de contratação</li>
            <li>burlar o sistema</li>
            <li>omitir conflitos de interesse</li>
            <li>violar políticas internas de empregadores ou clientes</li>
          </ul>

          <h4 className="text-lg font-semibold text-text-primary mt-6 mb-3">
            5. Conflito de interesses
          </h4>
          <p className="mb-2">
            O Expert declara que sua atuação não viola:
          </p>
          <ul className="list-disc pl-6 mb-2 space-y-1">
            <li>contratos de trabalho</li>
            <li>termos de prestação de serviço</li>
            <li>políticas internas de empresas</li>
            <li>códigos de ética profissionais</li>
          </ul>
          <p className="mb-4">
            Deve informar à CorpVox sempre que houver dúvida sobre possível conflito.
          </p>

          <h4 className="text-lg font-semibold text-text-primary mt-6 mb-3">
            6. Conclusão obrigatória do curso técnico
          </h4>
          <p className="mb-2">
            O Expert deve concluir o curso técnico fornecido pela CorpVox antes de registrar qualquer indicação.
          </p>
          <p className="mb-4">
            O cadastro de novas indicações só será liberado após conclusão do curso e aprovação pela CorpVox.
          </p>

          <h4 className="text-lg font-semibold text-text-primary mt-6 mb-3">
            7. Regra dos 90 dias
          </h4>
          <p className="mb-4">
            Indicações expiram automaticamente após 90 dias e deixam de gerar direito a benefício caso a empresa indicada não contrate nesse período.
          </p>

          <h4 className="text-lg font-semibold text-text-primary mt-6 mb-3">
            8. Duplicidade de indicações
          </h4>
          <p className="mb-4">
            Em caso de múltiplas indicações para a mesma empresa, a CorpVox determinará qual será considerada válida conforme critérios internos.
          </p>

          <h4 className="text-lg font-semibold text-text-primary mt-6 mb-3">
            9. Suspensão por abuso ou prática indevida
          </h4>
          <p className="mb-2">
            A CorpVox poderá suspender a participação do Expert em caso de:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>fraude</li>
            <li>indícios de manipulação</li>
            <li>abuso do sistema</li>
            <li>comportamento prejudicial à CorpVox</li>
            <li>descumprimento parcial ou integral desta Política</li>
          </ul>

          <h4 className="text-lg font-semibold text-text-primary mt-6 mb-3">
            10. Cancelamento de benefícios fraudulentos
          </h4>
          <p className="mb-4">
            Indicações ou benefícios obtidos por meios enganosos poderão ser cancelados imediatamente, sem pagamento.
          </p>

          <h4 className="text-lg font-semibold text-text-primary mt-6 mb-3">
            11. Uso correto da plataforma
          </h4>
          <p className="mb-2">
            O Expert deve:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>manter seus dados atualizados</li>
            <li>acessar o sistema de forma segura</li>
            <li>não compartilhar login</li>
            <li>usar a plataforma apenas para finalidade prevista</li>
          </ul>

          <h4 className="text-lg font-semibold text-text-primary mt-6 mb-3">
            12. Aceite da Política
          </h4>
          <p className="mb-2">
            Ao aceitar esta Política, o Expert confirma:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>compreensão das regras</li>
            <li>responsabilidade por sua conduta</li>
            <li>ciência de que violações podem resultar em suspensão ou exclusão do Programa</li>
          </ul>
        </div>

        {/* Footer with checkbox and button */}
        <div className="border-t border-gray-200 p-8 pt-6">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <input
              type="checkbox"
              id="policy-accept"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600 cursor-pointer"
              style={{ accentColor: '#653580' }}
            />
            <label
              htmlFor="policy-accept"
              className="text-sm text-text-primary cursor-pointer select-none"
            >
              Li e aceito a Política de Uso e Conduta do Programa Experts CorpVox
            </label>
          </div>

          <button
            onClick={handleAccept}
            disabled={!accepted}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
              accepted
                ? 'bg-primary-600 text-white hover:bg-primary-700 cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};
