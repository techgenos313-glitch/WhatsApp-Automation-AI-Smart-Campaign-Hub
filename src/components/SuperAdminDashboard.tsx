import React, { useState } from 'react';
import { 
  Building, 
  Crown, 
  DollarSign, 
  Users, 
  MessageSquare, 
  ShieldAlert, 
  Plus, 
  CheckCircle2, 
  Zap, 
  Activity,
  Layers,
  Sparkles,
  Search
} from 'lucide-react';
import { Tenant, SubscriptionPlan, AuditLog, AppUser } from '../types';

interface SuperAdminDashboardProps {
  tenants: Tenant[];
  plans: SubscriptionPlan[];
  auditLogs: AuditLog[];
  users: AppUser[];
  onCreateTenant: (name: string, senderNumber: string) => void;
  onUpgradePlan: (tenantId: string, planId: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  tenants,
  plans,
  auditLogs,
  users,
  onCreateTenant,
  onUpgradePlan,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewTenantOpen, setIsNewTenantOpen] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantPhone, setNewTenantPhone] = useState('+92 ');

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.senderNumber.includes(searchTerm)
  );

  const totalRevenue = tenants.reduce((acc, t) => {
    const plan = plans.find(p => p.id === t.planId);
    return acc + (plan?.priceMonthly || 79);
  }, 0);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;
    onCreateTenant(newTenantName, newTenantPhone);
    setNewTenantName('');
    setIsNewTenantOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Platform Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-900/40 to-slate-900 border border-purple-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Total SaaS Businesses</span>
            <Building className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white">{tenants.length}</p>
          <p className="text-[11px] text-purple-400 mt-1">Multi-Tenant Isolated Instances</p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Platform MRR</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">${totalRevenue} <span className="text-xs text-slate-400 font-normal">/mo</span></p>
          <p className="text-[11px] text-emerald-400 mt-1">Active Recurring Subscriptions</p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Platform Users & Staff</span>
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">{users.length}</p>
          <p className="text-[11px] text-indigo-400 mt-1">RBAC Authenticated Accounts</p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-900/40 to-slate-900 border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">System Health</span>
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> 100% Operational
          </p>
          <p className="text-[11px] text-amber-400 mt-1">Baileys Sockets Active</p>
        </div>
      </div>

      {/* Subscription Plans Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" /> Platform Commercial Subscription Plans
            </h3>
            <p className="text-xs text-slate-400">Configure feature matrix and limits for each subscription tier</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-white">{plan.name}</h4>
                  <p className="text-xl font-extrabold text-emerald-400 mt-1">${plan.priceMonthly}<span className="text-xs text-slate-400 font-normal"> /mo</span></p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30 uppercase">
                  {plan.id.replace('plan_', '')}
                </span>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                <li className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Max Contacts: <span className="font-bold text-white">{plan.maxContacts}</span>
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Daily Limit: <span className="font-bold text-white">{plan.maxMessagesPerDay} msgs/day</span>
                </li>
                <li className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-indigo-400" /> Staff Accounts: <span className="font-bold text-white">{plan.maxStaffAccounts} Users</span>
                </li>
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Tenant Directory */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-400" /> Managed Organization Tenants ({tenants.length})
            </h3>
            <p className="text-xs text-slate-400">Isolated database schemas, WhatsApp connections, and subscription tiers</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search tenant or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500"
              />
            </div>

            <button
              onClick={() => setIsNewTenantOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Tenant</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/60">
                <th className="py-3 px-4">Organization Name</th>
                <th className="py-3 px-4">Sender WhatsApp Number</th>
                <th className="py-3 px-4">Subscription Plan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTenants.map((tenant) => {
                const currentPlan = plans.find(p => p.id === tenant.planId) || plans[0];
                return (
                  <tr key={tenant.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                          {tenant.name.charAt(0)}
                        </div>
                        <div>
                          <p>{tenant.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{tenant.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{tenant.senderNumber}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold">
                        {currentPlan.name}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        ACTIVE
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <select
                        value={tenant.planId || 'plan_pro'}
                        onChange={(e) => onUpgradePlan(tenant.id, e.target.value)}
                        className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-white"
                      >
                        {plans.map(p => (
                          <option key={p.id} value={p.id}>Upgrade to {p.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Tenant Modal */}
      {isNewTenantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Add New SaaS Tenant Organization</h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="e.g. Metro Supermarket"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp Sender Number</label>
                <input
                  type="text"
                  required
                  value={newTenantPhone}
                  onChange={(e) => setNewTenantPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTenantOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow"
                >
                  Create Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
