import React, { useState } from 'react';
import { Settings, Database, Bot, X, Check, Globe, Shield, Sparkles } from 'lucide-react';
import { SystemSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onSaveSettings: (newSettings: Partial<SystemSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<SystemSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">System &amp; Database Settings</h2>
              <p className="text-xs text-slate-400">Configure WhatsApp Sender, Urdu Footer, Gemini AI prompt &amp; Supabase</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5 my-4 pr-1 no-scrollbar text-xs">
          {/* WhatsApp Sender & Urdu Footer Section */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Sender Number &amp; Urdu Footer Configuration
            </h3>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Your Personal WhatsApp Number</label>
              <input
                type="text"
                value={formData.senderNumber}
                onChange={(e) => setFormData({ ...formData, senderNumber: e.target.value })}
                placeholder="+92 300 1234567"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Greeting Prefix</label>
              <input
                type="text"
                value={formData.greetingPrefix}
                onChange={(e) => setFormData({ ...formData, greetingPrefix: e.target.value })}
                placeholder="Assalam-o-Alaikum"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-sans"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-300">Urdu Footer Text (Requirement #3)</label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableUrduFooter}
                    onChange={(e) => setFormData({ ...formData, enableUrduFooter: e.target.checked })}
                    className="accent-emerald-500 rounded"
                  />
                  <span className="text-slate-400">Enable Urdu Footer</span>
                </label>
              </div>
              <textarea
                rows={2}
                value={formData.urduFooter}
                onChange={(e) => setFormData({ ...formData, urduFooter: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 font-['Noto_Nastaliq_Urdu',sans-serif] text-sm leading-loose"
              />
            </div>
          </div>

          {/* Gemini AI Auto-Answer Section */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" /> Gemini AI Auto-Answer &amp; 5-Min Delay Queue
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">AI Delay (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.aiDelayMinutes}
                  onChange={(e) => setFormData({ ...formData, aiDelayMinutes: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Requirement #5: 5 minutes</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">AI Auto-Answer Switch</label>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableAiAutoAnswer}
                    onChange={(e) => setFormData({ ...formData, enableAiAutoAnswer: e.target.checked })}
                    className="accent-amber-500 w-4 h-4 rounded"
                  />
                  <span className="text-white font-semibold">Enable Gemini Auto-Reply</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">AI System Instructions Prompt</label>
              <textarea
                rows={3}
                value={formData.aiSystemInstruction}
                onChange={(e) => setFormData({ ...formData, aiSystemInstruction: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-sans leading-relaxed"
              />
            </div>
          </div>

          {/* Supabase Database Connection Config */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" /> Supabase Database Connection (Requirement #7)
            </h3>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Supabase Project URL</label>
              <input
                type="text"
                value={formData.supabaseUrl}
                onChange={(e) => setFormData({ ...formData, supabaseUrl: e.target.value })}
                placeholder="https://xyz.supabase.co"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Supabase Anon Key</label>
              <input
                type="password"
                value={formData.supabaseKey}
                onChange={(e) => setFormData({ ...formData, supabaseKey: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow flex items-center gap-1.5 cursor-pointer"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              <span>{savedSuccess ? 'Settings Saved!' : 'Save System Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
