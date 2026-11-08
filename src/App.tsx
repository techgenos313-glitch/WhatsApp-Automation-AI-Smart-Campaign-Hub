import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { CategoryManager } from './components/CategoryManager';
import { JsonEditor } from './components/JsonEditor';
import { CampaignSender } from './components/CampaignSender';
import { AIAutoReplyInbox } from './components/AIAutoReplyInbox';
import { ContactPipeline } from './components/ContactPipeline';
import { WhatsAppQRModal } from './components/WhatsAppQRModal';
import { CodeExportModal } from './components/CodeExportModal';
import { SettingsModal } from './components/SettingsModal';
import { 
  Category, 
  Contact, 
  WhatsAppMessage, 
  AiPendingResponse, 
  WhatsAppConnectionState, 
  SystemSettings 
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Modals state
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isCodeExportOpen, setIsCodeExportOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Core Application Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [aiQueue, setAiQueue] = useState<AiPendingResponse[]>([]);
  const [connection, setConnection] = useState<WhatsAppConnectionState>({
    status: 'connected',
    phoneNumber: '+92 300 1234567',
    deviceInfo: 'Baileys Multi-File Auth',
    qrCodeDataUrl: '',
    qrCodeRaw: '',
  });
  const [settings, setSettings] = useState<SystemSettings>({
    senderNumber: '+92 300 1234567',
    greetingPrefix: 'السلام علیکم',
    urduFooter: 'اگر آپ اس میں انٹرسٹڈ ہیں تو مزید معلومات کے لیے اس نمبر پر رابطہ کر سکتے ہیں۔',
    enableUrduFooter: true,
    defaultDailyLimitPerCategory: 3,
    minSmartDelaySec: 10,
    maxSmartDelaySec: 30,
    aiDelayMinutes: 5,
    enableAiAutoAnswer: true,
    aiSystemInstruction: 'You are an AI Sales & Customer Support Assistant.',
    supabaseUrl: '',
    supabaseKey: '',
    isSupabaseConnected: false,
  });

  const [loading, setLoading] = useState<boolean>(true);

  // Fetch state from server API
  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setContacts(data.contacts || []);
        setMessages(data.messages || []);
        setAiQueue(data.aiQueue || []);
        if (data.connection) setConnection(data.connection);
        if (data.settings) setSettings(data.settings);
      }
    } catch (err) {
      console.error('Error fetching system state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, []);

  // Handler functions
  const handleRefreshQr = async () => {
    try {
      const res = await fetch('/api/connection/qr', { method: 'POST' });
      const data = await res.json();
      if (data.connection) setConnection(data.connection);
    } catch (err) {
      console.error('Error refreshing QR code:', err);
    }
  };

  const handleConnect = async (phoneNumber?: string) => {
    try {
      const res = await fetch('/api/connection/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      if (data.connection) setConnection(data.connection);
      setIsQrModalOpen(false);
    } catch (err) {
      console.error('Error connecting WhatsApp:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      const res = await fetch('/api/connection/disconnect', { method: 'POST' });
      const data = await res.json();
      if (data.connection) setConnection(data.connection);
    } catch (err) {
      console.error('Error disconnecting WhatsApp:', err);
    }
  };

  const handleSaveCategory = async (catData: Partial<Category>) => {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catData),
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error('Error saving category:', err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) fetchState();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const handleSaveContact = async (cntData: Partial<Contact>) => {
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cntData),
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error('Error saving contact:', err);
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) fetchState();
    } catch (err) {
      console.error('Error deleting contact:', err);
    }
  };

  const handleSendMessage = async (contactId: string, categoryId: string) => {
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, categoryId }),
      });
      const data = await res.json();
      fetchState();
      return data;
    } catch (err) {
      console.error('Error sending message:', err);
      return { error: 'Network communication failure' };
    }
  };

  const handleResetDailyLimits = async () => {
    try {
      await fetch('/api/messages/reset-daily-limits', { method: 'POST' });
      fetchState();
    } catch (err) {
      console.error('Error resetting limits:', err);
    }
  };

  const handleSimulateIncoming = async (contactId: string, text: string) => {
    try {
      await fetch('/api/messages/simulate-incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, text }),
      });
      fetchState();
    } catch (err) {
      console.error('Error simulating incoming message:', err);
    }
  };

  const handleSendNowAi = async (queueId: string) => {
    try {
      await fetch('/api/ai-queue/send-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId }),
      });
      fetchState();
    } catch (err) {
      console.error('Error forcing AI response dispatch:', err);
    }
  };

  const handleCancelAiQueue = async (queueId: string) => {
    try {
      await fetch('/api/ai-queue/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId }),
      });
      fetchState();
    } catch (err) {
      console.error('Error cancelling AI response:', err);
    }
  };

  const handleSendDirectMessage = async (contactId: string, text: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;

    try {
      await fetch('/api/messages/simulate-incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, text, customDelaySec: 0 }),
      });
      fetchState();
    } catch (err) {
      console.error('Error sending direct message:', err);
    }
  };

  const handleSaveSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const totalSentToday = categories.reduce((sum, c) => sum + c.sentToday, 0);
  const maxDailyTotal = categories.reduce((sum, c) => sum + c.dailyLimit, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-3 font-sans">
        <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
        <p className="text-xs font-semibold tracking-wider uppercase text-emerald-400">Loading Mobile Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] pb-12">
      {/* Top Mobile-Responsive Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        connection={connection}
        settings={settings}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenCodeExport={() => setIsCodeExportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        totalSentToday={totalSentToday}
        maxDailyTotal={maxDailyTotal}
      />

      {/* Main Dashboard Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {activeTab === 'overview' && (
          <DashboardOverview
            categories={categories}
            contacts={contacts}
            messages={messages}
            aiQueue={aiQueue}
            connection={connection}
            settings={settings}
            onOpenQrModal={() => setIsQrModalOpen(true)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSimulateIncoming={handleSimulateIncoming}
            onResetLimits={handleResetDailyLimits}
            onSendNowAi={handleSendNowAi}
          />
        )}

        {activeTab === 'categories' && (
          <CategoryManager
            categories={categories}
            settings={settings}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'jsoneditor' && (
          <JsonEditor 
            onStateUpdate={fetchState} 
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'campaign' && (
          <CampaignSender
            categories={categories}
            contacts={contacts}
            settings={settings}
            onSendMessage={handleSendMessage}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'inbox' && (
          <AIAutoReplyInbox
            contacts={contacts}
            messages={messages}
            aiQueue={aiQueue}
            categories={categories}
            settings={settings}
            onSimulateIncoming={handleSimulateIncoming}
            onSendNowAi={handleSendNowAi}
            onCancelAiQueue={handleCancelAiQueue}
            onSendDirectMessage={handleSendDirectMessage}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'contacts' && (
          <ContactPipeline
            contacts={contacts}
            categories={categories}
            onSaveContact={handleSaveContact}
            onDeleteContact={handleDeleteContact}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}
      </main>

      {/* Modals */}
      <WhatsAppQRModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        connection={connection}
        onRefreshQr={handleRefreshQr}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      <CodeExportModal
        isOpen={isCodeExportOpen}
        onClose={() => setIsCodeExportOpen(false)}
        settings={settings}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}
