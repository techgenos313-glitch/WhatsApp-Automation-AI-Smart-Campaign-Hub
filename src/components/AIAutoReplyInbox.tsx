import React, { useState } from 'react';
import { 
  Bot, 
  MessageSquare, 
  Clock, 
  Send, 
  Sparkles, 
  ArrowLeft, 
  PhoneCall, 
  ExternalLink,
  Globe
} from 'lucide-react';
import { Contact, WhatsAppMessage, AiPendingResponse, Category, SystemSettings } from '../types';

interface AIAutoReplyInboxProps {
  contacts: Contact[];
  messages: WhatsAppMessage[];
  aiQueue: AiPendingResponse[];
  categories: Category[];
  settings: SystemSettings;
  onSimulateIncoming: (contactId: string, text: string) => void;
  onSendNowAi: (queueId: string) => void;
  onCancelAiQueue: (queueId: string) => void;
  onSendDirectMessage: (contactId: string, text: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const AIAutoReplyInbox: React.FC<AIAutoReplyInboxProps> = ({
  contacts,
  messages,
  aiQueue,
  categories,
  settings,
  onSimulateIncoming,
  onSendNowAi,
  onCancelAiQueue,
  onSendDirectMessage,
  onNavigateTab,
}) => {
  const [selectedContactId, setSelectedContactId] = useState<string>(contacts[0]?.id || '');
  const [simulatedQuestionText, setSimulatedQuestionText] = useState('السلام علیکم! مجھے اس آفر کی تمام تفصیلات اور قیمتیں بتائیں۔');
  const [directReplyText, setDirectReplyText] = useState('');

  const activeContact = contacts.find((c) => c.id === selectedContactId) || contacts[0];
  const activeMessages = messages.filter((m) => m.contactId === activeContact?.id).reverse();
  const pendingAiItem = aiQueue.find((q) => q.contactId === activeContact?.id && (q.status === 'waiting' || q.status === 'ready'));

  const handleSimulateQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContact || !simulatedQuestionText.trim()) return;
    onSimulateIncoming(activeContact.id, simulatedQuestionText);
  };

  const setSampleQuestion = (type: 'urdu' | 'roman' | 'english') => {
    if (type === 'urdu') {
      setSimulatedQuestionText('السلام علیکم! کیا ہوم ڈیلیوری دستیاب ہے اور کیا ڈسکاؤنٹ افر ہے؟');
    } else if (type === 'roman') {
      setSimulatedQuestionText('Salam! Mujhe rates aur deals ki detail chahiye.');
    } else {
      setSimulatedQuestionText('Hello, can you please send me the price catalog and booking options?');
    }
  };

