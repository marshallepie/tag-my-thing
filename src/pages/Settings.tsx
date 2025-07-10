import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Bell, Shield, Globe, Smartphone, Eye, EyeOff, Moon, Sun, Monitor, Languages, CreditCard, Download, Upload, Trash2, Save, RefreshCw, AlertCircle, CheckCircle, Lock, Mail, Camera, Video, Users, Zap, Database, FileText, HelpCircle, ExternalLink, ToggleLeft as Toggle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';

interface NotificationSettings {
  email_notifications: boolean;
  asset_reminders: boolean;
  nok_updates: boolean;
  security_alerts: boolean;
  marketing_emails: boolean;
  weekly_digest: boolean;
}

interface PrivacySettings {
  profile_visibility: 'private' | 'public';
  asset_discovery: boolean;
  analytics_tracking: boolean;
  data_sharing: boolean;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  currency: 'gbp' | 'xaf' | 'usd' | 'eur';
  auto_backup: boolean;
  compression_quality: 'low' | 'medium' | 'high';
}

interface SecuritySettings {
  two_factor_enabled: boolean;
  session_timeout: number;
  login_notifications: boolean;
  device_tracking: boolean;
}

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    asset_reminders: true,
    nok_updates: true,
    security_alerts: true,
    marketing_emails: false,
    weekly_digest: true
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profile_visibility: 'private',
    asset_discovery: false,
    analytics_tracking: true,
    data_sharing: false
  });

  const [appSettings, setAppSettings] = useState<AppSettings>({
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    currency: 'gbp',
    auto_backup: true,
    compression_quality: 'medium'
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    two_factor_enabled: false,
    session_timeout: 30,
    login_notifications: true,
    device_tracking: true
  });

  const { user, profile } = useAuth();

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    // In a real app, load settings from database
    // For now, we'll use default values
    if (profile?.language) {
      setAppSettings(prev => ({ ...prev, language: profile.language }));
    }
  };

  const saveSettings = async (settingsType: string, settings: any) => {
    if (!user) return;

    setLoading(true);
    try {
      // In a real app, save to database
      // For now, we'll just show success message
      toast.success(`${settingsType} settings saved successfully!`);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    setExportLoading(true);
    try {
      // Mock data export
      const exportData = {
        profile: profile,
        settings: {
          notifications: notificationSettings,
          privacy: privacySettings,
          app: appSettings,
          security: securitySettings
        },
        exported_at: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tagmything-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully!');
      setShowExportModal(false);
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setExportLoading(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: <SettingsIcon className="h-5 w-5" /> },
    { id: 'notifications', name: 'Notifications', icon: <Bell className="h-5 w-5" /> },
    { id: 'privacy', name: 'Privacy', icon: <Shield className="h-5 w-5" /> },
    { id: 'security', name: 'Security', icon: <Lock className="h-5 w-5" /> },
    { id: 'data', name: 'Data & Storage', icon: <Database className="h-5 w-5" /> },
    { id: 'help', name: 'Help & Support', icon: <HelpCircle className="h-5 w-5" /> }
  ];

  const languageOptions = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' }
  ];

  const timezoneOptions = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' }
  ];

  const currencyOptions = [
    { code: 'gbp', name: 'British Pound (£)', symbol: '£' },
    { code: 'xaf', name: 'Central African Franc (XAF)', symbol: 'XAF' },
    { code: 'usd', name: 'US Dollar ($)', symbol: '$' },
    { code: 'eur', name: 'Euro (€)', symbol: '€' }
  ];

  const ToggleSwitch: React.FC<{
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
  }> = ({ enabled, onChange, disabled = false }) => (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${enabled ? 'bg-primary-600' : 'bg-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
                { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
                { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> }
              ].map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => setAppSettings(prev => ({ ...prev, theme: theme.value as any }))}
                  className={`
                    flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-colors
                    ${appSettings.theme === theme.value
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  {theme.icon}
                  <span className="text-sm font-medium">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                value={appSettings.language}
                onChange={(e) => setAppSettings(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {languageOptions.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={appSettings.currency}
                onChange={(e) => setAppSettings(prev => ({ ...prev, currency: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {currencyOptions.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              value={appSettings.timezone}
              onChange={(e) => setAppSettings(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {timezoneOptions.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button
            onClick={() => saveSettings('General', appSettings)}
            loading={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Media Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Auto Backup</h4>
              <p className="text-sm text-gray-600">Automatically backup your assets to cloud storage</p>
            </div>
            <ToggleSwitch
              enabled={appSettings.auto_backup}
              onChange={(enabled) => setAppSettings(prev => ({ ...prev, auto_backup: enabled }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image Compression Quality
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'low', label: 'Low', description: 'Smaller files' },
                { value: 'medium', label: 'Medium', description: 'Balanced' },
                { value: 'high', label: 'High', description: 'Best quality' }
              ].map((quality) => (
                <button
                  key={quality.value}
                  onClick={() => setAppSettings(prev => ({ ...prev, compression_quality: quality.value as any }))}
                  className={`
                    p-3 rounded-lg border-2 transition-colors text-left
                    ${appSettings.compression_quality === quality.value
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  <div className="font-medium text-gray-900">{quality.label}</div>
                  <div className="text-xs text-gray-600">{quality.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
        
        <div className="space-y-4">
          {[
            {
              key: 'email_notifications',
              title: 'Email Notifications',
              description: 'Receive notifications via email',
              icon: <Mail className="h-5 w-5 text-gray-600" />
            },
            {
              key: 'asset_reminders',
              title: 'Asset Reminders',
              description: 'Get reminders about your tagged assets',
              icon: <Camera className="h-5 w-5 text-gray-600" />
            },
            {
              key: 'nok_updates',
              title: 'Next of Kin Updates',
              description: 'Notifications about NOK status changes',
              icon: <Users className="h-5 w-5 text-gray-600" />
            },
            {
              key: 'security_alerts',
              title: 'Security Alerts',
              description: 'Important security notifications',
              icon: <Shield className="h-5 w-5 text-gray-600" />
            },
            {
              key: 'weekly_digest',
              title: 'Weekly Digest',
              description: 'Summary of your account activity',
              icon: <FileText className="h-5 w-5 text-gray-600" />
            },
            {
              key: 'marketing_emails',
              title: 'Marketing Emails',
              description: 'Product updates and promotional content',
              icon: <Zap className="h-5 w-5 text-gray-600" />
            }
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {setting.icon}
                <div>
                  <h4 className="font-medium text-gray-900">{setting.title}</h4>
                  <p className="text-sm text-gray-600">{setting.description}</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={notificationSettings[setting.key as keyof NotificationSettings] as boolean}
                onChange={(enabled) => setNotificationSettings(prev => ({ ...prev, [setting.key]: enabled }))}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button
            onClick={() => saveSettings('Notification', notificationSettings)}
            loading={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Controls</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Visibility
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'private', label: 'Private', description: 'Only you can see your profile' },
                { value: 'public', label: 'Public', description: 'Others can discover your profile' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPrivacySettings(prev => ({ ...prev, profile_visibility: option.value as any }))}
                  className={`
                    p-3 rounded-lg border-2 transition-colors text-left
                    ${privacySettings.profile_visibility === option.value
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-600">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {[
            {
              key: 'asset_discovery',
              title: 'Asset Discovery',
              description: 'Allow others to discover your public assets',
              icon: <Eye className="h-5 w-5 text-gray-600" />
            },
            {
              key: 'analytics_tracking',
              title: 'Analytics Tracking',
              description: 'Help improve TagMyThing with usage analytics',
              icon: <Globe className="h-5 w-5 text-gray-600" />
            },
            {
              key: 'data_sharing',
              title: 'Data Sharing',
              description: 'Share anonymized data for research purposes',
              icon: <Database className="h-5 w-5 text-gray-600" />
            }
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {setting.icon}
                <div>
                  <h4 className="font-medium text-gray-900">{setting.title}</h4>
                  <p className="text-sm text-gray-600">{setting.description}</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={privacySettings[setting.key as keyof PrivacySettings] as boolean}
                onChange={(enabled) => setPrivacySettings(prev => ({ ...prev, [setting.key]: enabled }))}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button
            onClick={() => saveSettings('Privacy', privacySettings)}
            loading={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-gray-600" />
              <div>
                <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ToggleSwitch
                enabled={securitySettings.two_factor_enabled}
                onChange={(enabled) => setSecuritySettings(prev => ({ ...prev, two_factor_enabled: enabled }))}
                disabled={true}
              />
              <span className="text-xs text-gray-500">Coming Soon</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Timeout (minutes)
            </label>
            <select
              value={securitySettings.session_timeout}
              onChange={(e) => setSecuritySettings(prev => ({ ...prev, session_timeout: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={480}>8 hours</option>
              <option value={1440}>24 hours</option>
            </select>
          </div>

          {[
            {
              key: 'login_notifications',
              title: 'Login Notifications',
              description: 'Get notified when someone logs into your account',
              icon: <Bell className="h-5 w-5 text-gray-600" />
            },
            {
              key: 'device_tracking',
              title: 'Device Tracking',
              description: 'Track devices that access your account',
              icon: <Smartphone className="h-5 w-5 text-gray-600" />
            }
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {setting.icon}
                <div>
                  <h4 className="font-medium text-gray-900">{setting.title}</h4>
                  <p className="text-sm text-gray-600">{setting.description}</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={securitySettings[setting.key as keyof SecuritySettings] as boolean}
                onChange={(enabled) => setSecuritySettings(prev => ({ ...prev, [setting.key]: enabled }))}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button
            onClick={() => saveSettings('Security', securitySettings)}
            loading={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <Download className="h-5 w-5 text-primary-600" />
                <h4 className="font-medium text-gray-900">Export Data</h4>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Download all your data in JSON format
              </p>
              <Button
                variant="outline"
                onClick={() => setShowExportModal(true)}
                className="w-full"
              >
                Export Data
              </Button>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <Upload className="h-5 w-5 text-secondary-600" />
                <h4 className="font-medium text-gray-900">Import Data</h4>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Import data from a previous export
              </p>
              <Button
                variant="outline"
                onClick={() => setShowImportModal(true)}
                className="w-full"
                disabled
              >
                Import Data
              </Button>
            </div>
          </div>

          <div className="bg-error-50 border border-error-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-error-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-error-900 mb-1">Delete All Data</h4>
                <p className="text-sm text-error-700 mb-3">
                  Permanently delete all your assets, transactions, and account data. This action cannot be undone.
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteDataModal(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete All Data
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Usage</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Assets Storage</span>
            <span className="text-sm font-medium text-gray-900">0 MB / 1 GB</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary-600 h-2 rounded-full" style={{ width: '0%' }}></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Photos:</span>
              <span className="ml-2 font-medium">0 MB</span>
            </div>
            <div>
              <span className="text-gray-600">Videos:</span>
              <span className="ml-2 font-medium">0 MB</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderHelpSettings = () => (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Help & Support</h3>
        
        <div className="space-y-4">
          {[
            {
              title: 'Documentation',
              description: 'Learn how to use TagMyThing effectively',
              icon: <FileText className="h-5 w-5 text-primary-600" />,
              action: 'View Docs',
              href: '#'
            },
            {
              title: 'Video Tutorials',
              description: 'Watch step-by-step video guides',
              icon: <Video className="h-5 w-5 text-secondary-600" />,
              action: 'Watch Videos',
              href: '#'
            },
            {
              title: 'Contact Support',
              description: 'Get help from our support team',
              icon: <Mail className="h-5 w-5 text-accent-600" />,
              action: 'Contact Us',
              href: 'mailto:support@tagmything.com'
            },
            {
              title: 'Community Forum',
              description: 'Connect with other TagMyThing users',
              icon: <Users className="h-5 w-5 text-success-600" />,
              action: 'Join Forum',
              href: '#'
            }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {item.icon}
                <div>
                  <h4 className="font-medium text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(item.href, '_blank')}
              >
                {item.action}
                <ExternalLink className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">About TagMyThing</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Version:</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Last Updated:</span>
            <span className="font-medium">January 2025</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Build:</span>
            <span className="font-medium font-mono">2025.01.001</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex space-x-4 text-sm">
            <a href="#" className="text-primary-600 hover:text-primary-700">Privacy Policy</a>
            <a href="#" className="text-primary-600 hover:text-primary-700">Terms of Service</a>
            <a href="#" className="text-primary-600 hover:text-primary-700">Changelog</a>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Customize your TagMyThing experience
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors
                      ${activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700 border-primary-200'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    {tab.icon}
                    <span className="font-medium">{tab.name}</span>
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'general' && renderGeneralSettings()}
              {activeTab === 'notifications' && renderNotificationSettings()}
              {activeTab === 'privacy' && renderPrivacySettings()}
              {activeTab === 'security' && renderSecuritySettings()}
              {activeTab === 'data' && renderDataSettings()}
              {activeTab === 'help' && renderHelpSettings()}
            </motion.div>
          </div>
        </div>

        {/* Export Data Modal */}
        <Modal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          title="Export Your Data"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              This will download all your TagMyThing data including profile information, 
              assets, transactions, and settings in JSON format.
            </p>
            
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-primary-700">
                  <p className="font-medium mb-1">What's included:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Profile information</li>
                    <li>Tagged assets metadata</li>
                    <li>Next of Kin data</li>
                    <li>Transaction history</li>
                    <li>Settings and preferences</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowExportModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={exportData}
                loading={exportLoading}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Data Modal */}
        <Modal
          isOpen={showDeleteDataModal}
          onClose={() => setShowDeleteDataModal(false)}
          title="Delete All Data"
        >
          <div className="space-y-4">
            <div className="bg-error-50 border border-error-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-error-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-error-700">
                  <p className="font-medium mb-1">This action is irreversible</p>
                  <p>Deleting all data will permanently remove:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All tagged assets and media files</li>
                    <li>Next of Kin assignments</li>
                    <li>Transaction history</li>
                    <li>Settings and preferences</li>
                  </ul>
                </div>
              </div>
            </div>

            <p className="text-gray-600">
              Are you absolutely sure you want to delete all your data? This action cannot be undone.
            </p>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDataModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  toast.error('Data deletion is not available in this demo');
                  setShowDeleteDataModal(false);
                }}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All Data
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};