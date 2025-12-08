import { useState } from 'react';
import { GraduationCap, CheckCircle2, Play } from 'lucide-react';
import { ExpertUser } from '../../types/database.types';
import { supabase } from '../../lib/supabase';

interface CoursePageProps {
  expert: ExpertUser;
  onUpdate: () => void;
}

export default function CoursePage({ expert, onUpdate }: CoursePageProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCompleteCourse = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('experts_users')
        .update({
          curso_concluido: true,
          curso_concluido_em: new Date().toISOString(),
        })
        .eq('id', expert.id);

      if (error) throw error;

      setSuccess(true);
      onUpdate();
    } catch (err) {
      console.error('Error completing course:', err);
    } finally {
      setLoading(false);
    }
  };

  if (expert.curso_concluido) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            Curso Obrigatório
          </h2>
          <p className="text-text-secondary mt-1">
            Treinamento do Programa Experts
          </p>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-text-primary mb-2">
            Curso Concluído!
          </h3>
          <p className="text-text-secondary mb-4">
            Você completou o curso obrigatório em {new Date(expert.curso_concluido_em!).toLocaleDateString('pt-BR')}
          </p>
          <p className="text-text-muted">
            Agora você já pode fazer indicações e receber benefícios.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-text-primary mb-2">
          Parabéns!
        </h3>
        <p className="text-text-secondary">
          Você concluiu o curso obrigatório com sucesso.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary">
          Curso Obrigatório
        </h2>
        <p className="text-text-secondary mt-1">
          Complete este curso para começar a indicar
        </p>
      </div>

      {/* Course Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Video Section */}
        <div className="aspect-video bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-white/20 transition-colors">
              <Play className="w-10 h-10 text-white ml-1" />
            </div>
            <p className="text-white text-sm">
              Clique para assistir o vídeo do curso
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-text-primary mb-4">
              Bem-vindo ao Programa Experts CorpVox
            </h3>
            <p className="text-text-secondary leading-relaxed">
              Este curso apresenta tudo que você precisa saber sobre o Programa Experts:
              como funciona, como fazer indicações, regras de pagamento e muito mais.
            </p>
          </div>

          {/* Topics */}
          <div>
            <h4 className="text-lg font-semibold text-text-primary mb-4">
              O que você vai aprender:
            </h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-primary-600">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    O que é o Programa Experts
                  </p>
                  <p className="text-xs text-text-muted">
                    Entenda o propósito e benefícios do programa
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-primary-600">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Como fazer indicações
                  </p>
                  <p className="text-xs text-text-muted">
                    Aprenda as três formas de indicar empresas
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-primary-600">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Regras e prazos
                  </p>
                  <p className="text-xs text-text-muted">
                    Conheça as regras dos 90 dias e datas de pagamento
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-primary-600">4</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Como receber seus benefícios
                  </p>
                  <p className="text-xs text-text-muted">
                    Processo de emissão de NF e recebimento de pagamentos
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-primary-600">5</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Uso da plataforma
                  </p>
                  <p className="text-xs text-text-muted">
                    Navegue e utilize todas as funcionalidades
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-text-muted">
              <GraduationCap className="w-5 h-5" />
              <span>Duração aproximada: 15 minutos</span>
            </div>
          </div>

          {/* Complete Button */}
          <button
            onClick={handleCompleteCourse}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Marcar como Concluído</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
