import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { AnimatedCounter } from '../../components/common/AnimatedCounter';
import { brandService } from '../../services/brand.service';
import type { Brand } from '../../services/brand.service';
import toast from 'react-hot-toast';
import { Trash2, Edit2, Plus, Search, Tag, Globe, Sparkles, X } from 'lucide-react';

// --- Premium Shimmer Skeleton Helper ---
const ShimmerStyle: React.FC = () => (
  <style>{`
    @keyframes shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position: 600px 0; }
    }
    .ske-base {
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 1200px 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }
    .ske-r  { border-radius: 16px; }
  `}</style>
);

const Bone: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <div className={`ske-base ske-r ${className}`} style={style} />
);

export const AdminBrands: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchBrands = async () => {
    setIsLoading(true);
    try {
      const list = await brandService.getAllBrands();
      setBrands(list || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch brands.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  // Filtered list
  const filteredBrands = useMemo(() => {
    return brands.filter(b => {
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        (b.description || '').toLowerCase().includes(q)
      );
    });
  }, [brands, searchQuery]);

  // Statistics
  const totalBrandsCount = brands.length;
  const recentBrandsCount = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return brands.filter(b => new Date(b.createdAt) >= thirtyDaysAgo).length;
  }, [brands]);

  const handleOpenCreateModal = () => {
    setEditingBrand(null);
    setFormName('');
    setFormDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setFormName(brand.name);
    setFormDescription(brand.description || '');
    setIsModalOpen(true);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Brand name is required.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingBrand) {
        // Update brand
        const updated = await brandService.updateBrand(editingBrand.brandId, formName.trim(), '', formDescription.trim());
        setBrands(prev => prev.map(b => b.brandId === editingBrand.brandId ? updated : b));
        toast.success('Brand updated successfully!');
      } else {
        // Create brand
        const created = await brandService.createBrand(formName.trim(), '', formDescription.trim());
        setBrands(prev => [created, ...prev]);
        toast.success('Brand created successfully!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save brand.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;

    try {
      await brandService.deleteBrand(brandId);
      setBrands(prev => prev.filter(b => b.brandId !== brandId));
      toast.success('Brand deleted successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete brand.');
    }
  };

  return (
    <AdminLayout>
      <ShimmerStyle />
      <div className="p-6 space-y-6 text-left select-none max-w-7xl mx-auto">
        
        {/* Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-600" />
              <span>Brand Directory</span>
            </h1>
            <p className="text-xs text-slate-455 font-bold">Configure product vendor listings, assets, and catalog brands.</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="h-[38px] px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-600/20 active:scale-97 cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            <span>Add Brand</span>
          </button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative rounded-2xl bg-white border border-slate-100 p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3.5 text-left">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 flex-shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Brands</span>
                <span className="text-2xl font-black text-slate-800 tracking-tight leading-none mt-1">
                  {isLoading ? <Bone className="h-6 w-12 mt-1" /> : <AnimatedCounter value={totalBrandsCount} />}
                </span>
                <span className="text-[9px] text-slate-455 font-bold tracking-wide mt-1">Active vendor classifications</span>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl bg-white border border-slate-100 p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3.5 text-left">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-650 flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Recent Brands</span>
                <span className="text-2xl font-black text-slate-800 tracking-tight leading-none mt-1">
                  {isLoading ? <Bone className="h-6 w-12 mt-1" /> : <AnimatedCounter value={recentBrandsCount} />}
                </span>
                <span className="text-[9px] text-slate-455 font-bold tracking-wide mt-1">Introduced in last 30 days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Header */}
        <div className="bg-white border border-slate-200/60 rounded-[20px] p-4 shadow-[0_4px_25px_rgba(15,23,42,0.01)] flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-350" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brands by name or description..."
              className="w-full h-10.5 pl-9.5 pr-4 border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-xl text-xs font-semibold text-slate-700 outline-none transition-colors bg-slate-50/20"
            />
          </div>
        </div>

        {/* Brands Display Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-slate-100 rounded-3xl p-5 space-y-4">
                <div className="flex items-center space-x-4">
                  <Bone className="w-12 h-12 rounded-2xl flex-shrink-0" />
                  <div className="space-y-2 flex-grow">
                    <Bone className="h-4.5 w-28" />
                    <Bone className="h-3 w-16" />
                  </div>
                </div>
                <Bone className="h-10 w-full" />
                <div className="flex gap-2">
                  <Bone className="h-9 flex-grow" />
                  <Bone className="h-9 w-9" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="bg-white border border-slate-200/50 rounded-[30px] p-12 text-center shadow-sm">
            <Tag className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-[13.5px] font-black text-slate-700 tracking-tight mt-3">No Brands Found</h3>
            <p className="text-[11px] text-slate-455 font-bold mt-1 max-w-sm mx-auto">We couldn't find any brands matching your filters. Add a new brand to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBrands.map((brand) => {
              const initials = brand.name.slice(0, 2).toUpperCase();
              return (
                <div
                  key={brand.brandId}
                  className="bg-white border border-slate-200/60 hover:border-blue-400 rounded-3xl p-5 shadow-[0_8px_30px_rgba(15,23,42,0.015)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header Info */}
                    <div className="flex items-center space-x-4">
                      {brand.logoUrl ? (
                        <div className="w-12 h-12 rounded-2xl border border-slate-100 bg-slate-50/50 overflow-hidden flex items-center justify-center p-1 flex-shrink-0">
                          <img
                            src={brand.logoUrl}
                            alt={brand.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-600/10 text-blue-600 flex items-center justify-center text-sm font-black flex-shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="text-left space-y-0.5 min-w-0">
                        <h4 className="text-[14px] font-black text-slate-800 tracking-tight truncate">
                          {brand.name}
                        </h4>
                        <div className="text-[9px] text-slate-400 font-bold tracking-wide uppercase flex items-center space-x-1">
                          <Globe className="w-3 h-3 text-slate-350" />
                          <span>ID: {brand.displayId || brand.brandId.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[11.5px] text-slate-500 font-medium leading-relaxed min-h-[48px] line-clamp-3 text-left">
                      {brand.description || 'No description provided for this brand classification.'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-slate-100/80 my-4" />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditModal(brand)}
                      className="h-9 px-4.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/60 rounded-xl text-[10.5px] font-bold text-slate-600 flex items-center justify-center space-x-1.5 transition-all flex-grow cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Settings</span>
                    </button>
                    <button
                      onClick={() => handleDeleteBrand(brand.brandId)}
                      className="w-9 h-9 border border-slate-200/60 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl flex items-center justify-center transition-all cursor-pointer bg-white"
                      aria-label="Delete brand"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Brand Modal Overlay */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fadeIn select-none text-left">
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
              
              {/* Modal Header */}
              <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    {editingBrand ? 'Modify Brand Details' : 'Introduce New Brand'}
                  </h3>
                  <p className="text-[10px] text-slate-455 font-bold">Provide label assets and reference identifiers.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-50 border-none flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveBrand} className="p-6 space-y-5.5">
                
                {/* Brand Name */}
                <div className="relative w-full">
                  <label className="absolute left-4.5 -top-2 z-10 text-[9.5px] bg-white px-1.5 text-blue-655 font-black">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Logitech, Apple"
                    className="w-full border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 rounded-2xl h-14 px-4.5 text-[12.5px] font-bold text-slate-800 outline-none transition-all placeholder-slate-350 shadow-sm shadow-slate-100/40"
                    required
                  />
                </div>



                {/* Description */}
                <div className="relative w-full">
                  <label className="absolute left-4.5 -top-2 z-10 text-[9.5px] bg-white px-1.5 text-blue-655 font-black">
                    Description
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="A brief overview describing what products this brand manufactures..."
                    className="w-full border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 rounded-2xl min-h-[96px] p-4 px-4.5 text-[12.5px] font-bold text-slate-800 outline-none transition-all placeholder-slate-350 shadow-sm shadow-slate-100/40 resize-none font-sans leading-relaxed"
                  />
                </div>

                {/* Form Actions */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="h-12 border border-slate-200 hover:bg-slate-50 text-slate-500 font-black rounded-2xl flex items-center justify-center flex-grow text-xs tracking-wider uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="h-12 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl flex items-center justify-center flex-grow text-xs tracking-wider uppercase cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Brand'}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminBrands;
