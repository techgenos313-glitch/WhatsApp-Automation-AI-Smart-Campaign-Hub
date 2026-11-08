import React, { useState } from 'react';
import { UserCog, Plus, Trash2, X, Shield, Check, Lock } from 'lucide-react';
import { AppUser, StaffPermission, UserRole } from '../types';

interface StaffManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  onAddStaff: (name: string, email: string, role: UserRole, permissions: StaffPermission[]) => void;
  onDeleteStaff: (userId: string) => void;
  currentUser: AppUser;
}

export const StaffManagerModal: React.FC<StaffManagerModalProps> = ({
  isOpen,
  onClose,
  users,
  onAddStaff,
  onDeleteStaff,
  currentUser,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [permissions, setPermissions] = useState<StaffPermission[]>([
    'view_inbox',
    'send_messages',
    'manage_contacts',
  ]);

  if (!isOpen) return null;

  const handlePermissionToggle = (perm: StaffPermission) => {
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter((p) => p !== perm));
    } else {
      setPermissions([...permissions, perm]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onAddStaff(name, email, role, permissions);
    setName('');
    setEmail('');
  };

  const allAvailablePermissions: { id: StaffPermission; label: string; desc: string }[] = [
    { id: 'view_inbox', label: 'View AI Inbox', desc: 'Can view client chats and Gemini AI queue answers' },
    { id: 'send_messages', label: 'Dispatch Broadcasts', desc: 'Can trigger campaigns & manual message sends' },
    { id: 'manage_contacts', label: 'Client Directory', desc: 'Can add, edit, or delete client contacts' },
    { id: 'manage_categories', label: 'Category & Media Folders', desc: 'Can modify video templates & daily limits' },
    { id: 'view_analytics', label: 'Business Analytics', desc: 'Can view reporting & campaign statistics' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UserCog className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Staff Account & Permission Management</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add New Staff Form */}
        <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Invite / Create Staff User
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Hassan Raza"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hassan@gourmet.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Assigned RBAC Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
            >
              <option value="STAFF">STAFF AGENT (Custom Granted Permissions)</option>
              <option value="BUSINESS_ADMIN">BUSINESS ADMIN (Full Business Control)</option>
              {currentUser.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">SUPER ADMIN (Platform Owner)</option>}
            </select>
          </div>

          {role === 'STAFF' && (
            <div className="space-y-2 pt-1">
              <label className="block text-[11px] font-semibold text-slate-300">Granted Staff Permissions</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allAvailablePermissions.map((p) => {
                  const isChecked = permissions.includes(p.id);
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => handlePermissionToggle(p.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2 ${
                        isChecked
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 ${isChecked ? 'bg-emerald-500 text-slate-950 font-bold' : 'border border-slate-700'}`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{p.label}</p>
                        <p className="text-[10px] text-slate-400">{p.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition-all cursor-pointer"
            >
              Create Staff Account
            </button>
          </div>
        </form>

        {/* Existing Users Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Active Accounts in Current Organization ({users.length})
          </h4>

          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-2">
                      {u.name}
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        u.role === 'SUPER_ADMIN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                        u.role === 'BUSINESS_ADMIN' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {u.role}
                      </span>
                    </p>
                    <p className="text-[11px] font-mono text-slate-400">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {u.id !== currentUser.id && (
                    <button
                      onClick={() => onDeleteStaff(u.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold cursor-pointer transition-all"
                      title="Remove Staff Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
