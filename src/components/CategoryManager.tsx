import React, { useState } from 'react';
import { 
  Folder, 
  Video, 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  Sparkles, 
  Smartphone, 
  ShieldCheck, 
  ArrowLeft,
  Play
} from 'lucide-react';
import { Category, SystemSettings } from '../types';

interface CategoryManagerProps {
  categories: Category[];
  settings: SystemSettings;
  onSaveCategory: (categoryData: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  settings,
  onSaveCategory,
  onDeleteCategory,
  onNavigateTab,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    description: '',
    videoUrl: '',
    videoName: '',
    captionTemplate: '',
    dailyLimit: 3,
    color: 'emerald',
  });

  const activeCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];

  const handleEditClick = (category: Category) => {
    setFormData(category);
    setIsEditing(true);
  };

  const handleCreateNew = () => {
    setFormData({
      name: '',
      description: 'Custom field promotional video campaigns',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-chef-cooking-food-in-a-restaurant-kitchen-40788-large.mp4',
      videoName: 'promo_video.mp4',
      captionTemplate: 'Check out our latest category offers today!\n\nContact: {phone}',
      dailyLimit: 3,
      sentToday: 0,
      color: 'emerald',
    });
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCategory(formData);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Explicit Back Header Bar */}
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
            <h2 className="text-base font-bold text-white">Dynamic Media Folders &amp; Templates</h2>
            <p className="text-xs text-slate-400">Media folders read dynamically from contacts.json</p>
          </div>
        </div>

        <button
          onClick={handleCreateNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Category Folder</span>
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Categories List */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Active Category Folders</h3>

          {categories.map((category) => {
            const isSelected = category.id === activeCategory?.id;
            return (
              <div
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500/50 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                    isSelected ? 'bg-emerald-600' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {category.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{category.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {category.sentToday}/{category.dailyLimit} daily
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{category.description || category.videoName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(category);
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                    title="Edit Folder"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  {categories.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCategory(category.id);
                      }}
                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                      title="Delete Folder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Folder Details & Preview */}
        {activeCategory && (
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Folder Path: {activeCategory.folderPath || `media/${activeCategory.id}`}</span>
                  <h3 className="text-lg font-bold text-white">{activeCategory.name}</h3>
                </div>
                <button
                  onClick={() => handleEditClick(activeCategory)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Template</span>
                </button>
              </div>

              {/* Video Attachment Player */}
              <div className="mb-6 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Video className="w-4 h-4 text-emerald-400" />
                    <span>Attached Category Video</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{activeCategory.videoName}</span>
                </div>

                <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-h-52 flex items-center justify-center border border-slate-800">
                  <video
                    src={activeCategory.videoUrl}
                    controls
                    className="w-full h-full object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>

              {/* WhatsApp Output Preview */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  WhatsApp Output Message Preview
                </span>

                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3 font-sans shadow-xl">
                  <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                    {settings.greetingPrefix} <strong>[Client Name]</strong>,
                    <br /><br />
                    {activeCategory.captionTemplate.replace('{name}', '[Client Name]').replace('{phone}', settings.senderNumber)}
                  </div>

                  {settings.enableUrduFooter && (
                    <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-['Noto_Nastaliq_Urdu',sans-serif] text-right text-sm leading-loose">
                      {settings.urduFooter}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {formData.id ? 'Edit Category Folder' : 'Create Custom Category Folder'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Restaurants, Clothing, Real Estate"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Video File Name</label>
                  <input
                    type="text"
                    value={formData.videoName || ''}
                    onChange={(e) => setFormData({ ...formData, videoName: e.target.value })}
                    placeholder="promo.mp4"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Daily Rate Limit</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.dailyLimit ?? 3}
                    onChange={(e) => setFormData({ ...formData, dailyLimit: parseInt(e.target.value) || 3 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Promotional Video URL (MP4)</label>
                <input
                  type="text"
                  value={formData.videoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://domain.com/video.mp4"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Caption Template</label>
                <textarea
                  rows={4}
                  value={formData.captionTemplate || ''}
                  onChange={(e) => setFormData({ ...formData, captionTemplate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
