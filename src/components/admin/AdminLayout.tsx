import { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Gift,
  Users,
  LogOut,
  Menu,
  X,
  Shield,
  Activity,
  Kanban,
  DollarSign
} from 'lucide-react';
import { AdminUser } from '../../types/database.types';
import { adminLogout } from '../../lib/adminAuth';

interface AdminLayoutProps {
  admin: AdminUser;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function AdminLayout({ admin, currentPage, onNavigate, onLogout, children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await adminLogout();
    onLogout();
  };

  const menuItems = [
    { id: 'indicacoes', label: 'Indicações', icon: FileText },
    { id: 'crm', label: 'CRM', icon: Kanban },
    { id: 'beneficios', label: 'Benefícios', icon: Gift },
    { id: 'pagamentos', label: 'Pagamentos', icon: DollarSign },
    { id: 'experts', label: 'Experts', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 fixed w-full top-0 z-30">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <img
              src="/Corpvox_experts.png"
              alt="CorpVox Experts"
              className="h-10 object-contain"
            />
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">{admin.nome}</p>
              <p className="text-xs text-gray-500">{admin.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 transition-transform duration-300 z-20 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-purple-50 text-purple-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 pt-16">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
