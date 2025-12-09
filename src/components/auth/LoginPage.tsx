import { useState } from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import { createOTP } from '../../lib/supabase';

interface LoginPageProps {
  onOTPSent: (email: string, otpCode?: string) => void;
}

export default function LoginPage({ onOTPSent }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { success, error: otpError, code } = await createOTP(email);

      if (!success) {
        setError(otpError || 'Erro ao enviar código');
        setLoading(false);
        return;
      }

      // Success - move to OTP verification
      onOTPSent(email, code);
    } catch (err) {
      setError('Erro ao processar solicitação');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src="/Corpvox_experts.png"
              alt="CorpVox Experts"
              className="h-12 w-auto"
            />
          </div>
          <p className="text-text-secondary">
            Faça login para acessar sua área
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                E-mail cadastrado
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Receber código de acesso</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-text-muted text-center">
              Ao continuar, você receberá um código de verificação no e-mail informado.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-text-muted">
            Não tem cadastro? <a href="#" className="text-primary-600 hover:text-primary-700 underline">Conheça o programa</a>
          </p>
        </div>
      </div>
    </div>
  );
}
