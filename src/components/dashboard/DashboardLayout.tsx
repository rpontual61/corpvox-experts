import { ReactNode, useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  User,
  BookOpen,
  LogOut,
  Menu,
  X,
  GraduationCap,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ExpertUser } from '../../types/database.types';
import { logoutExpert, formatCurrency, supabase } from '../../lib/supabase';

interface DashboardLayoutProps {
  children: ReactNode;
  expert: ExpertUser;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  totalIndicacoes?: number;
  totalBeneficios?: number;
  totalBeneficiosPagos?: number;
}

export default function DashboardLayout({ children, expert, currentPage, onNavigate, onLogout, totalIndicacoes = 0, totalBeneficios = 0, totalBeneficiosPagos = 0 }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasPendingNF, setHasPendingNF] = useState(false);
  const [pendingNFCount, setPendingNFCount] = useState(0);

  // Check if expert needs attention
  const needsAttention =
    !expert.curso_concluido ||
    !expert.chave_pix_empresa ||
    !expert.aceitou_termo_adesao_em ||
    !expert.aceitou_politica_uso_em;

  // Check for benefits awaiting NF
  useEffect(() => {
    const checkPendingNF = async () => {
      try {
        const { data, error } = await supabase
          .from('experts_benefits')
          .select('id')
          .eq('expert_id', expert.id)
          .eq('status', 'liberado_para_nf')
          .eq('nf_enviada', false);

        if (error) throw error;

        const count = data?.length || 0;
        setHasPendingNF(count > 0);
        setPendingNFCount(count);
      } catch (error) {
        console.error('Error checking pending NF:', error);
      }
    };

    checkPendingNF();
  }, [expert.id]);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Meu Painel', badge: needsAttention },
    { id: 'indicacoes', icon: FileText, label: 'Minhas Indicações' },
    { id: 'beneficios', icon: DollarSign, label: 'Meus Benefícios' },
    { id: 'curso', icon: GraduationCap, label: 'Guia Essencial', badge: !expert.curso_concluido },
    { id: 'como-indicar', icon: BookOpen, label: 'Como Indicar' },
    { id: 'meus-dados', icon: User, label: 'Meus Dados' },
  ];

  const handleLogout = () => {
    logoutExpert();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full border-r border-gray-700 z-50 transition-transform duration-300 lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64
      `} style={{ background: 'linear-gradient(to bottom, #35174aff 0%, #35174aff 50%, #1E2328 100%)' }}>
        <div className="flex flex-col h-full">
          {/* Close button for mobile */}
          <div className="flex items-center justify-end px-6 py-4 border-b border-gray-700 lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/Icon.svg" alt="Profile" className="w-10 h-10" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {expert.nome}
                </p>
                {expert.status === 'aprovado' ? (
                  <p className="text-xs text-green-300 truncate flex items-center space-x-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Expert Aprovado</span>
                  </p>
                ) : (
                  <p className="text-xs text-yellow-300 truncate flex items-center space-x-1 mt-0.5">
                    <AlertCircle className="w-3 h-3" />
                    <span>Cadastro Pendente</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id || currentPage.startsWith(item.id + ':');

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onNavigate(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                        ${isActive
                          ? 'bg-white/10 text-white'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5" strokeWidth={1.5} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="px-3 pb-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" strokeWidth={1.5} />
              <span>Sair</span>
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-700">
            <p className="text-xs text-primary-300 text-center">
              CorpVox © 2024
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-0">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <img
                  src="/Corpvox_experts.png"
                  alt="CorpVox Experts"
                  className="h-8 w-auto object-contain"
                />
              </div>

              {/* Stats Info */}
              <div className="hidden sm:flex items-center space-x-6">
                <div className="text-right">
                  <p className="text-xs text-text-muted">Indicações cadastradas</p>
                  <p className="text-sm font-semibold text-text-primary">{totalIndicacoes}</p>
                </div>
                <div className="h-10 w-px bg-gray-300"></div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Total de Benefícios</p>
                  <p className="text-sm font-semibold text-primary-600">{formatCurrency(totalBeneficios)}</p>
                </div>
                <div className="h-10 w-px bg-gray-300"></div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Benefícios já pagos</p>
                  <p className="text-sm font-semibold text-green-600">{formatCurrency(totalBeneficiosPagos)}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* NF Alert Banner */}
        {hasPendingNF && (
          <div className="bg-yellow-50 border-b border-yellow-200">
            <div className="px-4 sm:px-6 lg:px-8 py-3">
              <button
                onClick={() => onNavigate('beneficios')}
                className="flex items-center space-x-3 w-full hover:opacity-80 transition-opacity"
              >
                <span className="text-2xl flex-shrink-0">🎉</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-yellow-900">
                    Você tem {pendingNFCount} {pendingNFCount === 1 ? 'benefício liberado' : 'benefícios liberados'} para emissão de Nota Fiscal
                  </p>
                  <p className="text-xs text-yellow-700 mt-0.5">
                    Clique aqui para acessar e enviar sua NF
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
