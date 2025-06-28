import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LandingPage } from './components/landing/LandingPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { MyStories } from './components/dashboard/MyStories';
import { MyVideos } from './components/dashboard/MyVideos';
import { MyCharacters } from './components/dashboard/MyCharacters';
import { Settings } from './components/dashboard/Settings';
import { EnhancedStoryCreator } from './components/story/EnhancedStoryCreator';
import { StoryWorkflowContinuation } from './components/story/StoryWorkflowContinuation';
import { AuthModal } from './components/auth/AuthModal';
import { useAuthStore } from './store/authStore';
import { useStoryStore } from './store/storyStore';

const queryClient = new QueryClient();

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [continuationData, setContinuationData] = useState<{story: any, step: string} | null>(null);
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const { fetchUserStories } = useStoryStore();

  // Check authentication on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch user stories when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserStories(user.id);
    }
  }, [isAuthenticated, user, fetchUserStories]);

  const handleAuthClick = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleCreateStory = () => {
    console.log('🎬 App: handleCreateStory called');
    setContinuationData(null); // Clear any continuation data
    setActiveTab('create');
  };

  const handleContinueStory = (story: any, step: string) => {
    console.log('🔄 App: handleContinueStory called with:', story.title, 'step:', step);
    
    try {
      setContinuationData({ story, step });
      setActiveTab('continue');
      console.log('✅ App: Successfully set continuation data and switched to continue tab');
    } catch (error) {
      console.error('❌ App: Error in handleContinueStory:', error);
    }
  };

  const handleStoryComplete = () => {
    console.log('✅ App: handleStoryComplete called');
    setContinuationData(null);
    setActiveTab('dashboard');
  };

  const handleWorkflowComplete = () => {
    console.log('✅ App: handleWorkflowComplete called');
    setContinuationData(null);
    setActiveTab('stories');
  };

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Header onAuthClick={() => handleAuthClick('signin')} />
          <LandingPage 
            onGetStarted={() => handleAuthClick('signin')} 
            onSignUp={() => handleAuthClick('signup')}
          />
          <AuthModal 
            isOpen={showAuthModal} 
            onClose={() => setShowAuthModal(false)}
            initialMode={authMode}
          />
          <Toaster 
            position="top-right" 
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeTab === 'dashboard' && (
                <Dashboard 
                  onCreateStory={handleCreateStory} 
                  onContinueStory={handleContinueStory}
                />
              )}
              {activeTab === 'create' && (
                <EnhancedStoryCreator onComplete={handleStoryComplete} />
              )}
              {activeTab === 'continue' && continuationData && (
                <StoryWorkflowContinuation 
                  story={continuationData.story}
                  startStep={continuationData.step}
                  onComplete={handleWorkflowComplete}
                />
              )}
              {activeTab === 'stories' && (
                <MyStories 
                  onCreateStory={handleCreateStory}
                  onContinueStory={handleContinueStory}
                />
              )}
              {activeTab === 'videos' && (
                <MyVideos />
              )}
              {activeTab === 'characters' && (
                <MyCharacters />
              )}
              {activeTab === 'settings' && (
                <Settings />
              )}
            </div>
          </main>
        </div>
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </QueryClientProvider>
  );
}

export default App;