import { useState, useEffect } from 'react';
import AdminLoginPage from './components/admin/AdminLoginPage';
import AdminLayout from './components/admin/AdminLayout';
import IndicationsManagementPage from './components/admin/IndicationsManagementPage';
import ExpertsManagementPage from './components/admin/ExpertsManagementPage';
import BenefitsManagementPage from './components/admin/BenefitsManagementPage';
import PaymentsPage from './components/admin/PaymentsPage';
import { CRMKanbanPage } from './components/admin/CRMKanbanPage';
import { AdminUser } from './types/database.types';
import { verifyAdminSession, isAdminLoggedIn } from './lib/adminAuth';
import LoadingSpinner from './components/LoadingSpinner';

function AdminApp() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [currentPage, setCurrentPage] = useState('indicacoes');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    if (isAdminLoggedIn()) {
      const sessionAdmin = await verifyAdminSession();
      if (sessionAdmin) {
        setAdmin(sessionAdmin);
      }
    }
    setLoading(false);
  };

  const handleLogin = (loggedInAdmin: AdminUser) => {
    setAdmin(loggedInAdmin);
  };

  const handleLogout = () => {
    setAdmin(null);
    setCurrentPage('indicacoes');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner message="Carregando..." />
      </div>
    );
  }

  if (!admin) {
    return <AdminLoginPage onLogin={handleLogin} />;
  }

  return (
    <AdminLayout
      admin={admin}
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onLogout={handleLogout}
    >
      {currentPage === 'dashboard' && (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-2">Em desenvolvimento...</p>
        </div>
      )}

      {currentPage === 'indicacoes' && (
        <IndicationsManagementPage admin={admin} />
      )}

      {currentPage === 'beneficios' && (
        <BenefitsManagementPage admin={admin} />
      )}

      {currentPage === 'pagamentos' && (
        <PaymentsPage />
      )}

      {currentPage === 'experts' && (
        <ExpertsManagementPage admin={admin} />
      )}

      {currentPage === 'crm' && (
        <CRMKanbanPage admin={admin} />
      )}
    </AdminLayout>
  );
}

export default AdminApp;
