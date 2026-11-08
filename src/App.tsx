import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { CategoryManager } from './components/CategoryManager';
import { CampaignSender } from './components/CampaignSender';
import { AIAutoReplyInbox } from './components/AIAutoReplyInbox';
import { ContactPipeline } from './components/ContactPipeline';
import { WhatsAppQRModal } from './components/WhatsAppQRModal';
import { CodeExportModal } from './components/CodeExportModal';
import { SettingsModal } from './components/SettingsModal';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { StaffManagerModal } from './components/StaffManagerModal';
import { AuditLogModal } from './components/AuditLogModal';
import { 
  Category, 
  Contact, 
  WhatsAppMessage, 
  AiPendingResponse, 
  WhatsAppConnectionState, 
  SystemSettings,
  Tenant,
  AppUser,
  SubscriptionPlan,
  AuditLog,
  UserRole,
  StaffPermission
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Multi-Tenant & RBAC Auth State
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string>('tenant_default');
  const [currentUser, setCurrentUser] = useState<AppUser>({
    id: 'usr_gourmet_admin',
    email: 'admin@gourmet.com',
    name: 'Gourmet Business Admin',
    role: 'BUSINESS_ADMIN',
    tenantId: 'tenant_default',
    permissions: ['view_inbox', 'send_messages', 'manage_contacts', 'manage_categories', 'view_analytics'],
    createdAt: new Date().toISOString(),
  });
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | undefined>(undefined);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modals state
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isCodeExportOpen, setIsCodeExportOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState<boolean>(false);

  // Core Application Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [aiQueue, setAiQueue] = useState<AiPendingResponse[]>([]);
  const [connection, setConnection] = useState<WhatsAppConnectionState>({
    status: 'connected',
    phoneNumber: '+92 300 1234567',
    deviceInfo: 'Baileys Multi-Tenant Socket',
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

  // Tenant & User Scoped Headers
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${currentUser.id}`,
    'x-user-email': currentUser.email,
    'x-user-role': currentUser.role,
    'x-tenant-id': activeTenantId,
  });

  // Fetch state from server API
  const fetchState = async () => {
    try {
      const res = await fetch(`/api/state?tenantId=${activeTenantId}`, {
        headers: getHeaders(),
      });
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.user) setCurrentUser(data.user);
        if (data.allUsers) setAllUsers(data.allUsers);
        if (data.tenants) setTenants(data.tenants);
        if (data.plans) setPlans(data.plans);
        if (data.plan) setCurrentPlan(data.plan);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
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
  }, [activeTenantId, currentUser.id]);

  // Session & RBAC Switcher
  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        if (data.user.tenantId) {
          setActiveTenantId(data.user.tenantId);
        }
        fetchState();
      }
    } catch (err) {
      console.error('Error switching user session:', err);
    }
  };

  // Tenant Operations
  const handleSwitchTenant = (tenantId: string) => {
    setActiveTenantId(tenantId);
    setLoading(true);
  };

  const handleCreateTenant = async (name: string, senderNumber: string) => {
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, senderNumber }),
      });
      const data = await res.json();
      if (data.tenant) {
        setActiveTenantId(data.tenant.id);
        fetchState();
      }
    } catch (err) {
      console.error('Error creating tenant:', err);
    }
  };

  const handleUpgradePlan = async (tenantId: string, planId: string) => {
    try {
      const res = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ tenantId, planId }),
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error('Error upgrading subscription plan:', err);
    }
  };

  // Staff Management
  const handleAddStaff = async (name: string, email: string, role: UserRole, permissions: StaffPermission[]) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, email, role, permissions }),
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error('Error adding staff account:', err);
    }
  };

  const handleDeleteStaff = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error('Error deleting staff account:', err);
    }
  };

  // WhatsApp & Data Handlers
  const handleRefreshQr = async () => {
    try {
      const res = await fetch('/api/connection/qr', { method: 'POST', headers: getHeaders() });
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
        headers: getHeaders(),
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
      const res = await fetch('/api/connection/disconnect', { method: 'POST', headers: getHeaders() });
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
        headers: getHeaders(),
        body: JSON.stringify(catData),
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error('Error saving category:', err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (res.ok) fetchState();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const handleSaveContact = async (cntData: Partial<Contact>) => {
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(cntData),
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error('Error saving contact:', err);
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE', headers: getHeaders() });
      const data = await res.json();
      if (res.ok) fetchState();
      return data;
    } catch (err) {
      console.error('Error deleting contact:', err);
      return { error: 'Failed to delete contact' };
    }
  };

  const handleSendMessage = async (contactId: string, categoryId: string) => {
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: getHeaders(),
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
      await fetch('/api/messages/reset-daily-limits', { method: 'POST', headers: getHeaders() });
      fetchState();
    } catch (err) {
      console.error('Error resetting limits:', err);
    }
  };

  const handleSimulateIncoming = async (contactId: string, text: string) => {
    try {
      await fetch('/api/messages/simulate-incoming', {
        method: 'POST',
        headers: getHeaders(),
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
        headers: getHeaders(),
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
        headers: getHeaders(),
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
        headers: getHeaders(),
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
        headers: getHeaders(),
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
        <p className="text-xs font-semibold tracking-wider uppercase text-emerald-400">Loading Multi-Tenant SaaS Engine...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] pb-12">
      {/* Top Mobile-Responsive Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        connection={connection}
        settings={settings}
        tenants={tenants}
        activeTenantId={activeTenantId}
        onSwitchTenant={handleSwitchTenant}
        onCreateTenant={handleCreateTenant}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        totalSentToday={totalSentToday}
        maxDailyTotal={maxDailyTotal}
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        currentPlan={currentPlan}
        onOpenStaffModal={() => setIsStaffModalOpen(true)}
        onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
      />

      {/* Main Dashboard Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {activeTab === 'superadmin' && currentUser.role === 'SUPER_ADMIN' && (
          <SuperAdminDashboard
            tenants={tenants}
            plans={plans}
            auditLogs={auditLogs}
            users={allUsers}
            onCreateTenant={handleCreateTenant}
            onUpgradePlan={handleUpgradePlan}
          />
        )}

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

      <StaffManagerModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        users={allUsers}
        onAddStaff={handleAddStaff}
        onDeleteStaff={handleDeleteStaff}
        currentUser={currentUser}
      />

      <AuditLogModal
        isOpen={isAuditLogsOpen}
        onClose={() => setIsAuditLogsOpen(false)}
        auditLogs={auditLogs}
      />
    </div>
  );
}
