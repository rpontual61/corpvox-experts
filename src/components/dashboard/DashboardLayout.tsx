import { ReactNode, useState } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { ExpertUser } from '../../types/database.types';
import { logoutExpert } from '../../lib/supabase';

interface DashboardLayoutProps {
  children: ReactNode;
  expert: ExpertUser;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function DashboardLayout({ children, expert, currentPage, onNavigate, onLogout }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if expert needs attention
  const needsAttention =
    !expert.curso_concluido ||
    !expert.chave_pix_empresa ||
    !expert.aceitou_termo_adesao_em ||
    !expert.aceitou_politica_uso_em;

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: needsAttention },
    { id: 'indicacoes', icon: FileText, label: 'Minhas Indicações' },
    { id: 'beneficios', icon: DollarSign, label: 'Meus Benefícios' },
    { id: 'curso', icon: GraduationCap, label: 'Curso Obrigatório', badge: !expert.curso_concluido },
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
        fixed left-0 top-0 h-full bg-gradient-to-b from-primary-900 to-primary-800 z-50 transition-transform duration-300 lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-primary-700">
            <img
              src="/Logo.svg"
              alt="CorpVox"
              className="h-8 w-auto"
            />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-2 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-primary-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {expert.nome}
                </p>
                <p className="text-xs text-primary-200 truncate">
                  {expert.tipo_perfil === 'sst' ? 'SST' : 'Business'}
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
                const isActive = currentPage === item.id;

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
                        <div className="w-2 h-2 bg-yellow-400 rounded-full" />
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
          <div className="px-6 py-3 border-t border-primary-700">
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
              <div className="flex items-center space-x-4">
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

              {/* Status Badge */}
              <div className="hidden sm:flex items-center space-x-2">
                {expert.status === 'aprovado' ? (
                  <div className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Ativo
                  </div>
                ) : expert.status === 'pendente' ? (
                  <div className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    Pendente
                  </div>
                ) : (
                  <div className="px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    {expert.status}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
