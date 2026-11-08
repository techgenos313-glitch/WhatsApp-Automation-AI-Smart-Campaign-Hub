import React, { useState } from 'react';
import { 
  Bot, 
  QrCode, 
  Settings, 
  ShieldCheck, 
  Smartphone,
  Layers,
  Users,
  MessageSquare,
  FolderTree,
  ArrowLeft,
  Home,
  Building,
  ChevronDown,
  Plus,
  Shield,
  UserCheck,
  Crown,
  UserCog,
  FileText
} from 'lucide-react';
import { WhatsAppConnectionState, SystemSettings, Tenant, AppUser, SubscriptionPlan } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  connection: WhatsAppConnectionState;
  settings: SystemSettings;
  tenants: Tenant[];
  activeTenantId: string;
  onSwitchTenant: (tenantId: string) => void;
  onCreateTenant: (name: string, senderNumber: string) => void;
  onOpenQrModal: () => void;
  onOpenSettings: () => void;
  totalSentToday: number;
  maxDailyTotal: number;
  currentUser: AppUser;
  allUsers: AppUser[];
  onSwitchUser: (userId: string) => void;
  currentPlan?: SubscriptionPlan;
  onOpenStaffModal: () => void;
  onOpenAuditLogs: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  connection,
  settings,
  tenants,
  activeTenantId,
  onSwitchTenant,
  onCreateTenant,
  onOpenQrModal,
  onOpenSettings,
  totalSentToday,
  maxDailyTotal,
  currentUser,
  allUsers,
  onSwitchUser,
  currentPlan,
  onOpenStaffModal,
  onOpenAuditLogs,
}) => {
  const [isTenantMenuOpen, setIsTenantMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNewTenantModalOpen, setIsNewTenantModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgPhone, setNewOrgPhone] = useState('+92 ');

  const currentTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0];

  const handleCreateTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    onCreateTenant(newOrgName, newOrgPhone);
    setNewOrgName('');
    setIsNewTenantModalOpen(false);
  };

  const getStatusBadge = () => {
    switch (connection.status) {
      case 'connected':
        return (
          <button 
            onClick={onOpenQrModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <Smartphone className="w-3.5 h-3.5" />
            <span>WhatsApp Linked ({connection.phoneNumber || settings.senderNumber})</span>
          </button>
        );
      case 'qr_ready':
      case 'connecting':
        return (
          <button 
            onClick={onOpenQrModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-all cursor-pointer animate-pulse whitespace-nowrap"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan QR Code</span>
          </button>
        );
      default:
        return (
          <button 
            onClick={onOpenQrModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium hover:bg-rose-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Disconnected</span>
          </button>
        );
    }
  };

  // Build navigation tabs based on user role and staff permissions
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers, show: true },
    { id: 'categories', label: 'Media Folders', icon: FolderTree, show: currentUser.role !== 'STAFF' || currentUser.permissions.includes('manage_categories') },
    { id: 'campaign', label: 'Bulk Campaign', icon: Shield, show: currentUser.role !== 'STAFF' || currentUser.permissions.includes('send_messages') },
    { id: 'inbox', label: 'AI Inbox', icon: MessageSquare, show: currentUser.role !== 'STAFF' || currentUser.permissions.includes('view_inbox') },
    { id: 'contacts', label: 'Client Directory', icon: Users, show: currentUser.role !== 'STAFF' || currentUser.permissions.includes('manage_contacts') },
    { id: 'superadmin', label: 'Super Admin Portal', icon: Crown, show: currentUser.role === 'SUPER_ADMIN' },
  ].filter(t => t.show);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'categories': return { title: 'Media Folders & Video Templates', desc: 'Organize category promo videos, captions, and daily limits' };
      case 'campaign': return { title: 'Bulk Campaign Dispatcher', desc: 'Automated category broadcasting with smart rate limits' };
      case 'inbox': return { title: 'WhatsApp Client Inbox', desc: 'Automated 5-minute delayed AI response engine' };
      case 'contacts': return { title: 'Client Directory & Pipeline', desc: 'Client database with direct calling & WhatsApp actions' };
      case 'superadmin': return { title: 'Super Admin Platform Portal', desc: 'Platform tenant controls, subscription plans, and global analytics' };
      default: return { title: 'Dashboard Overview', desc: 'Real-time campaign analytics & WhatsApp status' };
    }
  };

  const pageInfo = getPageTitle();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold uppercase">Super Admin</span>;
      case 'BUSINESS_ADMIN':
        return <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold uppercase">Business Owner</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase">Staff Agent</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
        {/* ROW 1: Logo, Organization Switcher, User Auth Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Tenant Selector */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            {/* Tenant Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsTenantMenuOpen(!isTenantMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <Building className="w-3.5 h-3.5 text-indigo-400" />
                <span className="truncate max-w-[150px] sm:max-w-[200px]">{currentTenant?.name || 'SaaS Organization'}</span>
                {currentPlan && (
                  <span className="hidden md:inline-block px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30">
                    {currentPlan.name.split(' ')[0]}
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Organization Switcher Menu */}
              {isTenantMenuOpen && (
                <div className="absolute top-11 left-0 z-50 w-64 p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-1 animate-fadeIn">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 flex justify-between">
                    <span>Switch Organization</span>
                    {currentUser.role === 'SUPER_ADMIN' && <span className="text-purple-400">All Access</span>}
                  </div>

                  {tenants.map((tenant) => (
                    <button
                      key={tenant.id}
                      onClick={() => {
                        onSwitchTenant(tenant.id);
                        setIsTenantMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        tenant.id === activeTenantId
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{tenant.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">{tenant.senderNumber}</span>
                    </button>
                  ))}

                  {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'BUSINESS_ADMIN') && (
                    <button
                      onClick={() => {
                        setIsTenantMenuOpen(false);
                        setIsNewTenantModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-indigo-400 hover:bg-indigo-500/10 flex items-center gap-2 pt-2 border-t border-slate-800 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Business Tenant</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* User Profile & Role Dropdown */}
          <div className="flex items-center gap-2">
            {/* Quick RBAC User Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-800 border border-slate-700">
                  <img src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={currentUser.name} className="w-full h-full object-cover" />
                </div>
                <span className="truncate max-w-[120px] hidden xs:inline">{currentUser.name}</span>
                {getRoleBadge(currentUser.role)}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute top-11 right-0 z-50 w-72 p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-1 animate-fadeIn">
                  <div className="px-3 py-2 bg-slate-950 rounded-xl mb-1 border border-slate-800">
                    <p className="text-xs font-bold text-white">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{currentUser.email}</p>
                  </div>

                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                    Demo Role & Session Switcher
                  </div>

                  {allUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        onSwitchUser(user.id);
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                        user.id === currentUser.id ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate">
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                      </div>
                      {getRoleBadge(user.role)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Staff Management Modal Trigger */}
            {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'BUSINESS_ADMIN') && (
              <button
                onClick={onOpenStaffModal}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700/60 shadow-sm flex items-center gap-1.5 text-xs font-semibold"
                title="Manage Staff & Permissions"
              >
                <UserCog className="w-4 h-4 text-indigo-400" />
                <span className="hidden md:inline">Staff</span>
              </button>
            )}

            {/* Audit Logs */}
            <button
              onClick={onOpenAuditLogs}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700/60 shadow-sm flex items-center gap-1.5 text-xs font-semibold"
              title="View Platform & Audit Logs"
            >
              <FileText className="w-4 h-4 text-amber-400" />
            </button>

            {/* Organization Settings */}
            {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'BUSINESS_ADMIN') && (
              <button
                onClick={onOpenSettings}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700/60 shadow-sm flex items-center gap-1.5"
                title="Organization System Settings"
              >
                <Settings className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200 hidden sm:inline">Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* ROW 2: Connection & Rate Limit Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
          <div className="flex flex-wrap items-center gap-2">
            {getStatusBadge()}

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400 text-[11px]">Anti-Spam Meter:</span>
              <span className="font-mono text-emerald-400 font-bold">{totalSentToday}/{maxDailyTotal}</span>
            </div>
          </div>

          {/* Explicit Home/Back Button */}
          {activeTab !== 'overview' && (
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </button>
          )}
        </div>

        {/* ROW 3: Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 pt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ROW 4: Context Title */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              {pageInfo.title}
            </h2>
            <p className="text-[11px] text-slate-400 line-clamp-1">{pageInfo.desc}</p>
          </div>

          {activeTab !== 'overview' && (
            <button
              onClick={() => setActiveTab('overview')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer shrink-0 border border-slate-700/50 flex items-center gap-1 text-xs font-semibold"
              title="Return to Dashboard Overview"
            >
              <Home className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Home</span>
            </button>
          )}
        </div>
      </div>

      {/* New Tenant Modal */}
      {isNewTenantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create New SaaS Business Tenant</h3>

            <form onSubmit={handleCreateTenantSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Apex Clothing Brand"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sender WhatsApp Phone Number</label>
                <input
                  type="text"
                  required
                  value={newOrgPhone}
                  onChange={(e) => setNewOrgPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTenantModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow"
                >
                  Create Tenant Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
