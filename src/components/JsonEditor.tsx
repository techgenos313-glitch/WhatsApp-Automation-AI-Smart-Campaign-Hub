import React, { useState, useEffect } from 'react';
import { FileJson, Save, RefreshCw, Check, AlertCircle, ArrowLeft } from 'lucide-react';

interface JsonEditorProps {
  onStateUpdate: () => void;
  onNavigateTab: (tab: string) => void;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({ onStateUpdate, onNavigateTab }) => {
  const [jsonString, setJsonString] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchContactsJson = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/contacts-json');
      if (res.ok) {
        const data = await res.json();
        setJsonString(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setErrorMsg('Failed to fetch contacts.json');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContactsJson();
  }, []);

  const handleSave = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const parsed = JSON.parse(jsonString);
      const res = await fetch('/api/contacts-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      if (res.ok) {
        setSuccessMsg('contacts.json updated successfully on disk!');
        onStateUpdate();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || 'Failed to save contacts.json');
      }
    } catch (syntaxErr: any) {
      setErrorMsg(`JSON Syntax Error: ${syntaxErr.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Explicit Back Navigation */}
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
            <h2 className="text-base font-bold text-white">contacts.json Dynamic File Editor</h2>
            <p className="text-xs text-slate-400">Zero hardcoded categories &bull; Add any custom field directly</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchContactsJson}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save contacts.json</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Code Editor */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>File: data/contacts.json</span>
          <span>Editable Configuration Object</span>
        </div>

        {isLoading ? (
          <div className="h-96 flex items-center justify-center text-slate-500 text-xs">
            Loading contacts.json...
          </div>
        ) : (
          <textarea
            rows={22}
            value={jsonString}
            onChange={(e) => setJsonString(e.target.value)}
            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed no-scrollbar"
          />
        )}
      </div>
    </div>
  );
};