  const handleDirectSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContact || !directReplyText.trim()) return;
    onSendDirectMessage(activeContact.id, directReplyText);
    setDirectReplyText('');
  };

  const cleanPhone = activeContact ? activeContact.phone.replace(/[^0-9]/g, '') : '';

  return (
    <div className="space-y-6">
      {/* Explicit Back Header Navigation */}
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
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              WhatsApp Inbox &amp; Bilingual Gemini AI
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Urdu / English Auto-Detect
              </span>
            </h2>
            <p className="text-xs text-slate-400">Gemini detects Urdu/Roman Urdu vs English automatically &amp; applies 5-min timer</p>
          </div>
        </div>

        {activeContact && (
          <div className="flex items-center gap-2">
            <a
              href={`tel:${activeContact.phone}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Client</span>
            </a>
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp Chat</span>
            </a>
          </div>
        )}
      </div>

      {/* Main Inbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[680px]">
        {/* Contact List */}
        <div className="lg:col-span-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col h-full">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">Active Client Chats</h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
            {contacts.map((contact) => {
              const isSelected = contact.id === activeContact?.id;
              const hasPendingAi = aiQueue.some((q) => q.contactId === contact.id && (q.status === 'waiting' || q.status === 'ready'));
              const lastMsg = messages.find((m) => m.contactId === contact.id);

              return (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContactId(contact.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-950 border-emerald-500/50 shadow-md'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white truncate">{contact.name}</span>
                    {hasPendingAi && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Clock className="w-3 h-3 animate-spin" /> 5m Delay
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate font-mono">{contact.phone}</p>
                  {lastMsg && (
                    <p className="text-[11px] text-slate-400 truncate mt-1">
                      {lastMsg.direction === 'outgoing' ? 'You: ' : 'Client: '}{lastMsg.content}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Chat Window */}
        {activeContact && (
          <div className="lg:col-span-8 p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between h-full">
            {/* Header & Quick Language Samples */}
            <div className="pb-3 border-b border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{activeContact.name}</span>
                    <span className="text-xs font-mono text-emerald-400">{activeContact.phone}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Status: {activeContact.status}</span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bilingual Gemini SDK</span>
                </div>
              </div>

              {/* Simulation Quick Launcher & Preset Buttons */}
              <form onSubmit={handleSimulateQuestionSubmit} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={simulatedQuestionText}
                    onChange={(e) => setSimulatedQuestionText(e.target.value)}
                    placeholder="Type client question..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer whitespace-nowrap flex items-center gap-1.5 shadow"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>Simulate Incoming</span>
                  </button>
                </div>

                {/* Preset Language Test Triggers */}
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-400 font-semibold">Test Language:</span>
                  <button
                    type="button"
                    onClick={() => setSampleQuestion('urdu')}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-['Noto_Nastaliq_Urdu',sans-serif] text-xs"
                  >
                    Urdu Script
                  </button>
                  <button
                    type="button"
                    onClick={() => setSampleQuestion('roman')}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-[10px]"
                  >
                    Roman Urdu
                  </button>
                  <button
                    type="button"
                    onClick={() => setSampleQuestion('english')}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 font-sans text-[10px]"
                  >
                    English
                  </button>
                </div>
              </form>
            </div>

            {/* 5-Min AI Delay Queue Banner */}
            {pendingAiItem && (
              <div className="my-2 p-4 rounded-xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/40 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="text-xs font-bold text-amber-300">Gemini Bilingual AI Reply (5-Min Timer Active)</span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {pendingAiItem.status === 'ready' ? 'Ready!' : `${Math.floor(pendingAiItem.delaySecondsLeft / 60)}m ${pendingAiItem.delaySecondsLeft % 60}s remaining`}
                  </span>
                </div>

                <div className="text-xs text-slate-200 bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-mono">Auto-Detected Answer Preview:</span>
                  <p className="italic text-emerald-300">"{pendingAiItem.generatedAnswer}"</p>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => onCancelAiQueue(pendingAiItem.id)}
                    className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs font-semibold cursor-pointer"
                  >
                    Cancel Reply
                  </button>
                  <button
                    onClick={() => onSendNowAi(pendingAiItem.id)}
                    className="px-4 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow"
                  >
                    Send Now (Skip Timer)
                  </button>
                </div>
              </div>
            )}

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto my-2 space-y-3 p-2 bg-slate-950/50 rounded-xl border border-slate-800/80 no-scrollbar">
              {activeMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.direction === 'outgoing' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.direction === 'outgoing'
                        ? 'bg-emerald-600/20 border border-emerald-500/30 text-slate-100 rounded-tr-none'
                        : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    {msg.isAiGenerated && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 mb-1 border-b border-amber-500/20 pb-1">
                        <Bot className="w-3 h-3" />
                        <span>Bilingual Gemini AI Auto-Answer</span>
                      </div>
                    )}

                    <div className="whitespace-pre-line font-sans">{msg.content}</div>

                    {msg.footerText && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-emerald-300 font-['Noto_Nastaliq_Urdu',sans-serif]">
                        {msg.footerText}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>

            {/* Direct Reply Bar */}
            <form onSubmit={handleDirectSendSubmit} className="flex gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={directReplyText}
                onChange={(e) => setDirectReplyText(e.target.value)}
                placeholder="Type manual reply from personal WhatsApp number..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow cursor-pointer"
              >
                Send Direct
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
