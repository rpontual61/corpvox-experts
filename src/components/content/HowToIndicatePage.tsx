import { FileText, Mail, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';

export default function HowToIndicatePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary">
          Como Indicar
        </h2>
        <p className="text-text-secondary mt-1">
          Guia completo de como fazer indicações
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-8">
        {/* Introduction */}
        <div>
          <h3 className="text-xl font-semibold text-text-primary mb-4">
            O Programa Experts CorpVox
          </h3>
          <p className="text-text-secondary leading-relaxed">
            O Programa Experts foi criado para reconhecer e recompensar profissionais que indicam empresas
            para o CorpVox. Você pode indicar empresas de três formas diferentes, todas válidas e
            igualmente recompensadas.
          </p>
        </div>

        {/* Methods */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-xl font-semibold text-text-primary mb-6">
            Formas de Indicação
          </h3>
          <div className="space-y-6">
            {/* Method 1 */}
            <div className="flex items-start space-x-4 p-4 bg-primary-50 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-primary-900 mb-2">
                  1. Relatório Técnico
                </h4>
                <p className="text-sm text-primary-800 mb-3">
                  Envie um relatório técnico completo recomendando o CorpVox. Inclua dados da empresa,
                  necessidades identificadas e como o CorpVox pode ajudar.
                </p>
                <div className="bg-white p-3 rounded border border-primary-200">
                  <p className="text-xs text-primary-900 font-mono">
                    "Prezado [Nome], após análise da [Empresa], identificamos oportunidades para implementação
                    de canal de escuta corporativa. Recomendo o CorpVox pela [razões]..."
                  </p>
                </div>
              </div>
            </div>

            {/* Method 2 */}
            <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-blue-900 mb-2">
                  2. E-mail
                </h4>
                <p className="text-sm text-blue-800 mb-3">
                  Envie um e-mail profissional para o contato da empresa apresentando o CorpVox.
                  Seja claro sobre os benefícios e inclua informações de contato.
                </p>
                <div className="bg-white p-3 rounded border border-blue-200">
                  <p className="text-xs text-blue-900 font-mono">
                    "Olá [Nome], gostaria de apresentar o CorpVox, uma plataforma de escuta corporativa
                    que pode trazer grandes benefícios para [Empresa]. Para mais informações: [contato]"
                  </p>
                </div>
              </div>
            </div>

            {/* Method 3 */}
            <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-green-900 mb-2">
                  3. Conversa no WhatsApp
                </h4>
                <p className="text-sm text-green-800 mb-3">
                  Apresente o CorpVox em uma conversa informal no WhatsApp. Seja natural e destaque
                  os principais benefícios da plataforma.
                </p>
                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="text-xs text-green-900 font-mono">
                    "Oi [Nome]! Conhece o CorpVox? É uma plataforma excelente para escuta corporativa
                    que pode ajudar muito a [Empresa]. Vou te passar o contato!"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rules */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-xl font-semibold text-text-primary mb-6">
            Regras Importantes
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-text-secondary">
                A indicação é válida por 90 dias após o envio. Se a empresa contratar dentro deste
                prazo, você receberá o benefício.
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-text-secondary">
                Você receberá o benefício após o primeiro pagamento da empresa contratante.
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-text-secondary">
                A nota fiscal deve ser enviada entre os dias 5 e 15 do mês do primeiro pagamento.
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-text-secondary">
                O pagamento será realizado no dia 15 do mês após o envio da nota fiscal.
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-text-secondary">
                Empresas já em negociação com o CorpVox não são elegíveis para indicação.
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-xl font-semibold text-text-primary mb-4">
            Próximos Passos
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <p className="text-sm text-text-primary">
                Escolha a forma de indicação (relatório, e-mail ou WhatsApp)
              </p>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <p className="text-sm text-text-primary">
                Faça contato com a empresa apresentando o CorpVox
              </p>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <p className="text-sm text-text-primary">
                Cadastre a indicação na plataforma com os dados da empresa
              </p>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <p className="text-sm text-text-primary">
                Aguarde a validação e acompanhe o status na plataforma
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
