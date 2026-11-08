import React, { useState } from 'react';
import { 
  Send, 
  ShieldAlert, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Pause, 
  Sparkles,
  Video,
  ArrowLeft
} from 'lucide-react';
import { Category, Contact, WhatsAppMessage, SystemSettings } from '../types';

interface CampaignSenderProps {
  categories: Category[];
  contacts: Contact[];
  settings: SystemSettings;
  onSendMessage: (contactId: string, categoryId: string) => Promise<any>;
  onNavigateTab: (tab: string) => void;
}

export const CampaignSender: React.FC<CampaignSenderProps> = ({
  categories,
  contacts,
  settings,
  onSendMessage,
  onNavigateTab,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [smartDelaySec, setSmartDelaySec] = useState<number>(settings.minSmartDelaySec || 15);
  const [isRunning, setIsRunning] = useState(false);
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [countdownSec, setCountdownSec] = useState(0);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];
  const categoryContacts = contacts.filter((c) => c.category === selectedCategoryId || !c.category);

  const isLimitReached = selectedCategory ? selectedCategory.sentToday >= selectedCategory.dailyLimit : false;
  const remainingDailyAllowance = selectedCategory ? Math.max(0, selectedCategory.dailyLimit - selectedCategory.sentToday) : 0;

  const handleStartCampaign = async () => {
    if (!selectedCategory) return;

    if (isLimitReached) {
      alert(`Rate limit reached for ${selectedCategory.name}! Daily limit is ${selectedCategory.dailyLimit} messages.`);
      return;
    }

    setIsRunning(true);
    setProgressLog([`🚀 Initializing batch campaign for ${selectedCategory.name}...`]);

    const targets = categoryContacts.slice(0, remainingDailyAllowance);
    
    for (let i = 0; i < targets.length; i++) {
      const contact = targets[i];
      setCurrentStepIndex(i + 1);

      setProgressLog((prev) => [
        ...prev,
        `[${i + 1}/${targets.length}] Preparing message for ${contact.name} (${contact.phone})...`,
      ]);

      try {
        const res = await onSendMessage(contact.id, selectedCategory.id);

        if (res.error) {
          setProgressLog((prev) => [...prev, `❌ Error: ${res.error}`]);
          break;
        } else {
          setProgressLog((prev) => [
            ...prev,
            `✅ Sent successfully! Video: "${selectedCategory.videoName}" attached with Salam & Urdu footer.`,
          ]);
        }
      } catch (err) {
        setProgressLog((prev) => [...prev, `❌ Network error sending message`]);
      }

      if (i < targets.length - 1) {
        setProgressLog((prev) => [...prev, `⏳ Smart delay active: waiting ${smartDelaySec}s to prevent spam detection...`]);
        for (let sec = smartDelaySec; sec > 0; sec--) {
          setCountdownSec(sec);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    setIsRunning(false);
    setProgressLog((prev) => [...prev, `🎉 Campaign batch completed successfully!`]);
  };

  return (
    <div className="space-y-6">
      {/* Explicit Back Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('overview')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>&lt; Back to Overview</span>
          </button>
          <div>
            <h2 className="text-base font-bold text-white">Bulk Category Campaign Dispatcher</h2>
            <p className="text-xs text-slate-400">Smart delay &amp; 2-3 daily rate limiter per category</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Campaign Config Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Campaign Configuration</h3>

            {/* Select Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Category / Field</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                disabled={isRunning}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.sentToday}/{cat.dailyLimit} sent today)
                  </option>
                ))}
              </select>
            </div>

            {/* Rate Limit Status Card */}
            {selectedCategory && (
              <div className={`p-4 rounded-xl border ${
                isLimitReached ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30'
              }`}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-white">Daily Anti-Spam Rate Meter</span>
                  <span className={`font-mono font-bold ${isLimitReached ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedCategory.sentToday} / {selectedCategory.dailyLimit} Msgs
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {isLimitReached
                    ? '⚠️ Rate limit reached for today! Reset counters or select another category to send more.'
                    : `✅ Safe to send up to ${remainingDailyAllowance} more personalized messages today.`}
                </p>
              </div>
            )}

            {/* Smart Delay Controls */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Smart Delay Between Messages</label>
                <span className="text-xs font-mono text-emerald-400 font-bold">{smartDelaySec} Seconds</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={smartDelaySec}
                onChange={(e) => setSmartDelaySec(parseInt(e.target.value))}
                disabled={isRunning}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Randomized interval prevents WhatsApp automated account detection.</span>
            </div>

            {/* Target Audience Count */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Matched Contacts:</span>
              <span className="font-bold text-white">{categoryContacts.length} Contacts</span>
            </div>

            {/* Launch Campaign Button */}
            <button
              onClick={handleStartCampaign}
              disabled={isRunning || isLimitReached || categoryContacts.length === 0}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                isRunning || isLimitReached || categoryContacts.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isRunning ? `Sending... (${countdownSec}s delay)` : 'Start Category Campaign Batch'}</span>
            </button>
          </div>
        </div>

        {/* Campaign Execution Console */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" /> Live Campaign Execution Console
                </h3>
                {isRunning && (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    BATCH ACTIVE
                  </span>
                )}
              </div>

              {/* Terminal Log Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 h-80 overflow-y-auto space-y-2 no-scrollbar shadow-inner">
                {progressLog.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                    <Send className="w-8 h-8 opacity-40" />
                    <p className="text-xs">Click "Start Category Campaign Batch" to execute automated dispatch.</p>
                  </div>
                ) : (
                  progressLog.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Strict compliance: 2-3 msgs/category daily limit</span>
              <span className="font-mono text-emerald-400">Footer: Salam + Urdu Contact Text</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
