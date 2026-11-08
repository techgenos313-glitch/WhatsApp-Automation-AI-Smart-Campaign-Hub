import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  PhoneCall, 
  Tag, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowLeft,
  MessageSquare,
  ExternalLink,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import { Contact, Category } from '../types';

interface ContactPipelineProps {
  contacts: Contact[];
  categories: Category[];
  onSaveContact: (contactData: Partial<Contact>) => void;
  onDeleteContact: (id: string) => Promise<any> | void;
  onNavigateTab: (tab: string) => void;
}

export const ContactPipeline: React.FC<ContactPipelineProps> = ({
  contacts,
  categories,
  onSaveContact,
  onDeleteContact,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Confirmation Modal state for deletion
  const [clientToDelete, setClientToDelete] = useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Notification state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const [formData, setFormData] = useState<Partial<Contact>>({
    name: '',
    phone: '',
    category: categories[0]?.id || '',
    status: 'new',
    notes: '',
  });

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
    const matchesCat = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleCreateNew = () => {
    setFormData({
      name: '',
      phone: '+92 ',
      category: categories[0]?.id || '',
      status: 'new',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (contact: Contact) => {
    setFormData(contact);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveContact(formData);
    setIsModalOpen(false);
    triggerToast('Contact saved successfully! / کلائنٹ کامیابی سے محفوظ ہو گیا ہے۔');
  };

  const confirmDeleteAction = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);

    try {
      const result = await onDeleteContact(clientToDelete.id);
      setIsDeleting(false);
      setClientToDelete(null);

      if (result && result.error) {
        triggerToast(`❌ Error: ${result.error}`, 'error');
      } else {
        triggerToast(`Client '${clientToDelete.name}' deleted successfully! / کلائنٹ کامیابی سے ڈیلیٹ ہو گیا ہے۔`, 'success');
      }
    } catch (err) {
      setIsDeleting(false);
      setClientToDelete(null);
      triggerToast('❌ Error deleting client record', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'interested':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">Hot Lead</span>;
      case 'converted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Converted</span>;
      case 'contacted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Contacted</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">New Lead</span>;
    }
  };

  const formatCleanPhone = (phone: string) => phone.replace(/[^0-9]/g, '');

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification Banner */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border transition-all animate-bounce ${
          toast.type === 'success' 
            ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-950 border-rose-500/40 text-rose-300'
        }`}>
          {toast.type === 'success' ? <Check className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

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
            <h2 className="text-base font-bold text-white">Client Directory &amp; Delete Management</h2>
            <p className="text-xs text-slate-400">Manage, edit, or delete clients with full confirmation &amp; toast alerts</p>
          </div>
        </div>

        <button
          onClick={handleCreateNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow cursor-pointer whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Contact</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search contacts by name or phone..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Category Folders</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Mobile Card List View (Visible on Mobile) */}
      <div className="block md:hidden space-y-3">
        {filteredContacts.map((contact) => {
          const catObj = categories.find((c) => c.id === contact.category);
          const cleanPhone = formatCleanPhone(contact.phone);

          return (
            <div key={contact.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{contact.name}</h3>
                  <span className="text-xs font-mono text-emerald-400">{contact.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(contact.status)}
                  
                  {/* RED DELETE BUTTON ON MOBILE CARD */}
                  <button
                    onClick={() => setClientToDelete(contact)}
                    className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                    title="Delete Client / کلائنٹ ڈیلیٹ کریں"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-medium text-slate-300">
                  {catObj?.name || 'General'}
                </span>
                <span className="font-mono text-[11px]">{contact.messagesSentToday} msgs today</span>
              </div>

              {/* Actions row */}
              <div className="flex gap-2 pt-1">
                <a
                  href={`tel:${contact.phone}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>

                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp</span>
                </a>

                <button
                  onClick={() => handleEdit(contact)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table View (Visible on Desktop) */}
      <div className="hidden md:block p-6 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
              <th className="pb-3 px-2">Client Name</th>
              <th className="pb-3 px-2">Phone Number</th>
              <th className="pb-3 px-2">Category Folder</th>
              <th className="pb-3 px-2">Sent Today</th>
              <th className="pb-3 px-2">Pipeline Status</th>
              <th className="pb-3 px-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredContacts.map((contact) => {
              const catObj = categories.find((c) => c.id === contact.category);
              const cleanPhone = formatCleanPhone(contact.phone);

              return (
                <tr key={contact.id} className="hover:bg-slate-950/40 transition-all">
                  <td className="py-3 px-2 font-bold text-white">{contact.name}</td>
                  <td className="py-3 px-2 font-mono text-slate-300">{contact.phone}</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 font-medium text-[11px]">
                      {catObj?.name || 'General'}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-mono text-slate-400">{contact.messagesSentToday} msgs</td>
                  <td className="py-3 px-2">{getStatusBadge(contact.status)}</td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow"
                        title="Call Client Directly"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Call</span>
                      </a>

                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
                        title="Open WhatsApp Chat"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                      </a>

                      <button
                        onClick={() => handleEdit(contact)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                        title="Edit Contact"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* RED DELETE BUTTON ON DESKTOP ROW */}
                      <button
                        onClick={() => setClientToDelete(contact)}
                        className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                        title="Delete Client Record / کلائنٹ ڈیلیٹ کریں"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CONFIRMATION MODAL FOR CLIENT DELETION (Requirement #1 & #2) */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Delete Client Record? / کلائنٹ ڈیلیٹ کریں؟</h3>
                <p className="text-xs text-rose-400 font-semibold">Permanently delete client &amp; message history</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Client Name:</span>
                <span className="font-bold text-white">{clientToDelete.name}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Phone Number:</span>
                <span className="font-mono text-emerald-400 font-bold">{clientToDelete.phone}</span>
              </div>

              <div className="pt-2 border-t border-slate-800 text-rose-300 font-['Noto_Nastaliq_Urdu',sans-serif] text-sm text-right leading-loose">
                کیا آپ واقعی اس کلائنٹ اور اس کی تمام ہسٹری کو ڈیلیٹ کرنا چاہتے ہیں؟ یہ عمل واپس نہیں ہو سکتا۔
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
              >
                نہیں، کینسل کریں (Cancel)
              </button>
              <button
                type="button"
                onClick={confirmDeleteAction}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'ہاں، ڈیلیٹ کریں (Delete Client)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">{formData.id ? 'Edit Contact' : 'Add New Client Contact'}</h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Tariq Mahmood"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp Phone Number</label>
                <input
                  type="text"
                  required
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+92 300 1234567"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Field Category</label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pipeline Status</label>
                <select
                  value={formData.status || 'new'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  <option value="new">New Lead</option>
                  <option value="contacted">Contacted</option>
                  <option value="interested">Interested Hot Lead</option>
                  <option value="converted">Converted Client</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
