import React from 'react';
import { 
  Bot, 
  QrCode, 
  Sparkles, 
  Send, 
  Code2, 
  Settings, 
  ShieldCheck, 
  Smartphone,
  Layers,
  Users,
  MessageSquare,
  FolderTree,
  FileJson,
  ArrowLeft,
  Home,
  PhoneCall
} from 'lucide-react';
import { WhatsAppConnectionState, SystemSettings } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  connection: WhatsAppConnectionState;
  settings: SystemSettings;
  onOpenQrModal: () => void;
  onOpenCodeExport: () => void;
  onOpenSettings: () => void;
  totalSentToday: number;
  maxDailyTotal: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  connection,
  settings,
  onOpenQrModal,
  onOpenCodeExport,
  onOpenSettings,
  totalSentToday,
  maxDailyTotal,
}) => {
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
            <span>Connected ({connection.phoneNumber || settings.senderNumber})</span>
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'categories', label: 'Media Folders', icon: FolderTree },
    { id: 'jsoneditor', label: 'contacts.json', icon: FileJson },
    { id: 'campaign', label: 'Bulk Campaign', icon: Send },
    { id: 'inbox', label: 'AI Inbox', icon: MessageSquare },
    { id: 'contacts', label: 'Client Directory', icon: Users },
  ];

  const getPageTitle = () => {
    switch (activeTab) {
      case 'categories': return { title: 'Dynamic Folders & Media Templates', desc: 'Manage media folders and video captions from contacts.json' };
      case 'jsoneditor': return { title: 'contacts.json Live Editor', desc: 'Dynamic configuration without hardcoded categories' };
      case 'campaign': return { title: 'Bulk Category Campaign Dispatcher', desc: 'Smart delay & 2-3 msgs/day anti-spam limiter' };
      case 'inbox': return { title: 'WhatsApp Client Inbox & Gemini AI', desc: '5-minute delayed AI response queue' };
      case 'contacts': return { title: 'Contacts & Category Pipeline', desc: 'Client directory with direct calling & lead status' };
      default: return { title: 'Dashboard Overview', desc: 'Real-time campaign analytics & Baileys device status' };
    }
  };

  const pageInfo = getPageTitle();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
        {/* ROW 1: Logo & Global Quick Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                WhatsApp Dynamic Hub
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  v2.0 Mobile
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden xs:block">Baileys QR &bull; 5-Min Gemini Delay &bull; contacts.json</p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCodeExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Repository</span>
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700/60"
              title="System Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ROW 2: Status Badges Stacked (Baileys Connection + Anti-Spam Meter) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
          <div className="flex flex-wrap items-center gap-2">
            {getStatusBadge()}

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400 text-[11px]">Daily Limit:</span>
              <span className="font-mono text-emerald-400 font-bold">{totalSentToday}/{maxDailyTotal}</span>
            </div>
          </div>

          {/* Explicit Home/Back Button when on internal sub-pages */}
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

        {/* ROW 3: Main Navigation Buttons (Grid/Flex Layout) */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
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

        {/* ROW 4: Context Title & Description with Back Navigation */}
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
    </header>
  );
};
