import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../layouts/AdminLayout';
import {
  Search,
  Plus,
  CheckCircle,
  Clock,
  ChevronDown,
  RefreshCw,
  Trash2,
  ArrowLeft,
  Tag,
  Ticket,
  Eye,
  X,
  AlertTriangle,
  Calendar,
  Filter,
  Layers,
  Loader2
} from 'lucide-react';
import { couponService } from '../../services/coupon.service';
import type { Coupon } from '../../services/coupon.service';
import { productService } from '../../services/product.service';
import { categoryService } from '../../services/category.service';
import toast from 'react-hot-toast';
import { Price } from '../../components/ui/Price';

// --- Custom Expiry Check helper ---
const isExpired = (expiryDate: string) => {
  if (!expiryDate) return false;
  return new Date() > new Date(expiryDate);
};

// --- Custom Status Badge matching style guidelines ---
const CouponStatusBadge: React.FC<{ isActive: boolean; expiryDate: string }> = ({ isActive, expiryDate }) => {
  const baseClass = "inline-flex items-center justify-center space-x-1 px-3 py-1 rounded-full text-[10px] font-bold border flex-shrink-0 text-center";

  if (isExpired(expiryDate)) {
    return (
      <span className={`${baseClass} bg-rose-50 text-rose-700 border-rose-100`}>
        <X className="w-3 h-3 flex-shrink-0" />
        <span>Expired</span>
      </span>
    );
  }

  if (isActive) {
    return (
      <span className={`${baseClass} bg-emerald-50 text-emerald-650 border-emerald-100`}>
        <CheckCircle className="w-3 h-3 flex-shrink-0" />
        <span>Active</span>
      </span>
    );
  }

  return (
    <span className={`${baseClass} bg-slate-50 text-slate-500 border-slate-200`}>
      <Clock className="w-3 h-3 flex-shrink-0" />
      <span>Inactive</span>
    </span>
  );
};

