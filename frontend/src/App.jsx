import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import DemoWalkthroughBar from './components/common/DemoWalkthroughBar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TenderDiscoveryPage from './pages/TenderDiscoveryPage';
import TenderDetailPage from './pages/TenderDetailPage';
import DocumentVaultPage from './pages/DocumentVaultPage';
import BidStudioPage from './pages/BidStudioPage';
import CompanyProfilePage from './pages/CompanyProfilePage';
import TaskTrackerPage from './pages/TaskTrackerPage';
import { getAuthToken, setAuthToken, api } from './api/client';
import { useDemo } from './demo/DemoContext';

export default function App() {
  const { isDemoMode, demoUser } = useDemo();
  const [token, setToken] = useState(getAuthToken());
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTenderId, setSelectedTenderId] = useState(null);

  useEffect(() => {
    const handleLogoutEvent = () => {
      setToken(null);
      setCurrentUser(null);
    };
    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => window.removeEventListener('auth-logout', handleLogoutEvent);
  }, []);

  useEffect(() => {
    if (token) {
      if (isDemoMode) {
        setCurrentUser(demoUser);
      } else {
        api.getMe()
          .then(setCurrentUser)
          .catch(() => {
            setAuthToken(null);
            setToken(null);
          });
      }
    }
  }, [token, isDemoMode]);

  const handleLogout = () => {
    setAuthToken(null);
    setToken(null);
    setCurrentUser(null);
  };

  const handleLoginSuccess = () => {
    setToken(getAuthToken());
    setActiveTab('dashboard');
  };

  const navigateToTenderDetail = (tenderId) => {
    setSelectedTenderId(tenderId);
    setActiveTab('tender-detail');
  };

  const navigateToStudio = (tenderId) => {
    setSelectedTenderId(tenderId);
    setActiveTab('studio');
  };

  if (!token) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Toaster
        position="bottom-right"
        theme="light"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: '#ffffff',
            border: '1px solid rgba(226, 232, 240, 1)',
            color: '#0f172a',
            boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          },
        }}
      />
      <Navbar user={currentUser} onLogout={handleLogout} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentTab={activeTab === 'tender-detail' ? 'tenders' : activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab !== 'tender-detail') setSelectedTenderId(null);
          }}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Pitch Walkthrough Bar */}
          <DemoWalkthroughBar
            onNavigateTab={setActiveTab}
            onSelectTender={navigateToTenderDetail}
          />

          <div key={activeTab} className="animate-view-fade">
            {activeTab === 'dashboard' && (
              <DashboardPage
                onNavigateTender={navigateToTenderDetail}
                onSelectTab={setActiveTab}
              />
            )}

            {activeTab === 'tenders' && (
              <TenderDiscoveryPage
                onSelectTender={navigateToTenderDetail}
                onOpenStudio={navigateToStudio}
              />
            )}

            {activeTab === 'tender-detail' && (
              <TenderDetailPage
                tenderId={selectedTenderId}
                onBack={() => setActiveTab('tenders')}
                onOpenStudio={navigateToStudio}
              />
            )}

            {activeTab === 'vault' && <DocumentVaultPage />}

            {activeTab === 'studio' && (
              <BidStudioPage initialTenderId={selectedTenderId} />
            )}

            {activeTab === 'tasks' && <TaskTrackerPage />}

            {activeTab === 'profile' && <CompanyProfilePage />}
          </div>
        </main>
      </div>
    </div>
  );
}
