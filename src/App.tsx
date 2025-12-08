import { useEffect, useState } from 'react';
import { isExpertLoggedIn, getCurrentExpert, logoutExpert } from './lib/supabase';
import { ExpertUser } from './types/database.types';
import LoginPage from './components/auth/LoginPage';
import OTPVerification from './components/auth/OTPVerification';
import DashboardLayout from './components/dashboard/DashboardLayout';
import Dashboard from './components/dashboard/Dashboard';
import IndicationsPage from './components/indications/IndicationsPage';
import BenefitsPage from './components/benefits/BenefitsPage';
import CoursePage from './components/content/CoursePage';
import HowToIndicatePage from './components/content/HowToIndicatePage';
import MyDataPage from './components/content/MyDataPage';

type AuthStep = 'login' | 'otp' | 'authenticated';

function App() {
  const [authStep, setAuthStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState('');
  const [expert, setExpert] = useState<ExpertUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if expert is already logged in
    const checkAuth = async () => {
      if (isExpertLoggedIn()) {
        const expertData = await getCurrentExpert();
        if (expertData) {
          setExpert(expertData);
          setAuthStep('authenticated');
        } else {
          // Session exists but no expert found - clear session
          logoutExpert();
          setAuthStep('login');
        }
      } else {
        setAuthStep('login');
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleOTPSent = (userEmail: string) => {
    setEmail(userEmail);
    setAuthStep('otp');
  };

  const handleOTPSuccess = async () => {
    const expertData = await getCurrentExpert();
    if (expertData) {
      setExpert(expertData);
      setAuthStep('authenticated');
    }
  };

  const handleBackToLogin = () => {
    setEmail('');
    setAuthStep('login');
  };

  const handleLogout = () => {
    logoutExpert();
    setExpert(null);
    setAuthStep('login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Carregando...</p>
        </div>
      </div>
    );
  }

  // Show login page
  if (authStep === 'login') {
    return <LoginPage onOTPSent={handleOTPSent} />;
  }

  // Show OTP verification
  if (authStep === 'otp') {
    return (
      <OTPVerification
        email={email}
        onSuccess={handleOTPSuccess}
        onBack={handleBackToLogin}
      />
    );
  }

  // Authenticated - show dashboard
  return <AuthenticatedApp expert={expert} onLogout={handleLogout} onUpdate={handleOTPSuccess} />;
}

// Authenticated App Component
function AuthenticatedApp({ expert, onLogout, onUpdate }: { expert: ExpertUser; onLogout: () => void; onUpdate: () => void }) {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard expert={expert} onNavigate={setCurrentPage} />;
      case 'indicacoes':
        return <IndicationsPage expert={expert} />;
      case 'beneficios':
        return <BenefitsPage expert={expert} />;
      case 'curso':
        return <CoursePage expert={expert} onUpdate={onUpdate} />;
      case 'como-indicar':
        return <HowToIndicatePage />;
      case 'meus-dados':
        return <MyDataPage expert={expert} onUpdate={onUpdate} />;
      default:
        return <Dashboard expert={expert} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <DashboardLayout
      expert={expert}
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onLogout={onLogout}
    >
      {renderPage()}
    </DashboardLayout>
  );
}

export default App;