// --- Coupon Stat Card ---
interface KpiCardProps {
  label: string;
  subLabel: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, subLabel, value, icon, iconBg }) => {
  return (
    <div
      className="bg-white border border-slate-100 rounded-[12px] p-3.5 shadow-sm hover:shadow-md hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-205 flex flex-col justify-between h-[105px] w-full cursor-default select-none text-left"
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-[10px] font-black uppercase tracking-[0.4px] text-slate-400 whitespace-nowrap block max-w-[85%] truncate">
          {label}
        </span>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg} transition-all duration-300`}>
          <span className="scale-90">{icon}</span>
        </div>
      </div>
      <div className="flex flex-col justify-end flex-grow mt-1">
        <div className="font-extrabold text-slate-900 leading-none text-[22px] transition-all duration-300 whitespace-nowrap">
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </div>
        <div className="text-[11px] text-slate-400 font-bold mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis uppercase">
          {subLabel}
        </div>
      </div>
    </div>
  );
};

// --- Generic Filter Dropdown ---
interface FilterDropdownProps {
  label: string;
  selected: string;
  options: { value: string; label: string }[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelect: (value: string) => void;
  icon?: React.ReactNode;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ label, selected, options, isOpen, setIsOpen, onSelect, icon }) => {
  const activeLabel = options.find(o => o.value === selected)?.label || '';
  return (
    <div className="relative w-full text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-11 w-full pl-3.5 pr-8 rounded-xl border text-slate-700 text-[11px] font-bold transition-all flex items-center justify-between shadow-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none cursor-pointer ${
          isOpen
            ? 'bg-slate-50/80 border-blue-600 ring-4 ring-blue-600/10'
            : 'bg-white hover:bg-slate-50/60 border-slate-205 hover:border-slate-350 shadow-sm shadow-slate-105/40'
        }`}
      >
        <div className="flex items-center space-x-2 truncate">
          {icon && <span className="text-slate-450 w-3.5 h-3.5 flex items-center justify-center">{icon}</span>}
          <span className="truncate">{label}: {activeLabel}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 mt-2 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 w-full min-w-[170px] flex flex-col animate-fadeIn"
          onMouseLeave={() => setIsOpen(false)}
        >
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => {
                onSelect(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 text-[11.5px] font-bold transition-colors hover:bg-slate-50 ${
                selected === option.value ? 'text-blue-600 bg-blue-50/10' : 'text-slate-655'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


interface AdminCouponsProps {
  mode?: 'list' | 'create' | 'edit';
}

export const AdminCoupons: React.FC<AdminCouponsProps> = ({ mode = 'list' }) => {
  const { couponId } = useParams<{ couponId: string }>();
  const navigate = useNavigate();

  // List states
  const [couponsList, setCouponsList] = useState<Coupon[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isScopeOpen, setIsScopeOpen] = useState(false);
  const [isDiscountTypeOpen, setIsDiscountTypeOpen] = useState(false);

  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active Only' },
    { value: 'INACTIVE', label: 'Inactive Only' },
    { value: 'EXPIRED', label: 'Expired Only' },
  ];

  const scopeOptions = [
    { value: 'ALL_SCOPES', label: 'All Scopes' },
    { value: 'ALL', label: 'Storewide' },
    { value: 'PRODUCT', label: 'Product Specific' },
    { value: 'CATEGORY', label: 'Category Specific' },
  ];

  const discountTypeOptions = [
    { value: 'ALL', label: 'All Types' },
    { value: 'PERCENTAGE', label: 'Percentage' },
    { value: 'FIXED', label: 'Fixed Amount' },
  ];
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED'>('ALL');
  const [scopeFilter, setScopeFilter] = useState<'ALL_SCOPES' | 'ALL' | 'PRODUCT' | 'CATEGORY'>('ALL_SCOPES');
  const [discountTypeFilter, setDiscountTypeFilter] = useState<'ALL' | 'PERCENTAGE' | 'FIXED'>('ALL');
  const [isListingLoading, setIsListingLoading] = useState(true);

  // Form states
  const [couponCode, setCouponCode] = useState('');
  const [couponName, setCouponName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('FIXED');
  const [discountValue, setDiscountValue] = useState<number | ''>('');
  const [minOrderAmount, setMinOrderAmount] = useState<number | ''>('');
  const [expiryDateInput, setExpiryDateInput] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [scope, setScope] = useState<'ALL' | 'PRODUCT' | 'CATEGORY'>('ALL');
  const [applicableProducts, setApplicableProducts] = useState<string[]>([]);
  const [applicableCategories, setApplicableCategories] = useState<string[]>([]);

  // Search selectors within form scope Section 4
  const [productSearch, setProductSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  // Scoped select references
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [isScopedDataLoading, setIsScopedDataLoading] = useState(false);

  // Modals state
  const [viewingCoupon, setViewingCoupon] = useState<Coupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);

  // Submissions state
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Load coupons list on mount
  const fetchCoupons = async () => {
    setIsListingLoading(true);
    try {
      const res = await couponService.getCoupons();
      const list = res.data || res.coupons || (Array.isArray(res) ? res : []);
      setCouponsList(list);
    } catch (err) {
      console.error('Error loading coupons:', err);
      toast.error('Failed to load coupons.');
    } finally {
      setIsListingLoading(false);
    }
  };

  const stats = React.useMemo(() => {
    const total = couponsList.length;
    const active = couponsList.filter(c => c.isActive && !isExpired(c.expiryDate)).length;
    const expired = couponsList.filter(c => isExpired(c.expiryDate)).length;
    const inactive = couponsList.filter(c => !c.isActive && !isExpired(c.expiryDate)).length;
    return { total, active, expired, inactive };
  }, [couponsList]);

  useEffect(() => {
    if (mode === 'list') {
      fetchCoupons();
    }
  }, [mode]);

  // Load Products and Categories for selector Section 4
  useEffect(() => {
    if (mode !== 'list') {
      const loadScopedData = async () => {
        setIsScopedDataLoading(true);
        try {
          const [prodRes, catRes] = await Promise.all([
            productService.getProducts({ limit: 100 }),
            categoryService.getCategories({ limit: 100 })
          ]);
          setAllProducts(prodRes.data || prodRes || []);
          setAllCategories(catRes.data || catRes || []);
        } catch (err) {
          console.error('Error loading product/category lists:', err);
        } finally {
          setIsScopedDataLoading(false);
        }
      };
      loadScopedData();
    }
  }, [mode]);

  // Load specific coupon details in edit mode
  useEffect(() => {
    if (mode === 'edit' && couponId) {
      const loadCouponDetails = async () => {
        setIsDetailLoading(true);
        try {
          const res = await couponService.getCouponByCode(couponId);
          const data = res.data || res.coupon || res;
          if (data) {
            setCouponCode(data.couponCode || '');
            setCouponName(data.couponName || '');
            setDescription(data.description || '');
            setDiscountType(data.discountType || 'FIXED');
            setDiscountValue(data.discountValue !== undefined ? data.discountValue : '');
            setMinOrderAmount(data.minimumOrderAmount !== undefined && data.minimumOrderAmount !== null ? data.minimumOrderAmount : '');
            setExpiryDateInput(data.expiryDate ? data.expiryDate.split('T')[0] : '');
            setIsActive(data.isActive !== undefined ? data.isActive : true);
            setScope(data.scope || 'ALL');
            setApplicableProducts(data.applicableProducts || []);
            setApplicableCategories(data.applicableCategories || []);
          }
        } catch (err) {
          console.error('Error fetching coupon details:', err);
          toast.error('Failed to load coupon details.');
          navigate('/admin/coupons');
        } finally {
          setIsDetailLoading(false);
        }
      };
      loadCouponDetails();
    }
  }, [mode, couponId, navigate]);

  // Handle Delete coupon
  const handleDeleteCoupon = async () => {
    if (!deletingCoupon) return;
    const code = deletingCoupon.couponCode;
    try {
      await couponService.deleteCoupon(code);
      toast.success(`Coupon ${code} deleted successfully`);
      setDeletingCoupon(null);
      fetchCoupons();
    } catch (err) {
      console.error('Error deleting coupon:', err);
      toast.error('Failed to delete coupon.');
    }
  };

  // Form validator
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!couponCode.trim()) {
      errors.couponCode = 'Coupon Code is required';
    } else if (!/^[A-Z0-9_-]+$/.test(couponCode)) {
      errors.couponCode = 'Code must be uppercase and alphanumeric only (no spaces)';
    }

    if (!couponName.trim()) {
      errors.couponName = 'Coupon Name is required';
    }

    if (discountValue === '' || Number(discountValue) <= 0) {
      errors.discountValue = 'Please enter a valid discount value greater than 0';
    }

    if (!expiryDateInput) {
      errors.expiryDateInput = 'Expiry Date is required';
    } else {
      const selectedDate = new Date(expiryDateInput);
      selectedDate.setHours(23, 59, 59, 999);
      if (selectedDate < new Date()) {
        errors.expiryDateInput = 'Expiry date cannot be in the past';
      }
    }

    if (minOrderAmount !== '' && Number(minOrderAmount) < 0) {
      errors.minOrderAmount = 'Minimum order amount must be greater than or equal to 0';
    }

    if (scope === 'PRODUCT' && applicableProducts.length === 0) {
      errors.scope = 'Please select at least one applicable product';
    }

    if (scope === 'CATEGORY' && applicableCategories.length === 0) {
      errors.scope = 'Please select at least one applicable category';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submit Handler
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    if (!validateForm()) {
      toast.error('Please resolve validation errors in the form.');
      return;
    }

    setIsFormSubmitting(true);
    const payload: Coupon = {
      couponCode: couponCode.trim().toUpperCase(),
      couponName: couponName.trim(),
      description: description.trim(),
      discountType,
      discountValue: Number(discountValue),
      minimumOrderAmount: Number(minOrderAmount || 0),
      expiryDate: new Date(expiryDateInput + 'T23:59:59Z').toISOString(),
      isActive,
      scope,
      applicableProducts: scope === 'PRODUCT' ? applicableProducts : [],
      applicableCategories: scope === 'CATEGORY' ? applicableCategories : [],
    };

    try {
      if (mode === 'create') {
        await couponService.createCoupon(payload);
        toast.success(`Coupon "${payload.couponCode}" created successfully`);
      } else if (mode === 'edit' && couponId) {
        await couponService.updateCoupon(couponId, payload);
        toast.success(`Coupon "${payload.couponCode}" updated successfully`);
      }
      navigate('/admin/coupons');
    } catch (err: any) {
      console.error('Error saving coupon:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to save coupon.';
      toast.error(errMsg);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Filter coupons matching search and advanced dropdown criteria
  const filteredCoupons = couponsList.filter(coupon => {
    const matchesSearch = searchQuery.trim() === '' || 
      coupon.couponCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coupon.couponName.toLowerCase().includes(searchQuery.toLowerCase());
      
    let matchesStatus = true;
    const expiredStatus = isExpired(coupon.expiryDate);
    if (statusFilter === 'ACTIVE') {
      matchesStatus = coupon.isActive && !expiredStatus;
    } else if (statusFilter === 'INACTIVE') {
      matchesStatus = !coupon.isActive && !expiredStatus;
    } else if (statusFilter === 'EXPIRED') {
      matchesStatus = expiredStatus;
    }

    const matchesScope = scopeFilter === 'ALL_SCOPES' || (coupon.scope || 'ALL') === scopeFilter;
    const matchesDiscountType = discountTypeFilter === 'ALL' || coupon.discountType === discountTypeFilter;

    return matchesSearch && matchesStatus && matchesScope && matchesDiscountType;
  });

  // Paginated lists calculations
  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
  const paginatedCoupons = filteredCoupons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Form Section 4 Search filters
  const filteredSearchProducts = allProducts.filter(prod => {
    const s = productSearch.toLowerCase();
    return prod.name.toLowerCase().includes(s) || 
      (prod.brand || '').toLowerCase().includes(s) ||
      (prod.categoryId || '').toLowerCase().includes(s);
  });

  const filteredSearchCategories = allCategories.filter(cat => 
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-left select-none relative">
        
        {/* TOP HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            {mode !== 'list' && (
              <button
                onClick={() => navigate('/admin/coupons')}
                className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200/60 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer active:scale-95 flex-shrink-0"
              >
                <ArrowLeft className="w-[18px] h-[18px]" />
              </button>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {mode === 'list' && 'Coupon Management'}
                {mode === 'create' && 'Create New Coupon'}
                {mode === 'edit' && `Edit Coupon: ${couponCode}`}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400 font-bold mt-1.5 leading-snug">
                {mode === 'list' && 'Manage discount codes, campaign values, and customer validation thresholds.'}
                {mode === 'create' && 'Set up a new validation code, minimum order thresholds, and pricing discounts.'}
                {mode === 'edit' && 'Modify the parameters, values, requirements, or status flags of the coupon code.'}
              </p>
            </div>
          </div>

          {mode === 'list' && (
            <button
              onClick={() => navigate('/admin/coupons/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-[11.5px] font-black uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 active:scale-98 transition-all cursor-pointer h-10.5 flex-shrink-0 font-mono"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              <span>Create Coupon</span>
            </button>
          )}
        </div>

        {/* KPI CARDS GRID */}
        {mode === 'list' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Total Coupons"
              subLabel="All Campaign Codes"
              value={stats.total}
              icon={<Ticket className="w-4 h-4" />}
              iconBg="bg-blue-50 text-blue-600 border border-blue-100/50"
            />
            <KpiCard
              label="Active Coupons"
              subLabel="Live & Usable"
              value={stats.active}
              icon={<CheckCircle className="w-4 h-4" />}
              iconBg="bg-emerald-50 text-emerald-600 border border-emerald-100/50"
            />
            <KpiCard
              label="Expired Coupons"
              subLabel="Past Validity Date"
              value={stats.expired}
              icon={<Calendar className="w-4 h-4" />}
              iconBg="bg-red-50 text-red-500 border border-red-100/50"
            />
            <KpiCard
              label="Inactive Coupons"
              subLabel="Paused Campaigns"
              value={stats.inactive}
              icon={<Clock className="w-4 h-4" />}
              iconBg="bg-amber-50 text-amber-600 border border-amber-100/50"
            />
          </div>
        )}

        {/* LIST VIEW PANEL */}
        {mode === 'list' && (
          <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden flex flex-col items-stretch">
            
            {/* SEARCH AND FILTERS BAR */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row gap-4 items-stretch justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search coupons by code or campaign name..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full h-11 pl-10.5 pr-4 border border-slate-200 rounded-xl text-xs font-semibold text-slate-855 placeholder-slate-400 bg-slate-50/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                />
              </div>

              {/* DROPDOWN FILTER GRIDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-shrink-0 lg:max-w-xl w-full">
                
                {/* Status Filter */}
                <FilterDropdown
                  label="Status"
                  selected={statusFilter}
                  options={statusOptions}
                  isOpen={isStatusOpen}
                  setIsOpen={setIsStatusOpen}
                  onSelect={(val) => { setStatusFilter(val as any); setCurrentPage(1); }}
                  icon={<Filter className="w-3.5 h-3.5" />}
                />

                {/* Scope Filter */}
                <FilterDropdown
                  label="Scope"
                  selected={scopeFilter}
                  options={scopeOptions}
                  isOpen={isScopeOpen}
                  setIsOpen={setIsScopeOpen}
                  onSelect={(val) => { setScopeFilter(val as any); setCurrentPage(1); }}
                  icon={<Layers className="w-3.5 h-3.5" />}
                />

                {/* Discount Type Filter */}
                <FilterDropdown
                  label="Type"
                  selected={discountTypeFilter}
                  options={discountTypeOptions}
                  isOpen={isDiscountTypeOpen}
                  setIsOpen={setIsDiscountTypeOpen}
                  onSelect={(val) => { setDiscountTypeFilter(val as any); setCurrentPage(1); }}
                  icon={<Ticket className="w-3.5 h-3.5" />}
                />

              </div>

              <button
                onClick={fetchCoupons}
                disabled={isListingLoading}
                className="h-11 border border-slate-200 px-4 rounded-xl text-[11.5px] font-bold text-slate-655 hover:bg-slate-50 hover:text-slate-800 transition-all flex items-center justify-center space-x-2 active:scale-98 shadow-sm cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 text-slate-400 ${isListingLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {/* MAIN TABLE */}
            <div className="overflow-x-auto">
              {isListingLoading ? (
                <div className="py-24 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-455 font-bold">Retrieving coupons data, please wait...</p>
                </div>
              ) : filteredCoupons.length === 0 ? (
                <div className="py-24 text-center space-y-4">
                  <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5 max-w-sm mx-auto">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">No Coupons Found</h3>
                    <p className="text-[10px] text-slate-455 font-bold leading-relaxed">
                      {searchQuery || statusFilter !== 'ALL' || scopeFilter !== 'ALL_SCOPES' || discountTypeFilter !== 'ALL'
                        ? 'No coupons matched your current search and filter parameters.'
                        : 'Your shop does not have any active discount coupons configured.'}
                    </p>
                  </div>
                </div>
              ) : (
                <table className="w-full text-[11.5px]">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-extrabold text-[9.5px]">
                      <th className="px-6 py-4 text-left font-black">Code</th>
                      <th className="px-6 py-4 text-left font-black">Campaign Details</th>
                      <th className="px-6 py-4 text-left font-black">Scope</th>
                      <th className="px-6 py-4 text-left font-black">Discount</th>
                      <th className="px-6 py-4 text-left font-black">Min Order</th>
                      <th className="px-6 py-4 text-left font-black">Expiry Date</th>
                      <th className="px-6 py-4 text-left font-black">Status</th>
                      <th className="px-6 py-4 text-right font-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/85 font-bold text-slate-655">
                    {paginatedCoupons.map((coupon) => {
                      const id = coupon.couponCode;
                      return (
                        <tr key={id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-black text-[10px] tracking-wider uppercase border border-blue-100 font-mono">
                              {coupon.couponCode}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-[12px] font-black text-slate-850 truncate max-w-[200px] text-left">
                              {coupon.couponName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left">
                            <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold tracking-wide uppercase border ${
                              coupon.scope === 'PRODUCT'
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : coupon.scope === 'CATEGORY'
                                  ? 'bg-violet-50 text-violet-700 border-violet-100'
                                  : 'bg-slate-50 text-slate-700 border-slate-100'
                            }`}>
                              {coupon.scope || 'ALL'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left">
                            {coupon.discountType === 'PERCENTAGE' ? (
                              <span className="text-[12px] font-black text-slate-855">{coupon.discountValue}%</span>
                            ) : (
                              <span className="text-[12px] font-black text-slate-855"><Price value={coupon.discountValue} /></span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-left">
                            {coupon.minimumOrderAmount ? (
                              <span className="text-slate-700"><Price value={coupon.minimumOrderAmount} /></span>
                            ) : (
                              <span className="text-slate-400">₹0</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-500 text-left">
                            {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left">
                            <CouponStatusBadge isActive={coupon.isActive} expiryDate={coupon.expiryDate} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => setViewingCoupon(coupon)}
                                className="h-8.5 w-8.5 border border-slate-205 rounded-lg hover:bg-white hover:text-blue-650 hover:border-slate-350 shadow-sm cursor-pointer active:scale-95 transition-all flex items-center justify-center"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-450" />
                              </button>
                              <button
                                onClick={() => navigate(`/admin/coupons/${coupon.couponCode}`)}
                                className="h-8.5 px-3 border border-slate-205 rounded-lg hover:bg-white hover:text-blue-650 hover:border-slate-350 shadow-sm cursor-pointer active:scale-95 transition-all text-[11px]"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeletingCoupon(coupon)}
                                className="h-8.5 w-8.5 rounded-lg border border-slate-205 text-slate-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm"
                                title="Delete Coupon"
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
              )}
            </div>

            {/* LIST PAGINATION CONTROL */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between font-mono text-[11px] font-bold text-slate-450">
                <span>Showing Page {currentPage} of {totalPages}</span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="h-8.5 px-3 rounded-lg border border-slate-205 bg-white hover:bg-slate-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="h-8.5 px-3 rounded-lg border border-slate-205 bg-white hover:bg-slate-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* CREATE / EDIT FORM PANEL (Premium cards layout) */}
        {mode !== 'list' && (
          <div className="space-y-6">
            {isDetailLoading ? (
              <div className="py-24 text-center bg-white border border-slate-200/50 rounded-2xl p-6.5 shadow-sm space-y-3 animate-pulse">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-bold">Loading Coupon Details...</p>
              </div>
            ) : (
              <form onSubmit={handleSaveCoupon} className="space-y-6">
                
                {/* Section 1: Basic Information Card */}
                <div className="bg-white rounded-2xl border border-slate-200/50 p-6.5 shadow-[0_4px_20px_rgba(15,23,42,0.01)] space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex items-center space-x-2 text-left">
                    <Tag className="w-4 h-4 text-blue-600" />
                    <h2 className="text-sm font-black text-slate-850 tracking-tight">Basic Details (Section 1)</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                    
                    {/* Coupon Code Input */}
                    <div className="flex flex-col space-y-1.5 text-left relative">
                      <label className="absolute left-4.5 -top-2 z-10 text-[9.5px] bg-white px-1.5 text-blue-655 font-bold uppercase tracking-wide">
                        Coupon Code *
                      </label>
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="WELCOME100"
                        className={`w-full border rounded-xl h-12.5 px-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase transition-all bg-white font-mono ${
                          formSubmitted && formErrors.couponCode ? 'border-red-450' : 'border-slate-200'
                        }`}
                      />
                      {formSubmitted && formErrors.couponCode && (
                        <p className="text-[9.5px] font-bold text-red-500 mt-1 pl-4.5">{formErrors.couponCode}</p>
                      )}
                    </div>

                    {/* Coupon Campaign Name */}
                    <div className="flex flex-col space-y-1.5 text-left relative">
                      <label className="absolute left-4.5 -top-2 z-10 text-[9.5px] bg-white px-1.5 text-blue-655 font-bold uppercase tracking-wide">
                        Coupon Campaign Name *
                      </label>
                      <input
                        type="text"
                        value={couponName}
                        onChange={(e) => setCouponName(e.target.value)}
                        placeholder="Welcome Purchase Discount"
                        className={`w-full border rounded-xl h-12.5 px-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white ${
                          formSubmitted && formErrors.couponName ? 'border-red-455' : 'border-slate-200'
                        }`}
                      />
                      {formSubmitted && formErrors.couponName && (
                        <p className="text-[9.5px] font-bold text-red-500 mt-1 pl-4.5">{formErrors.couponName}</p>
                      )}
                    </div>

                    {/* Coupon Description */}
                    <div className="flex flex-col space-y-1.5 text-left relative md:col-span-2">
                      <label className="absolute left-4.5 -top-2 z-10 text-[9.5px] bg-white px-1.5 text-blue-655 font-bold uppercase tracking-wide">
                        Description / Campaign Details
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Provide details about terms of the discount promotion..."
                        rows={2}
                        className="w-full border rounded-xl p-3.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white border-slate-250 resize-none"
                      />
                    </div>

                  </div>
                </div>

                {/* Section 2: Discount Properties Card */}
                <div className="bg-white rounded-2xl border border-slate-200/50 p-6.5 shadow-[0_4px_20px_rgba(15,23,42,0.01)] space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex items-center space-x-2 text-left">
                    <Ticket className="w-4 h-4 text-blue-600" />
                    <h2 className="text-sm font-black text-slate-850 tracking-tight">Discount Configuration (Section 2)</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2 text-left">
                      <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-450 pl-1.5">Discount Type *</label>
                      <div className="flex items-center space-x-6 pl-1.5 select-none">
                        <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-bold text-slate-700">
                          <input
                            type="radio"
                            name="discountType"
                            value="PERCENTAGE"
                            checked={discountType === 'PERCENTAGE'}
                            onChange={() => { setDiscountType('PERCENTAGE'); setDiscountValue(''); }}
                            className="w-4.5 h-4.5 text-blue-600 border-slate-300 focus:ring-blue-500/20"
                          />
                          <span>Percentage Discount (%)</span>
                        </label>
                        <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-bold text-slate-700">
                          <input
                            type="radio"
                            name="discountType"
                            value="FIXED"
                            checked={discountType === 'FIXED'}
                            onChange={() => { setDiscountType('FIXED'); setDiscountValue(''); }}
                            className="w-4.5 h-4.5 text-blue-600 border-slate-300 focus:ring-blue-500/20"
                          />
                          <span>Fixed Amount Discount (₹)</span>
                        </label>
                      </div>
                    </div>

                    {/* Discount Value Input */}
                    <div className="flex flex-col space-y-1.5 text-left relative pt-1">
                      <label className="absolute left-4.5 -top-2 z-10 text-[9.5px] bg-white px-1.5 text-blue-655 font-bold uppercase tracking-wide">
                        {discountType === 'PERCENTAGE' ? 'Discount Percentage (%) *' : 'Discount Fixed Amount (₹) *'}
                      </label>
                      <input
                        type="number"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder={discountType === 'PERCENTAGE' ? 'e.g. 15' : 'e.g. 100'}
                        min={1}
                        max={discountType === 'PERCENTAGE' ? 100 : undefined}
                        className={`w-full border rounded-xl h-12.5 px-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white ${
                          formSubmitted && formErrors.discountValue ? 'border-red-455' : 'border-slate-200'
                        }`}
                      />
                      {formSubmitted && formErrors.discountValue && (
                        <p className="text-[9.5px] font-bold text-red-500 mt-1 pl-4.5">{formErrors.discountValue}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 3: Activation & Requirements Card */}
                <div className="bg-white rounded-2xl border border-slate-200/50 p-6.5 shadow-[0_4px_20px_rgba(15,23,42,0.01)] space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex items-center space-x-2 text-left">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <h2 className="text-sm font-black text-slate-850 tracking-tight">Rules & Requirements (Section 3)</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                    
                    {/* Minimum Order Amount Threshold Input */}
                    <div className="flex flex-col space-y-1.5 text-left relative">
                      <label className="absolute left-4.5 -top-2 z-10 text-[9.5px] bg-white px-1.5 text-blue-655 font-bold uppercase tracking-wide">
                        Minimum Order Amount (₹) *
                      </label>
                      <input
                        type="number"
                        value={minOrderAmount}
                        onChange={(e) => setMinOrderAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 500"
                        min={0}
                        className={`w-full border rounded-xl h-12.5 px-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white ${
                          formSubmitted && formErrors.minOrderAmount ? 'border-red-455' : 'border-slate-200'
                        }`}
                      />
                      {formSubmitted && formErrors.minOrderAmount && (
                        <p className="text-[9.5px] font-bold text-red-500 mt-1 pl-4.5">{formErrors.minOrderAmount}</p>
                      )}
                    </div>

                    {/* Expiration Date Input */}
                    <div className="flex flex-col space-y-1.5 text-left relative">
                      <label className="absolute left-4.5 -top-2 z-10 text-[9.5px] bg-white px-1.5 text-blue-655 font-bold uppercase tracking-wide">
                        Expiration Date *
                      </label>
                      <input
                        type="date"
                        value={expiryDateInput}
                        onChange={(e) => setExpiryDateInput(e.target.value)}
                        className={`w-full border rounded-xl h-12.5 px-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white ${
                          formSubmitted && formErrors.expiryDateInput ? 'border-red-455' : 'border-slate-200'
                        }`}
                      />
                      {formSubmitted && formErrors.expiryDateInput && (
                        <p className="text-[9.5px] font-bold text-red-500 mt-1 pl-4.5">{formErrors.expiryDateInput}</p>
                      )}
                    </div>

                    {/* Active Status Toggle Option */}
                    <div className="flex items-center h-12.5 pl-3 border border-slate-200 rounded-xl relative bg-white select-none">
                      <label className="absolute left-4.5 -top-2 z-10 text-[9.5px] bg-white px-1.5 text-blue-655 font-bold uppercase tracking-wide">
                        Coupon Status
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="w-4.5 h-4.5 text-blue-600 rounded border-slate-350 focus:ring-blue-500/20"
                        />
                        <span className="text-xs font-bold text-slate-700">Mark Coupon Active</span>
                      </label>
                    </div>

                  </div>
                </div>

                {/* Section 4: Target Scope Picker Card */}
                <div className="bg-white rounded-2xl border border-slate-200/50 p-6.5 shadow-[0_4px_20px_rgba(15,23,42,0.01)] space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex items-center space-x-2 text-left">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <h2 className="text-sm font-black text-slate-850 tracking-tight">Campaign Target Scope (Section 4)</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2 text-left">
                      <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-455 pl-1.5">Apply Coupon Discount To *</label>
                      <div className="flex items-center space-x-6 pl-1.5 select-none">
                        <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-bold text-slate-700">
                          <input
                            type="radio"
                            name="scope"
                            value="ALL"
                            checked={scope === 'ALL'}
                            onChange={() => setScope('ALL')}
                            className="w-4.5 h-4.5 text-blue-600 border-slate-305 focus:ring-blue-500/20"
                          />
                          <span>Entire Shopping Cart (ALL)</span>
                        </label>
                        <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-bold text-slate-700">
                          <input
                            type="radio"
                            name="scope"
                            value="PRODUCT"
                            checked={scope === 'PRODUCT'}
                            onChange={() => setScope('PRODUCT')}
                            className="w-4.5 h-4.5 text-blue-600 border-slate-305 focus:ring-blue-500/20"
                          />
                          <span>Selected Products Only (PRODUCT)</span>
                        </label>
                        <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-bold text-slate-700">
                          <input
                            type="radio"
                            name="scope"
                            value="CATEGORY"
                            checked={scope === 'CATEGORY'}
                            onChange={() => setScope('CATEGORY')}
                            className="w-4.5 h-4.5 text-blue-600 border-slate-305 focus:ring-blue-500/20"
                          />
                          <span>Selected Categories Only (CATEGORY)</span>
                        </label>
                      </div>
                    </div>

                    {/* PRODUCT scoped list selector */}
                    {scope === 'PRODUCT' && (
                      <div className="border border-slate-200/80 rounded-2xl p-4.5 space-y-4.5 bg-slate-50/20 text-left animate-fadeIn">
                        <div className="space-y-1">
                          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700">Select Applicable Products</h4>
                          <p className="text-[9.5px] font-bold text-slate-400 leading-tight">Search and pick the devices that qualify for this discount.</p>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search by product name, category, or brand..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="w-full h-11 pl-10.5 pr-4 border border-slate-250 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                        </div>
                        
                        {isScopedDataLoading ? (
                          <div className="py-10 text-center flex items-center justify-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            <span className="text-xs text-slate-455 font-bold">Fetching products list...</span>
                          </div>
                        ) : filteredSearchProducts.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400 font-bold bg-white rounded-xl border border-slate-100">No products matched query.</div>
                        ) : (
                          <div className="max-h-[220px] overflow-y-auto border border-slate-150 rounded-xl bg-white divide-y divide-slate-100 pr-1">
                            {filteredSearchProducts.map((prod) => {
                              const isChecked = applicableProducts.includes(prod.productId);
                              return (
                                <label
                                  key={prod.productId}
                                  className={`flex items-center space-x-3.5 p-3 hover:bg-slate-50/60 cursor-pointer select-none transition-colors ${isChecked ? 'bg-blue-50/20' : ''}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setApplicableProducts(prev => prev.filter(x => x !== prod.productId));
                                      } else {
                                        setApplicableProducts(prev => [...prev, prod.productId]);
                                      }
                                    }}
                                    className="w-4 h-4 text-blue-600 rounded border-slate-350 focus:ring-blue-500/20"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[11.5px] font-black text-slate-800 truncate leading-snug">{prod.name}</div>
                                    <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">{prod.brand} • {prod.categoryId}</div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                        {formSubmitted && formErrors.scope && (
                          <p className="text-[9.5px] font-bold text-red-500 pl-1.5">{formErrors.scope}</p>
                        )}
                      </div>
                    )}

                    {/* CATEGORY scoped list selector */}
                    {scope === 'CATEGORY' && (
                      <div className="border border-slate-200/80 rounded-2xl p-4.5 space-y-4.5 bg-slate-50/20 text-left animate-fadeIn">
                        <div className="space-y-1">
                          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700">Select Applicable Categories</h4>
                          <p className="text-[9.5px] font-bold text-slate-400 leading-tight">Search and pick the categories of products that qualify for this discount.</p>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search by category name..."
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            className="w-full h-11 pl-10.5 pr-4 border border-slate-250 rounded-xl text-xs font-semibold text-slate-805 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                        </div>

                        {isScopedDataLoading ? (
                          <div className="py-10 text-center flex items-center justify-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            <span className="text-xs text-slate-455 font-bold">Fetching categories list...</span>
                          </div>
                        ) : filteredSearchCategories.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400 font-bold bg-white rounded-xl border border-slate-100">No categories matched query.</div>
                        ) : (
                          <div className="max-h-[200px] overflow-y-auto border border-slate-150 rounded-xl bg-white divide-y divide-slate-100 pr-1">
                            {filteredSearchCategories.map((cat) => {
                              const isChecked = applicableCategories.includes(cat.name);
                              return (
                                <label
                                  key={cat.name}
                                  className={`flex items-center space-x-3.5 p-3 hover:bg-slate-50/60 cursor-pointer select-none transition-colors ${isChecked ? 'bg-blue-50/20' : ''}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setApplicableCategories(prev => prev.filter(x => x !== cat.name));
                                      } else {
                                        setApplicableCategories(prev => [...prev, cat.name]);
                                      }
                                    }}
                                    className="w-4 h-4 text-blue-600 rounded border-slate-350 focus:ring-blue-500/20"
                                  />
                                  <span className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider">{cat.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                        {formSubmitted && formErrors.scope && (
                          <p className="text-[9.5px] font-bold text-red-500 pl-1.5">{formErrors.scope}</p>
                        )}
                      </div>
                    )}

                  </div>
                </div>

                {/* FORM ACTIONS */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3.5 select-none">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/coupons')}
                    className="border border-slate-250 hover:bg-slate-50 px-5 h-12 rounded-xl text-xs font-bold text-slate-650 cursor-pointer active:scale-95 transition-all shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isFormSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-7.5 h-12 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-blue-500/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-75 disabled:cursor-not-allowed font-mono"
                  >
                    {isFormSubmitting && <Loader2 className="w-4 h-4 animate-spin text-white/80" />}
                    <span>{mode === 'create' ? 'Create Coupon' : 'Update Coupon'}</span>
                  </button>
                </div>

              </form>
            )}
          </div>
        )}

        {/* DETAILS MODAL OVERLAY */}
        {viewingCoupon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white border border-slate-100 rounded-3xl p-6.5 max-w-lg w-full shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Ticket className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Coupon Specifications</h3>
                </div>
                <button
                  onClick={() => setViewingCoupon(null)}
                  className="p-1 hover:bg-slate-55 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-4 text-xs font-bold text-slate-600">
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-medium">Coupon Code</span>
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded font-black text-[10.5px] uppercase tracking-wider border border-blue-100 font-mono">
                    {viewingCoupon.couponCode}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-medium">Coupon Name</span>
                  <span className="text-slate-800 font-black">{viewingCoupon.couponName}</span>
                </div>

                {viewingCoupon.description && (
                  <div className="flex flex-col space-y-1 border-b border-slate-50 pb-2 text-left">
                    <span className="text-slate-400 font-medium">Description</span>
                    <p className="text-slate-655 font-semibold leading-relaxed mt-0.5">{viewingCoupon.description}</p>
                  </div>
                )}

                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-medium">Discount Value</span>
                  <span className="text-slate-800 font-black">
                    {viewingCoupon.discountType === 'PERCENTAGE' ? `${viewingCoupon.discountValue}%` : <Price value={viewingCoupon.discountValue} />}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-medium">Discount Type</span>
                  <span className="text-slate-755 uppercase font-mono">{viewingCoupon.discountType}</span>
                </div>

                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-medium">Minimum Purchase Amount</span>
                  <span className="text-slate-800 font-black">
                    {viewingCoupon.minimumOrderAmount ? <Price value={viewingCoupon.minimumOrderAmount} /> : '₹0'}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-medium">Expiry Date</span>
                  <span className="text-slate-800 font-black">
                    {viewingCoupon.expiryDate ? new Date(viewingCoupon.expiryDate).toLocaleDateString() : 'Never'}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-medium">Target Scope</span>
                  <span className="bg-slate-50 text-slate-700 px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase tracking-wide border border-slate-100">
                    {viewingCoupon.scope || 'ALL'}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-medium">Status</span>
                  <CouponStatusBadge isActive={viewingCoupon.isActive} expiryDate={viewingCoupon.expiryDate} />
                </div>

                {/* Applicable items details */}
                {viewingCoupon.scope === 'PRODUCT' && viewingCoupon.applicableProducts && viewingCoupon.applicableProducts.length > 0 && (
                  <div className="flex flex-col space-y-1.5 border-b border-slate-50 pb-2 text-left">
                    <span className="text-slate-400 font-medium">Applicable Product IDs</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {viewingCoupon.applicableProducts.map(pid => (
                        <span key={pid} className="bg-slate-50 border border-slate-205 text-slate-700 px-2 py-0.5 rounded text-[9px] font-semibold font-mono">
                          {pid}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {viewingCoupon.scope === 'CATEGORY' && viewingCoupon.applicableCategories && viewingCoupon.applicableCategories.length > 0 && (
                  <div className="flex flex-col space-y-1.5 border-b border-slate-50 pb-2 text-left">
                    <span className="text-slate-400 font-medium">Applicable Categories</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {viewingCoupon.applicableCategories.map(cat => (
                        <span key={cat} className="bg-slate-50 border border-slate-205 text-slate-700 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {viewingCoupon.createdAt && (
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400 font-medium">Created Date</span>
                    <span className="text-slate-500 font-medium font-mono">{new Date(viewingCoupon.createdAt).toLocaleString()}</span>
                  </div>
                )}

                {viewingCoupon.updatedAt && (
                  <div className="flex justify-between pb-2">
                    <span className="text-slate-400 font-medium">Last Updated</span>
                    <span className="text-slate-500 font-medium font-mono">{new Date(viewingCoupon.updatedAt).toLocaleString()}</span>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => setViewingCoupon(null)}
                  className="px-5 h-10 border border-slate-250 hover:bg-slate-50 text-xs font-bold text-slate-655 rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  Close details
                </button>
              </div>

            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL OVERLAY */}
        {deletingCoupon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white border border-slate-100 rounded-3xl p-6.5 max-w-sm w-full shadow-2xl space-y-5">
              
              {/* Modal Header */}
              <div className="flex items-center space-x-3 text-left">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-[14.5px] font-black text-slate-900 leading-tight">Delete Discount Coupon?</h3>
                  <p className="text-[11px] text-slate-450 font-bold mt-1">This operation cannot be undone. All validation benefits will end.</p>
                </div>
              </div>

              {/* Modal Body */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-xs font-bold text-slate-700 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Coupon Code:</span>
                  <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase border border-red-100 font-mono">
                    {deletingCoupon.couponCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Coupon Name:</span>
                  <span className="text-slate-800 font-black text-right truncate max-w-[200px]">{deletingCoupon.couponName}</span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center space-x-3.5 justify-end">
                <button
                  onClick={() => setDeletingCoupon(null)}
                  className="px-4.5 h-10 border border-slate-255 hover:bg-slate-50 text-xs font-bold text-slate-655 rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCoupon}
                  className="px-5.5 h-10 bg-red-600 hover:bg-red-750 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-600/20 active:scale-95 cursor-pointer font-mono"
                >
                  Delete
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminCoupons;
