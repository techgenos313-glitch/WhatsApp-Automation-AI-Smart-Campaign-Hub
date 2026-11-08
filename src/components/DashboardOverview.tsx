import React, { useState } from 'react';
import { 
  Send, 
  MessageSquare, 
  Clock, 
  TrendingUp, 
  ShieldAlert, 
  QrCode, 
  CheckCircle2, 
  Play, 
  RotateCcw, 
  Bot, 
  Building2, 
  Utensils, 
  Pill, 
  Home, 
  ArrowRight,
  Sparkles,
  PhoneCall,
  UserCheck
} from 'lucide-react';
import { Category, Contact, WhatsAppMessage, AiPendingResponse, WhatsAppConnectionState, SystemSettings } from '../types';

interface DashboardOverviewProps {
  categories: Category[];
  contacts: Contact[];
  messages: WhatsAppMessage[];
  aiQueue: AiPendingResponse[];
  connection: WhatsAppConnectionState;
  settings: SystemSettings;
  onOpenQrModal: () => void;
  onNavigateTab: (tab: string) => void;
  onSimulateIncoming: (contactId: string, text: string) => void;
  onResetLimits: () => void;
  onSendNowAi: (queueId: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  categories,
  contacts,
  messages,
  aiQueue,
  connection,
  settings,
  onOpenQrModal,
  onNavigateTab,
  onSimulateIncoming,
  onResetLimits,
  onSendNowAi,
}) => {
  const [testQuestion, setTestQuestion] = useState('Salam! Mujhe Deals aur prices ki details mil sakti hain?');
  const [selectedTestContact, setSelectedTestContact] = useState(contacts[0]?.id || '');

  const totalSentToday = categories.reduce((sum, c) => sum + c.sentToday, 0);
  const totalDailyAllowed = categories.reduce((sum, c) => sum + c.dailyLimit, 0);
  const pendingAiCount = aiQueue.filter((item) => item.status === 'waiting' || item.status === 'ready').length;
  const interestedLeadsCount = contacts.filter((c) => c.status === 'interested' || c.status === 'converted').length;
  const totalRepliesReceived = messages.filter((m) => m.direction === 'incoming').length;

  const handleSimulateTest = () => {
    if (!selectedTestContact) return;
    onSimulateIncoming(selectedTestContact, testQuestion);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Sent Today */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Messages Sent</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{totalSentToday}</span>
            <span className="text-xs text-slate-400">/ {totalDailyAllowed} max today</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Smart rate-limited batching</p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none"></div>
        </div>

        {/* Rate Safety Meter */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Anti-Spam Safety</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">100% Safe</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">2-3 msgs/category/day threshold</p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all pointer-events-none"></div>
        </div>

        {/* Client Replies */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Replies Received</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{totalRepliesReceived}</span>
            <span className="text-xs text-purple-400 font-medium">Active conversations</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Clients responding to video ads</p>
        </div>

        {/* Pending 5-Min AI Replies */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI 5-Min Queue</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">{pendingAiCount}</span>
            <span className="text-xs text-slate-400">Pending auto-reply</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Smart delay active</p>
        </div>

        {/* Hot Leads */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hot Leads</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-teal-300">{interestedLeadsCount}</span>
            <span className="text-xs text-slate-400">Interested clients</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Ready for follow-up</p>
        </div>
      </div>

      {/* Main Grid: WhatsApp Connection & Field Rate Limit breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection & Baileys Setup Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                <h2 className="text-base font-bold text-white">WhatsApp Baileys Connection</h2>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                QR Socket Active
              </span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">Sender Number:</span>
                <span className="font-mono font-semibold text-white">{settings.senderNumber}</span>
              </div>
              <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">Engine Type:</span>
                <span className="text-emerald-400 font-medium">@whiskeysockets/baileys (v6.6.0)</span>
              </div>
              <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">Auth State:</span>
                <span className="text-slate-200">Multi-File Auth (multi_file_baileys_auth)</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Connect your personal WhatsApp number via QR code scan without official Meta API keys. All category promo videos & salam greetings will be delivered directly from your number.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onOpenQrModal}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>{connection.status === 'connected' ? 'View Linked QR Device' : 'Scan WhatsApp QR'}</span>
            </button>
            <button
              onClick={() => onNavigateTab('inbox')}
              className="flex items-center justify-center p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 cursor-pointer"
              title="Open Live Chat Simulator"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Categories Daily Limits Grid */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Category Daily Limits & Status</h2>
              <p className="text-xs text-slate-400">Daily 2-3 message limit per field category to prevent spam flags</p>
            </div>
            <button
              onClick={onResetLimits}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 cursor-pointer transition-all"
              title="Reset today's rate counters for testing"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Counters</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const isMaxed = cat.sentToday >= cat.dailyLimit;
              const percentage = Math.min(100, Math.round((cat.sentToday / cat.dailyLimit) * 100));

              return (
                <div 
                  key={cat.id} 
                  className={`p-4 rounded-xl border transition-all ${
                    isMaxed 
                      ? 'bg-rose-500/5 border-rose-500/30' 
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">
                        {cat.name.charAt(0)}
                      </div>
                      <span className="text-sm font-semibold text-white">{cat.name}</span>
                    </div>
                    <span className={`text-xs font-mono font-bold ${isMaxed ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {cat.sentToday} / {cat.dailyLimit}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        isMaxed ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[150px]">{cat.videoName}</span>
                    {isMaxed ? (
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Rate Limit Met
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium">Ready ({cat.dailyLimit - cat.sentToday} left)</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Quick Test Launcher: Simulate Client Reply & Watch 5-Min AI Delayed Worker */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bot className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Simulate Client Question &amp; 5-Min AI Delayed Auto-Answer
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  Feature #5 Test
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                When a client replies to your promotional video message, Gemini AI generates a smart answer but holds it in a 5-minute delayed queue before sending.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-slate-400 mb-1">Select Client</label>
            <select
              value={selectedTestContact}
              onChange={(e) => setSelectedTestContact(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1">Client WhatsApp Question</label>
            <input
              type="text"
              value={testQuestion}
              onChange={(e) => setTestQuestion(e.target.value)}
              placeholder="e.g. Assalam-o-Alaikum, is room available this weekend?"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleSimulateTest}
              className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Simulate Reply</span>
            </button>
          </div>
        </div>

        {/* Live Pending AI Queue List */}
        {aiQueue.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Pending AI Delayed Response Queue ({aiQueue.length})
            </h3>
            <div className="space-y-2">
              {aiQueue.slice(0, 3).map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/20 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-mono font-bold text-xs">
                      {item.delaySecondsLeft}s
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{item.contactName}</span>
                        <span className="text-[10px] text-slate-400">({item.contactPhone})</span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-1">Q: "{item.incomingMessage}"</p>
                      <p className="text-[11px] text-emerald-400 line-clamp-1 font-mono">AI: "{item.generatedAnswer}"</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/30">
                      {item.status === 'ready' ? 'Ready!' : `${Math.floor(item.delaySecondsLeft / 60)}m ${item.delaySecondsLeft % 60}s left`}
                    </span>
                    <button
                      onClick={() => onSendNowAi(item.id)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow"
                    >
                      Send Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity Message Logs */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Recent WhatsApp Activity Log</h2>
            <p className="text-xs text-slate-400">Real-time log of sent videos, greetings, Urdu footers and AI auto-answers</p>
          </div>
          <button
            onClick={() => onNavigateTab('campaign')}
            className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold hover:text-emerald-300 transition-all cursor-pointer"
          >
            <span>Launch Bulk Campaign</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {messages.slice(0, 5).map((msg) => (
            <div 
              key={msg.id} 
              className={`p-4 rounded-xl border ${
                msg.direction === 'outgoing'
                  ? 'bg-slate-950/70 border-slate-800'
                  : 'bg-emerald-950/20 border-emerald-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${msg.direction === 'outgoing' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {msg.direction === 'outgoing' ? 'OUTGOING (Sent)' : 'INCOMING (Client Reply)'}
                  </span>
                  <span className="text-xs font-semibold text-white">&bull; {msg.contactName}</span>
                  <span className="text-[11px] text-slate-400">({msg.contactPhone})</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1 font-['Plus_Jakarta_Sans',sans-serif] whitespace-pre-line">
                {msg.content}
              </div>

              {msg.footerText && (
                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-emerald-300 font-['Noto_Nastaliq_Urdu',sans-serif]">
                  <span>{msg.footerText}</span>
                  <span className="text-[10px] text-slate-500 font-sans">Urdu Footer</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
