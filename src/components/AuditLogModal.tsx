import React from 'react';
import { FileText, X, Shield, Clock, User, Building } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLog[];
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose, auditLogs }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">System Security & Audit Activity Logs</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {auditLogs.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-500">No activity logs recorded yet.</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all text-xs space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono font-bold uppercase text-[10px] border border-amber-500/30">
                      {log.action}
                    </span>
                    <span className="font-semibold text-slate-200 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" /> {log.userEmail}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-medium pl-1">{log.details}</p>

                {log.tenantId && (
                  <p className="text-[10px] text-slate-500 font-mono pl-1 flex items-center gap-1">
                    <Building className="w-3 h-3" /> Tenant Context: {log.tenantId}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
