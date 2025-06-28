import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Key, Bell, Palette, Shield, Download, Trash2, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    email: user?.email || '',
    fullName: '',
    bio: '',
    website: ''
  });
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    replicate: '',
    elevenlabs: '',
    shotstack: '',
    runway: ''
  });
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    videoComplete: true,
    weeklyDigest: false,
    marketingEmails: false
  });

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'api', name: 'API Keys', icon: Key },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'security', name: 'Security', icon: Shield },
  ];

  const handleSaveProfile = () => {
    // In a real app, this would save to the database
    toast.success('Profile updated successfully');
  };

  const handleSaveApiKeys = () => {
    // In a real app, this would save encrypted API keys
    toast.success('API keys updated successfully');
  };

  const handleSaveNotifications = () => {
    // In a real app, this would save notification preferences
    toast.success('Notification preferences updated');
  };

  const handleExportData = () => {
    // In a real app, this would export user data
    toast.success('Data export started - you will receive an email when ready');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // In a real app, this would delete the account
      toast.error('Account deletion is not implemented in this demo');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {tabs.find(tab => tab.id === activeTab)?.name}
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Email Address"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      disabled
                    />
                    <Input
                      label="Full Name"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  
                  <Input
                    label="Website"
                    value={profileData.website}
                    onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://your-website.com"
                  />
                  
                  <Button onClick={handleSaveProfile}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </Button>
                </div>
              )}

              {/* API Keys Tab */}
              {activeTab === 'api' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      API Key Security
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Your API keys are encrypted and stored securely. They are only used for generating content and are never shared with third parties.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Input
                      label="OpenAI API Key"
                      type="password"
                      value={apiKeys.openai}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                      placeholder="sk-..."
                    />
                    
                    <Input
                      label="Replicate API Token"
                      type="password"
                      value={apiKeys.replicate}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, replicate: e.target.value }))}
                      placeholder="r8_..."
                    />
                    
                    <Input
                      label="ElevenLabs API Key"
                      type="password"
                      value={apiKeys.elevenlabs}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, elevenlabs: e.target.value }))}
                      placeholder="..."
                    />
                    
                    <Input
                      label="Shotstack API Key"
                      type="password"
                      value={apiKeys.shotstack}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, shotstack: e.target.value }))}
                      placeholder="..."
                    />
                    
                    <Input
                      label="Runway ML API Key"
                      type="password"
                      value={apiKeys.runway}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, runway: e.target.value }))}
                      placeholder="..."
                    />
                  </div>
                  
                  <Button onClick={handleSaveApiKeys}>
                    <Save className="w-4 h-4 mr-2" />
                    Save API Keys
                  </Button>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {Object.entries(notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {key === 'emailUpdates' && 'Email Updates'}
                            {key === 'videoComplete' && 'Video Generation Complete'}
                            {key === 'weeklyDigest' && 'Weekly Digest'}
                            {key === 'marketingEmails' && 'Marketing Emails'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {key === 'emailUpdates' && 'Receive important account updates'}
                            {key === 'videoComplete' && 'Get notified when videos are ready'}
                            {key === 'weeklyDigest' && 'Weekly summary of your activity'}
                            {key === 'marketingEmails' && 'Product updates and tips'}
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  <Button onClick={handleSaveNotifications}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                      Theme Preference
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => theme === 'dark' && toggleTheme()}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          theme === 'light'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <div className="w-full h-20 bg-white rounded border mb-3"></div>
                        <div className="font-medium">Light Mode</div>
                      </button>
                      
                      <button
                        onClick={() => theme === 'light' && toggleTheme()}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          theme === 'dark'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <div className="w-full h-20 bg-gray-800 rounded border mb-3"></div>
                        <div className="font-medium">Dark Mode</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                      Account Security
                    </h3>
                    <div className="space-y-4">
                      <Button variant="outline">
                        Change Password
                      </Button>
                      
                      <Button variant="outline" onClick={logout}>
                        Sign Out of All Devices
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                      Data Management
                    </h3>
                    <div className="space-y-4">
                      <Button variant="outline" onClick={handleExportData}>
                        <Download className="w-4 h-4 mr-2" />
                        Export My Data
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={handleDeleteAccount}
                        className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};