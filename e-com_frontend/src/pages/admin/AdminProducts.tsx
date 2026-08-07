import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { productService } from '../../services/product.service';
import { brandService } from '../../services/brand.service';
import { inventoryService } from '../../services/inventory.service';
import { AdminLayout } from '../../layouts/AdminLayout';
import { ProductsTableSkeleton, DetailPageSkeleton, SafeImage } from '../../components/admin/AdminSkeletons';
import { getImageUrl } from '../../utils/imageHelper';
import {
  Search,
  Plus,
  Filter,
  Trash2,
  Grid,
  Boxes,
  CheckCircle,
  XCircle,
  ArrowLeft,
  X,
  Heart,
  Info,
  ChevronDown,
  Camera,
  Percent,
  Sliders,
  RefreshCw,
  Move,
  Package,
  Tag,
  IndianRupee,
  Upload,
  Check,
  Archive,
  Star,
  AlertTriangle,
} from 'lucide-react';

interface ProductImage {
  imageUrl: string;
  key: string;
  fileId?: string;
}

interface ProductItem {
  id: string;
  displayId?: string;
  name: string;
  brand: string;
  category: string;
  categoryId: string;
  price: number;
  discount: number;
  stock: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  featured: boolean;
  img: string;
  description: string;
  images: ProductImage[];
  specifications: Record<string, string>;
  createdAt?: string;
  updatedAt: string;
}



const ProductStatusBadge: React.FC<{ status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' }> = ({ status }) => {
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-650 border border-emerald-100 flex-shrink-0">
        <CheckCircle className="w-2.5 h-2.5" />
        <span>Active</span>
      </span>
    );
  }
  if (status === 'INACTIVE') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-100 flex-shrink-0">
        <XCircle className="w-2.5 h-2.5" />
        <span>Inactive</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 flex-shrink-0">
      <Archive className="w-2.5 h-2.5" />
      <span>Archived</span>
    </span>
  );
};



// --- Product Stat Card ---
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

const brandOptions = ['Apple', 'ASUS', 'Dell', 'Samsung', 'Lenovo', 'HP', 'Sony', 'Intel', 'AMD'];

// --- Searchable Brand Dropdown ---
const BrandDropdown: React.FC<{
  selected: string;
  brands: string[];
  onSelect: (brand: string) => void;
}> = ({ selected, brands, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = brands.filter(b => 
    b.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative w-full text-left">
      <label className="absolute left-4.5 -top-2 z-10 text-[9.5px] bg-white px-1.5 text-blue-655 font-bold">
        Brand *
      </label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between border border-slate-205 hover:border-slate-350 rounded-2xl bg-white py-3.5 px-4 cursor-pointer shadow-sm shadow-slate-100/50"
      >
        <div className="flex items-center space-x-2">
          <Package className="w-4 h-4 text-slate-400" />
          <span className="text-[12.5px] font-bold text-slate-800">
            {selected || 'Select Brand'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-12.5 left-0 right-0 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 space-y-2 mt-1 animate-fadeIn">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search brands..."
              className="w-full h-8.5 pl-8.5 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="max-h-40 overflow-y-auto space-y-0.5 divide-y divide-slate-50">
            {filtered.map(brand => (
              <div
                key={brand}
                onClick={() => {
                  onSelect(brand);
                  setIsOpen(false);
                  setQuery('');
                }}
                className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer text-[12px] font-bold text-slate-755 transition-colors"
              >
                <span>{brand}</span>
                {selected === brand && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-4 text-slate-400 text-[11px] font-bold">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Searchable Category Dropdown ---
const CategoryDropdown: React.FC<{
  selectedId: string;
  categories: { id: string; label: string }[];
  onSelect: (id: string) => void;
}> = ({ selectedId, categories, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  
  const selectedCat = categories.find(c => c.id === selectedId);
  const filtered = categories.filter(c => 
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative w-full text-left">
      <label className="absolute left-4.5 -top-2 z-10 text-[9.5px] bg-white px-1.5 text-blue-650 font-bold">
        Category *
      </label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between border rounded-2xl py-3.5 px-4 cursor-pointer transition-all duration-200 ${
          isOpen
            ? 'bg-slate-50/80 border-blue-600 ring-4 ring-blue-600/10 shadow-sm shadow-blue-600/5'
            : 'bg-white hover:bg-slate-50/60 border-slate-200 hover:border-slate-350 shadow-sm shadow-slate-100/40'
        }`}
      >
        <div className="flex items-center space-x-2">
          <Tag className="w-4 h-4 text-slate-400" />
          <span className="text-[12.5px] font-bold text-slate-800">
            {selectedCat ? selectedCat.label : 'Select Category'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-12.5 left-0 right-0 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 space-y-2 mt-1 animate-fadeIn">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search categories..."
              className="w-full h-8.5 pl-8.5 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="max-h-40 overflow-y-auto space-y-0.5 divide-y divide-slate-50">
            {filtered.map(cat => (
              <div
                key={cat.id}
                onClick={() => {
                  onSelect(cat.id);
                  setIsOpen(false);
                  setQuery('');
                }}
                className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer text-[12px] font-bold text-slate-755 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>{cat.label}</span>
                </div>
                {selectedId === cat.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-4 text-slate-400 text-[11px] font-bold">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Custom Status Dropdown Selector ---
const StatusDropdown: React.FC<{
  selected: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  onSelect: (status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') => void;
}> = ({ selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { value: 'ACTIVE', label: 'Active', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle },
    { value: 'INACTIVE', label: 'Inactive', color: 'text-slate-500 bg-slate-50 border-slate-100', icon: XCircle },
    { value: 'ARCHIVED', label: 'Archived', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Archive },
  ];

  const selectedOpt = options.find(o => o.value === selected) || options[0];

  return (
    <div className="relative w-full text-left">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between border rounded-2xl h-14 px-4 cursor-pointer transition-all duration-200 ${
          isOpen
            ? 'bg-slate-50/80 border-blue-600 ring-4 ring-blue-600/10 shadow-sm shadow-blue-600/5'
            : 'bg-white hover:bg-slate-50/60 border-slate-200 hover:border-slate-350 shadow-sm shadow-slate-100/40'
        }`}
      >
        <div className="flex items-center space-x-2">
          <selectedOpt.icon className={`w-4 h-4 ${selectedOpt.color.split(' ')[0]}`} />
          <span className="text-[12.5px] font-bold text-slate-800">
            {selectedOpt.label}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-12.5 left-0 right-0 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 mt-1 animate-fadeIn space-y-0.5">
          {options.map(opt => {
            const Icon = opt.icon;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onSelect(opt.value as any);
                  setIsOpen(false);
                }}
                className="flex items-center space-x-2.5 p-2 hover:bg-slate-50 rounded-xl cursor-pointer text-[12px] font-bold text-slate-755 transition-colors"
              >
                <Icon className={`w-4 h-4 ${opt.color.split(' ')[0]}`} />
                <span className="flex-1">{opt.label}</span>
                {selected === opt.value && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </div>
            );
          })}
        </div>
      )}
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
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ label, selected, options, isOpen, setIsOpen, onSelect }) => {
  const activeLabel = options.find(o => o.value === selected)?.label || '';
  return (
    <div className="relative min-w-[168px] text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-10 w-full px-4 rounded-xl border text-slate-700 text-[11.5px] font-bold transition-all flex items-center justify-between space-x-2.5 shadow-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none cursor-pointer ${
          isOpen
            ? 'bg-slate-50/80 border-blue-600 ring-4 ring-blue-600/10'
            : 'bg-white hover:bg-slate-50/60 border-slate-200 hover:border-slate-350 shadow-sm shadow-slate-100/40'
        }`}
      >
        <span className="truncate">{label}: {activeLabel}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 w-48 flex flex-col animate-fadeIn"
          onMouseLeave={() => setIsOpen(false)}
        >
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => {
                onSelect(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 text-[11.5px] font-bold transition-colors hover:bg-slate-50 ${
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

// --- Premium Floating Label Input with Blue Focus Animation ---
const FloatingInput: React.FC<{
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  type?: string;
  icon?: React.ReactNode;
  placeholder?: string;
}> = ({ label, value, onChange, type = "text", icon, placeholder }) => {
  const [isFocused, setIsFocused] = useState(false);
  const isFilled = value !== "" && value !== undefined && value !== null && value !== 0;

  return (
    <div className="relative w-full text-left">
      <div className={`relative flex items-center border rounded-2xl transition-all duration-200 ${
        isFocused 
          ? 'bg-slate-50/80 border-blue-600 ring-4 ring-blue-600/10 shadow-sm shadow-blue-600/5' 
          : 'bg-white hover:bg-slate-50/60 border-slate-205 hover:border-slate-350 shadow-sm shadow-slate-100/40'
      }`}>
        {icon && <div className="pl-4 text-slate-400 flex-shrink-0">{icon}</div>}
        <div className="flex-1 relative py-4 px-4.5">
          <label className={`absolute left-4.5 transition-all duration-200 pointer-events-none font-semibold ${
            isFocused || isFilled 
              ? '-top-2 text-[9.5px] bg-white px-1.5 text-blue-655' 
              : 'top-1/2 -translate-y-1/2 text-[12.5px] text-slate-400'
          }`}>
            {label}
          </label>
          <input
            type={type}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isFocused ? placeholder : ""}
            className="w-full bg-transparent text-[13px] font-bold text-slate-800 focus:outline-none placeholder-slate-300"
          />
        </div>
      </div>
    </div>
  );
};

const FloatingTextarea: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => {
  const [isFocused, setIsFocused] = useState(false);
  const isFilled = value !== "" && value !== undefined && value !== null;

  return (
    <div className="relative w-full text-left">
      <div className={`relative flex items-start border rounded-2xl transition-all duration-200 ${
        isFocused 
          ? 'bg-slate-50/80 border-blue-600 ring-4 ring-blue-600/10 shadow-sm shadow-blue-600/5' 
          : 'bg-white hover:bg-slate-50/60 border-slate-205 hover:border-slate-350 shadow-sm shadow-slate-100/40'
      }`}>
        <div className="flex-1 relative py-4 px-4.5">
          <label className={`absolute left-4.5 transition-all duration-200 pointer-events-none font-semibold ${
            isFocused || isFilled 
              ? '-top-2 text-[9.5px] bg-white px-1.5 text-blue-655' 
              : 'top-4 text-[12.5px] text-slate-400'
          }`}>
            {label}
          </label>
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isFocused ? placeholder : ""}
            rows={5}
            className="w-full bg-transparent text-[12.5px] font-semibold text-slate-700 focus:outline-none placeholder-slate-300 resize-none mt-2"
          />
        </div>
      </div>
    </div>
  );
};

const AdminProducts: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isCreateRoute = location.pathname.endsWith('/create');

  // Backend dynamic lists
  const [productsList, setProductsList] = useState<ProductItem[]>([]);
  const [kpiStats, setKpiStats] = useState({
    total: 0,
    active: 0,
    outOfStock: 0,
    lowStock: 0
  });

  const loadKpiStats = async () => {
    try {
      let prods: any[] = [];
      let invs: any[] = [];

      try {
        const allProdsRes = await productService.getProducts({ limit: 1000 });
        if (allProdsRes) {
          if (Array.isArray(allProdsRes)) {
            prods = allProdsRes;
          } else {
            prods = allProdsRes.products || allProdsRes.data || [];
          }
        }
      } catch (prodErr) {
        console.error('Error loading products for KPIs:', prodErr);
      }

      try {
        const invRes = await inventoryService.getAllInventory();
        if (invRes) {
          if (Array.isArray(invRes)) {
            invs = invRes;
          } else {
            invs = invRes.data || invRes.inventory || [];
          }
        }
      } catch (invErr) {
        console.error('Error loading inventory for KPIs:', invErr);
      }

      const getStockStatus = (p: any) => {
        const invItem = invs.find((inv: any) => inv.productId === p.id || inv.productId === p.productId);
        if (invItem) {
          return (invItem.status || '').trim().toLowerCase();
        }
        const stock = p.stock !== undefined ? p.stock : (p.inventoryCount !== undefined ? p.inventoryCount : 0);
        if (stock === 0) return 'out of stock';
        if (stock <= 10) return 'low stock';
        return 'in stock';
      };

      const total = prods.length;
      const active = prods.filter((p: any) => (p.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
      const outOfStock = prods.filter((p: any) => {
        const st = getStockStatus(p);
        return st === 'out of stock' || st === 'outofstock';
      }).length;
      const lowStock = prods.filter((p: any) => {
        const st = getStockStatus(p);
        return st === 'low stock' || st === 'lowstock';
      }).length;

      setKpiStats({ total, active, outOfStock, lowStock });
    } catch (err) {
      console.error('Error loading product KPIs:', err);
    }
  };
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [brandOptionsList, setBrandOptionsList] = useState<string[]>(brandOptions);
  const [dbBrands, setDbBrands] = useState<string[]>([]);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Active product selections
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Filter States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [featuredFilter, setFeaturedFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('latest');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination States
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Dropdown Open States
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [isBrandFilterOpen, setIsBrandFilterOpen] = useState(false);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isFeaturedFilterOpen, setIsFeaturedFilterOpen] = useState(false);

  // Delete product confirmation modal
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);

  // Loaded product full details
  const [productDetails, setProductDetails] = useState<ProductItem | null>(null);
  const [productNotFound, setProductNotFound] = useState(false);

  // Synchronously update loading states when mode/productId changes to prevent visual flashes
  const [prevProductId, setPrevProductId] = useState(productId);
  const [prevIsCreateRoute, setPrevIsCreateRoute] = useState(isCreateRoute);

  if (productId !== prevProductId || isCreateRoute !== prevIsCreateRoute) {
    setPrevProductId(productId);
    setPrevIsCreateRoute(isCreateRoute);
    setProductNotFound(false);
    if (isCreateRoute) {
      setDetailsLoading(false);
      setEditingProductId(null);
      setIsCreatingProduct(true);
      setIsPreviewMode(false);
    } else if (productId && productId !== 'create') {
      setDetailsLoading(true);
      setEditingProductId(productId);
      setIsCreatingProduct(true);
      setIsPreviewMode(true);
    } else {
      setDetailsLoading(false);
      setEditingProductId(null);
      setIsCreatingProduct(false);
      setIsPreviewMode(false);
    }
  }

  // --- Create Product Form State ---
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>('ACTIVE');
  
  // Image gallery list
  const [uploadedImages, setUploadedImages] = useState<ProductImage[]>([]);
  const [pendingFiles, setPendingFiles] = useState<{ id: string; file: File }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Specifications state
  const [specsList, setSpecsList] = useState<{ key: string; value: string }[]>([
    { key: 'Processor', value: 'Intel Core i9' },
    { key: 'RAM', value: '32 GB' },
    { key: 'Storage', value: '1 TB SSD' },
  ]);

  // Thumbnail active preview indices
  const [activePreviewImageIdx, setActivePreviewImageIdx] = useState(0);

  // Success Message Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getCategoryLabel = (id: string) => {
    return categoriesList.find(c => c.categoryId === id)?.name || 'Uncategorized';
  };

  // Convert categories list to selection options format
  const categoriesOptions = categoriesList.map(c => ({
    value: c.categoryId,
    label: c.name
  }));

  // Convert brand choices list to selection options format
  const brandsOptions = brandOptionsList.map(b => ({
    value: b,
    label: b
  }));

  // Sort choices
  const sortOptions = [
    { value: 'latest', label: 'Latest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'priceAsc', label: 'Price Low → High' },
    { value: 'priceDesc', label: 'Price High → Low' },
    { value: 'nameAsc', label: 'Name A → Z' },
    { value: 'nameDesc', label: 'Name Z → A' },
  ];

  const mapProductToItem = (p: any): ProductItem => {
    let imagesArr: ProductImage[] = [];
    if (p.images && Array.isArray(p.images)) {
      imagesArr = p.images.map((img: any) => ({
        imageUrl: getImageUrl(typeof img === 'string' ? img : (img.imageUrl || img.url || '')),
        key: typeof img === 'string' ? img : (img.key || '')
      }));
    } else if (p.img) {
      imagesArr = [{ imageUrl: getImageUrl(p.img), key: 'main-img' }];
    } else if (p.images && typeof p.images === 'string') {
      try {
        const parsed = JSON.parse(p.images);
        if (Array.isArray(parsed)) {
          imagesArr = parsed.map((img: any) => ({
            imageUrl: getImageUrl(typeof img === 'string' ? img : (img.imageUrl || img.url || '')),
            key: typeof img === 'string' ? img : (img.key || '')
          }));
        }
      } catch (e) {
        imagesArr = [{ imageUrl: getImageUrl(p.images), key: 'main-img' }];
      }
    }

    const firstImage = imagesArr[0]?.imageUrl || getImageUrl(p);

    return {
      id: p.id || p.productId || '',
      displayId: p.displayId || p.display_id || undefined,
      name: p.name || '',
      brand: p.brand || '',
      category: p.category || p.categoryName || (p.categoryId ? getCategoryLabel(p.categoryId) : 'Uncategorized'),
      categoryId: p.categoryId || '',
      price: p.price || 0,
      discount: p.discount || 0,
      stock: p.stock !== undefined ? p.stock : (p.inventoryCount !== undefined ? p.inventoryCount : 0),
      status: p.status || 'ACTIVE',
      featured: !!p.featured,
      img: firstImage,
      description: p.description || '',
      images: imagesArr,
      specifications: p.specifications || {},
      createdAt: p.createdAt 
        ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : (p.createdDate || ''),
      updatedAt: p.updatedAt 
        ? new Date(p.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : (p.updatedDate || ''),
    };
  };

  // Pricing calculations
  const finalPrice = Math.round(price * (1 - (discount || 0) / 100));

  // Debounce search state
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 405);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page pagination on filter parameter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory, selectedBrand, minPrice, maxPrice, statusFilter, featuredFilter, sortBy]);

  // Load categories and brands list on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await productService.getCategories();
        let list: any[] = [];
        if (res) {
          if (Array.isArray(res)) {
            list = res;
          } else if (res.categories && Array.isArray(res.categories)) {
            list = res.categories;
          } else if (res.data && Array.isArray(res.data)) {
            list = res.data;
          }
        }
        setCategoriesList(list);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    const loadBrands = async () => {
      try {
        const res = await brandService.getAllBrands();
        if (res && res.length > 0) {
          const names = res.map(b => b.name);
          setDbBrands(names);
          setBrandOptionsList(names);
        }
      } catch (err) {
        console.error('Error fetching database brands:', err);
      }
    };
    loadCategories();
    loadBrands();
    loadKpiStats();
  }, []);

  // Main list fetcher
  const loadProducts = async () => {
    setLoading(true);
    setIsRefreshing(true);
    try {
      const params: any = {
        page,
        limit,
        search: debouncedSearch,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        brand: selectedBrand !== 'ALL' ? selectedBrand : undefined,
        minPrice,
        maxPrice,
        sort: sortBy,
      };

      if (featuredFilter !== 'ALL') {
        params.featured = featuredFilter === 'true';
      }
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      const res = await productService.getProducts(params);
      let fetched: any[] = [];
      let total = 0;
      let pages = 1;

      if (res) {
        if (Array.isArray(res)) {
          fetched = res;
          total = res.length;
        } else {
          fetched = res.products || res.data || [];
          const meta = res.meta || res.pagination || {};
          total = meta.total !== undefined ? meta.total : fetched.length;
          pages = meta.totalPages !== undefined ? meta.totalPages : Math.ceil(total / limit);
        }
      }

      const mapped = fetched.map(mapProductToItem);
      setProductsList(mapped);
      setTotalProducts(total);
      setTotalPages(Math.max(1, pages));

      // Derive brands dynamically from product list
      if (selectedBrand === 'ALL' && fetched.length > 0) {
        const uniqueBrands = Array.from(new Set(mapped.map(p => p.brand).filter(Boolean)));
        const baseBrands = dbBrands.length > 0 ? dbBrands : brandOptions;
        const merged = Array.from(new Set([...uniqueBrands, ...baseBrands]));
        setBrandOptionsList(merged);
      }
    } catch (err: any) {
      console.error('Error loading products:', err);
      triggerToast(err.response?.data?.message || err.message || 'Error loading products.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load products list effect
  useEffect(() => {
    if (!productId) {
      loadProducts();
    }
  }, [page, limit, debouncedSearch, selectedCategory, selectedBrand, minPrice, maxPrice, statusFilter, featuredFilter, sortBy, productId]);

  // Load detailed single view
  useEffect(() => {
    const fetchDetails = async () => {
      if (productId && productId !== 'create') {
        setDetailsLoading(true);
        setIsPreviewMode(true);
        setEditingProductId(productId);
        try {
          const res = await productService.getProductById(productId);
          if (res) {
            const item = res.data || res.product || res;
            const mapped = mapProductToItem(item);
            setProductDetails(mapped);
            setProductNotFound(false);
            setName(mapped.name);
            setDescription(mapped.description);
            setBrand(mapped.brand);
            setCategoryId(mapped.categoryId);
            setPrice(mapped.price);
            setDiscount(mapped.discount);
            setFeatured(mapped.featured);
            setStatus(mapped.status);
            setUploadedImages(mapped.images || []);
            const specsArray = Object.entries(mapped.specifications || {}).map(([key, value]) => ({
              key,
              value,
            }));
            setSpecsList(specsArray);
          } else {
            setProductNotFound(true);
          }
        } catch (err: any) {
          console.error('Error loading product details:', err);
          triggerToast(err.response?.data?.message || err.message || 'Error loading product details.');
          setProductNotFound(true);
        } finally {
          setDetailsLoading(false);
        }
      } else if (productId === 'create') {
        setIsCreatingProduct(true);
        setEditingProductId(null);
        setIsPreviewMode(false);
        resetCreateForm();
      } else {
        setIsCreatingProduct(false);
        setEditingProductId(null);
        setIsPreviewMode(false);
        resetCreateForm();
      }
    };
    fetchDetails();
  }, [productId]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
  };

  // Local files preview/queue flow
  const handleUploadImages = (files: FileList) => {
    const filesArray = Array.from(files);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    const validFiles: { id: string; file: File }[] = [];
    const newImages: ProductImage[] = [];

    for (const f of filesArray) {
      if (!validTypes.includes(f.type)) {
        triggerToast(`Invalid file type: ${f.name}. Supported formats: JPG, PNG, WEBP.`);
        return;
      }
      if (f.size > maxSize) {
        triggerToast(`File too large: ${f.name}. Max limit is 5MB.`);
        return;
      }
      
      const tempId = 'pending-' + Math.random().toString(36).substr(2, 9);
      const localUrl = URL.createObjectURL(f);
      validFiles.push({ id: tempId, file: f });
      newImages.push({ imageUrl: localUrl, key: tempId, fileId: tempId });
    }

    setPendingFiles(prev => [...prev, ...validFiles]);
    setUploadedImages(prev => [...prev, ...newImages]);
    triggerToast(`${newImages.length} image(s) queued for upload.`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadImages(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadImages(e.target.files);
    }
  };

  const handleDeleteImage = (index: number) => {
    const deletedImg = uploadedImages[index];
    if (deletedImg && deletedImg.fileId) {
      setPendingFiles(prev => prev.filter(f => f.id !== deletedImg.fileId));
      try {
        URL.revokeObjectURL(deletedImg.imageUrl);
      } catch (e) {}
    }
    setUploadedImages(prev => prev.filter((_, idx) => idx !== index));
    triggerToast('Image deleted.');
  };

  const handleReplaceImage = (index: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!validTypes.includes(file.type)) {
          triggerToast(`Invalid file type: ${file.name}. Supported formats: JPG, PNG, WEBP.`);
          return;
        }
        if (file.size > maxSize) {
          triggerToast(`File too large: ${file.name}. Max limit is 5MB.`);
          return;
        }

        const tempId = 'pending-' + Math.random().toString(36).substr(2, 9);
        const localUrl = URL.createObjectURL(file);
        
        const oldImg = uploadedImages[index];

        setPendingFiles(prev => {
          let updated = prev;
          if (oldImg && oldImg.fileId) {
            updated = updated.filter(f => f.id !== oldImg.fileId);
            try {
              URL.revokeObjectURL(oldImg.imageUrl);
            } catch (e) {}
          }
          return [...updated, { id: tempId, file }];
        });

        setUploadedImages(prev =>
          prev.map((img, idx) =>
            idx === index ? { imageUrl: localUrl, key: tempId, fileId: tempId } : img
          )
        );
        triggerToast('Image replaced in queue.');
      }
    };
    input.click();
  };

  // Specs helper handlers
  const handleAddSpecRow = () => {
    setSpecsList(prev => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveSpecRow = (index: number) => {
    setSpecsList(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', text: string) => {
    setSpecsList(prev =>
      prev.map((row, idx) =>
        idx === index ? { ...row, [field]: text } : row
      )
    );
  };



  // Validate form requirements before publishing (new product)
  const isPublishEnabled = !!(
    name.trim() &&
    brand.trim() &&
    categoryId &&
    price > 0 &&
    uploadedImages.length > 0 &&
    description.trim()
  );

  // For editing existing products: more lenient — just needs basic fields
  const isSaveEnabled = editingProductId
    ? !!(name.trim() && brand.trim() && price > 0 && description.trim())
    : isPublishEnabled;

  const handlePublishProduct = async () => {
    if (!isSaveEnabled) return;

    setIsSaving(true);
    try {
      const toUpload = uploadedImages.filter(img => img.fileId);
      let s3Uploads: { fileId: string; imageUrl: string; key: string }[] = [];
      
      if (toUpload.length > 0) {
        setIsUploading(true);
        const filesPayload = toUpload.map(img => {
          const matchedFile = pendingFiles.find(pf => pf.id === img.fileId);
          if (!matchedFile) {
            throw new Error(`File details not found in upload queue for key: ${img.key}`);
          }
          return matchedFile.file.name;
        });

        const res = await productService.generateUploadUrls(filesPayload);
        let urls: any[] = [];
        if (res && res.success && res.data && Array.isArray(res.data.images)) {
          urls = res.data.images;
        } else if (res && res.success && Array.isArray(res.data)) {
          urls = res.data;
        } else if (res && Array.isArray(res.images)) {
          urls = res.images;
        } else if (Array.isArray(res)) {
          urls = res;
        } else if (res.data && Array.isArray(res.data)) {
          urls = res.data;
        }

        if (urls.length === 0) {
          throw new Error('Failed to generate pre-signed upload URLs from server.');
        }

        setUploadProgress(10);
        const uploadPromises = toUpload.map(async (img, idx) => {
          const item = urls[idx];
          const matchedFile = pendingFiles.find(pf => pf.id === img.fileId);
          await productService.uploadImagesToS3(item.uploadUrl || item.url, matchedFile!.file);
          return {
            fileId: img.fileId!,
            imageUrl: item.imageUrl || item.url.split('?')[0],
            key: item.key
          };
        });

        s3Uploads = await Promise.all(uploadPromises);
        setUploadProgress(100);
        setIsUploading(false);
      }

      const finalImages = uploadedImages.map(img => {
        if (img.fileId) {
          const uploadResult = s3Uploads.find(u => u.fileId === img.fileId);
          if (uploadResult) {
            return {
              url: uploadResult.imageUrl,
              key: uploadResult.key
            };
          }
          return null;
        } else {
          return {
            url: img.imageUrl,
            key: img.key
          };
        }
      }).filter((img): img is { url: string; key: string } => img !== null && !!img.url && !!img.key);

      // Debugging check: Console log the final images array before PUT/POST request
      console.log('Final S3 Images Array sent to backend:', finalImages);

      const specificationsObj: Record<string, string> = {};
      specsList.forEach(spec => {
        if (spec.key.trim() && spec.value.trim()) {
          specificationsObj[spec.key.trim()] = spec.value.trim();
        }
      });

      const selectedCategoryName = categoriesList.find((c: any) => c.categoryId === categoryId)?.name || '';

      const payload: any = {
        name: name.trim(),
        brand: brand.trim(),
        categoryId,
        categoryName: selectedCategoryName,
        price: Number(price),
        discount: Number(discount),
        description: description.trim(),
        images: finalImages,
        specifications: specificationsObj,
        featured,
        status,
      };

      if (editingProductId) {
        await productService.updateProduct(editingProductId, payload);
        triggerToast('Product Updated Successfully');
        loadKpiStats();
        
        // Refresh product details
        const res = await productService.getProductById(editingProductId);
        if (res) {
          const item = res.data || res.product || res;
          const mapped = mapProductToItem(item);
          setProductDetails(mapped);
          setName(mapped.name);
          setDescription(mapped.description);
          setBrand(mapped.brand);
          setCategoryId(mapped.categoryId);
          setPrice(mapped.price);
          setDiscount(mapped.discount);
          setFeatured(mapped.featured);
          setStatus(mapped.status);
          setUploadedImages(mapped.images || []);
          setPendingFiles([]);
          const specsArray = Object.entries(mapped.specifications || {}).map(([key, value]) => ({
            key,
            value,
          }));
          setSpecsList(specsArray);
        }
        setIsPreviewMode(true);
      } else {
        await productService.createProduct(payload);
        triggerToast('Product Created Successfully');
        loadKpiStats();
        navigate('/admin/products');
        resetCreateForm();
      }
    } catch (err: any) {
      console.error('Error publishing product:', err);
      triggerToast(err.response?.data?.message || err.message || 'Failed to publish product.');
    } finally {
      setIsSaving(false);
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const resetCreateForm = () => {
    setName('');
    setDescription('');
    setBrand('');
    setCategoryId('');
    setPrice(0);
    setDiscount(0);
    setFeatured(false);
    setStatus('ACTIVE');
    setUploadedImages([]);
    setPendingFiles([]);
    setIsUploading(false);
    setSpecsList([
      { key: 'Processor', value: 'Intel Core i9' },
      { key: 'RAM', value: '32 GB' },
      { key: 'Storage', value: '1 TB SSD' },
    ]);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await productService.deleteProduct(productToDelete.id);
      triggerToast('Product Deleted Successfully');
      setProductToDelete(null);
      navigate('/admin/products');
      loadProducts();
      loadKpiStats();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      triggerToast(err.response?.data?.message || err.message || 'Failed to delete product.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Completion calculation helper
  const getTrackerData = () => {
    const items = [
      { label: 'Basic Information', checked: !!(name && brand && categoryId) },
      { label: 'Images', checked: uploadedImages.length > 0 },
      { label: 'Price', checked: price > 0 },
      { label: 'Description', checked: !!description },
      { label: 'Specifications', checked: specsList.some(s => s.key && s.value) },
    ];

    const completed = items.filter(i => i.checked).length;
    const percentage = Math.round((completed / items.length) * 100);

    return {
      items,
      percentage,
    };
  };

  const tracker = getTrackerData();

  const filtered = productsList;

  // Full-width details view mockup
  const CustomerProductDetailsPreview = () => (
    <div className="bg-white rounded-[24px] border border-slate-200/60 p-6 md:p-8 shadow-[0_4px_30px_rgba(15,23,42,0.01)] text-left space-y-8 animate-fadeIn">
      <div className="flex items-center space-x-1.5 text-[10.5px] font-bold text-slate-400">
        <span>Home</span>
        <ChevronDown className="w-3 h-3 -rotate-90 text-slate-350" />
        <span>{getCategoryLabel(categoryId)}</span>
        <ChevronDown className="w-3 h-3 -rotate-90 text-slate-350" />
        <span className="text-slate-800">{name || 'New Product'}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Gallery */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="relative aspect-square md:aspect-[4/3] rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center p-6 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-gradient-to-tr from-blue-500/10 to-indigo-500/5 blur-3xl" />
            {uploadedImages.length > 0 ? (
              <SafeImage
                src={getImageUrl(uploadedImages[activePreviewImageIdx]?.imageUrl || uploadedImages[0]?.imageUrl)}
                alt={name}
                className="w-full h-full relative z-10"
                imgClassName="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-300 space-y-1.5">
                <Boxes className="w-10 h-10" />
                <span className="text-[10px] font-black uppercase">No Images Uploaded</span>
              </div>
            )}
          </div>

          {uploadedImages.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {uploadedImages.map((img, idx) => (
                <button
                  key={img.key}
                  onClick={() => setActivePreviewImageIdx(idx)}
                  className={`w-14 h-14 rounded-xl border-2 overflow-hidden bg-white transition-all flex items-center justify-center p-1 cursor-pointer ${
                    activePreviewImageIdx === idx ? 'border-blue-600 shadow' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <img src={getImageUrl(img.imageUrl)} alt="preview-thumb" className="w-full h-full object-contain rounded-lg" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-black text-blue-655 tracking-wider uppercase">
                {brand || 'Brand Name'}
              </span>
              
              <div className="flex items-center space-x-1.5">
                {featured && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 text-[8px] font-black uppercase tracking-wider">
                    Featured
                  </span>
                )}
                <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-full uppercase border ${
                  status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-650 border-emerald-100' : status === 'INACTIVE' ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  {status}
                </span>
              </div>
            </div>

            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {name || 'New Product Name Title'}
            </h1>

            <div className="flex items-center space-x-2 pt-1">
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-650 border border-emerald-100">
                <CheckCircle className="w-2.5 h-2.5 text-emerald-650" />
                <span>In Stock</span>
              </span>
              <span className="text-[11px] font-bold text-slate-400">Available for Dispatch</span>
            </div>
          </div>

          {/* Pricing Calculations */}
          <div className="p-4.5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900">
                  ₹{finalPrice.toLocaleString('en-IN')}
                </span>
                {discount > 0 && (
                  <span className="text-xs text-slate-400 line-through font-bold">
                    ₹{price.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Includes GST & Local delivery charges</p>
            </div>
          </div>

          <p className="text-xs text-slate-555 leading-relaxed font-semibold">
            {description || 'No description provided yet.'}
          </p>

          {/* Metadata: Created / Updated Dates */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-[10.5px] font-semibold text-slate-400">
            {productDetails?.createdAt && (
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider block text-[8.5px]">Created Date</span>
                <span className="text-slate-700 font-extrabold">{productDetails.createdAt}</span>
              </div>
            )}
            {productDetails?.updatedAt && (
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider block text-[8.5px]">Updated Date</span>
                <span className="text-slate-700 font-extrabold">{productDetails.updatedAt}</span>
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-2">
            <button className="flex-grow bg-slate-900 text-white rounded-full font-black text-[11px] uppercase tracking-widest h-12 shadow cursor-not-allowed" disabled>
              Add to Cart
            </button>
            <button className="flex-grow border-2 border-slate-900 text-slate-900 bg-white rounded-full font-black text-[11px] uppercase tracking-widest h-12 cursor-not-allowed" disabled>
              Buy Now
            </button>
            <button className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-455 bg-white">
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Specifications */}
      {specsList.some(s => s.key && s.value) && (
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <h3 className="text-base font-black text-slate-855 tracking-tight">Technical Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            {specsList.filter(s => s.key && s.value).map((spec, idx) => (
              <div key={idx} className="p-4 bg-slate-50/40 rounded-2xl border border-slate-100/70 flex items-start space-x-3 text-left">
                <div className="w-6.5 h-6.5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Info className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <h4 className="font-black text-slate-400 tracking-tight truncate uppercase text-[9px]">{spec.key}</h4>
                  <p className="text-slate-500 font-semibold leading-relaxed break-words">{spec.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AdminLayout>
      <div className="p-4.5 sm:p-7 space-y-6 relative bg-[#F8FAFC]">
        {/* Success message popup toast */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 flex items-center space-x-2 bg-slate-900 text-white text-[12px] font-bold px-4 py-3 rounded-xl shadow-lg border border-slate-800 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {productToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 max-w-sm w-full shadow-xl space-y-4 text-left">
              <div className="flex items-center space-x-3 text-red-500">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
                <h3 className="text-[15px] font-black text-slate-900 leading-tight">Delete Product?</h3>
              </div>
              <p className="text-[12.5px] text-slate-550 leading-relaxed font-semibold">
                Are you sure you want to delete product <strong className="text-slate-800">"{productToDelete.name}"</strong>? This action is permanent and cannot be undone.
              </p>
              <div className="flex items-center space-x-3 justify-end pt-1">
                <button
                  onClick={() => setProductToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-[12px] font-bold text-slate-650 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProduct}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-650 hover:bg-red-750 text-white text-[12px] font-bold rounded-xl transition-all shadow-md shadow-red-600/20 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete Product</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {!isCreatingProduct ? (
          /* ================= CATALOG LIST VIEW ================= */
          <div className="space-y-6 animate-fadeIn">
            {/* Page Header */}
            <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-[12px] font-bold text-blue-600 tracking-wider uppercase">Products Catalog</div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Products</h1>
                <p className="text-[12.5px] text-slate-555 font-medium mt-0.5">
                  Manage and view all products in your store
                </p>
              </div>
              <button
                onClick={() => {
                  navigate('/admin/products/create');
                }}
                className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-all flex items-center space-x-1.5 shadow-md shadow-blue-600/25 active:scale-95 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Total Products"
                subLabel="All Catalog Items"
                value={kpiStats.total}
                icon={<Boxes className="w-4 h-4" />}
                iconBg="bg-blue-50 text-blue-600 border border-blue-100/50"
              />
              <KpiCard
                label="Active Products"
                subLabel="Listed & Visible"
                value={kpiStats.active}
                icon={<CheckCircle className="w-4 h-4" />}
                iconBg="bg-emerald-50 text-emerald-600 border border-emerald-100/50"
              />
              <KpiCard
                label="Out of Stock"
                subLabel="Needs Reorder"
                value={kpiStats.outOfStock}
                icon={<AlertTriangle className="w-4 h-4" />}
                iconBg="bg-red-50 text-red-500 border border-red-100/50"
              />
              <KpiCard
                label="Low Stock"
                subLabel="Under 10 Units"
                value={kpiStats.lowStock}
                icon={<Sliders className="w-4 h-4" />}
                iconBg="bg-amber-50 text-amber-600 border border-amber-100/50"
              />
            </div>

            {/* Search, Sort, and Filters Panel */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => handleSearchChange(e.target.value)}
                    placeholder="Search products..."
                    className="w-full h-9 pl-9 pr-4 bg-slate-50/50 hover:bg-slate-50/30 hover:border-slate-300 focus:bg-slate-50/50 border border-slate-200 rounded-xl text-[12px] text-slate-700 placeholder-slate-405 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  />
                </div>

                <div className="flex items-center space-x-3 self-stretch sm:self-auto justify-end">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`h-9 px-4 rounded-xl border text-[11.5px] font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                      showFilters
                        ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-none'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-655'
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
                  </button>

                  <FilterDropdown
                    label="Sort"
                    selected={sortBy}
                    options={sortOptions}
                    isOpen={isSortOpen}
                    setIsOpen={setIsSortOpen}
                    onSelect={setSortBy}
                  />
                </div>
              </div>

              {/* Advanced Collapsible Filters Panel */}
              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 pt-4 border-t border-slate-100 animate-fadeIn">
                  {/* Category Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Category</label>
                    <FilterDropdown
                      label="Category"
                      selected={selectedCategory}
                      options={[{ value: 'ALL', label: 'All Categories' }, ...categoriesOptions]}
                      isOpen={isCategoryFilterOpen}
                      setIsOpen={setIsCategoryFilterOpen}
                      onSelect={setSelectedCategory}
                    />
                  </div>

                  {/* Brand Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Brand</label>
                    <FilterDropdown
                      label="Brand"
                      selected={selectedBrand}
                      options={[{ value: 'ALL', label: 'All Brands' }, ...brandsOptions]}
                      isOpen={isBrandFilterOpen}
                      setIsOpen={setIsBrandFilterOpen}
                      onSelect={setSelectedBrand}
                    />
                  </div>

                  {/* Status Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Status</label>
                    <FilterDropdown
                      label="Status"
                      selected={statusFilter}
                      options={[
                        { value: 'ALL', label: 'All Statuses' },
                        { value: 'ACTIVE', label: 'Active Only' },
                        { value: 'INACTIVE', label: 'Inactive Only' },
                        { value: 'ARCHIVED', label: 'Archived Only' }
                      ]}
                      isOpen={isStatusFilterOpen}
                      setIsOpen={setIsStatusFilterOpen}
                      onSelect={setStatusFilter}
                    />
                  </div>

                  {/* Featured Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Featured</label>
                    <FilterDropdown
                      label="Featured"
                      selected={featuredFilter}
                      options={[
                        { value: 'ALL', label: 'All' },
                        { value: 'true', label: 'Featured Only' },
                        { value: 'false', label: 'Non-Featured' }
                      ]}
                      isOpen={isFeaturedFilterOpen}
                      setIsOpen={setIsFeaturedFilterOpen}
                      onSelect={setFeaturedFilter}
                    />
                  </div>

                  {/* Price Range */}
                  <div className="space-y-1 sm:col-span-2 md:col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Price Range (INR)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={minPrice || ''}
                        onChange={e => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-xl text-[11.5px] font-bold text-slate-700 focus:outline-none focus:border-blue-400"
                      />
                      <span className="text-slate-350 text-xs">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice || ''}
                        onChange={e => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-xl text-[11.5px] font-bold text-slate-700 focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {loading ? (
              <ProductsTableSkeleton />
            ) : (
              /* Structured Table catalog list */
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col pt-1 relative">
                <style>{`
                  @keyframes loadingBar {
                    0% { left: -35%; }
                    100% { left: 100%; }
                  }
                  .animate-loadingBar {
                    animation: loadingBar 1s linear infinite;
                  }
                `}</style>
                
                {isRefreshing && (
                  <div className="w-full h-0.5 bg-blue-100 relative overflow-hidden z-10">
                    <div className="absolute top-0 left-0 h-full bg-blue-600 animate-loadingBar w-1/3 rounded-full" />
                  </div>
                )}

                <div className="hidden sm:grid sm:grid-cols-12 items-center border-b border-slate-100 px-5 py-3 bg-slate-50/20 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <div className="col-span-3">Product</div>
                  <div className="col-span-1 pl-2">Brand</div>
                  <div className="col-span-2 pl-2">Category</div>
                  <div className="col-span-2 pl-2">Price</div>
                  <div className="col-span-1 pl-2">Status</div>
                  <div className="col-span-1 pl-2">Featured</div>
                  <div className="col-span-2 text-right pr-2">Created Date</div>
                </div>

                <div className="relative p-3 sm:p-4 bg-white min-h-[250px]">
                  {isRefreshing && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] z-10 p-3 sm:p-4 space-y-2 pointer-events-none">
                      {[1, 2, 3, 4, 5, 6].map((idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center p-3 rounded-xl border border-slate-50 gap-2.5 sm:gap-0 bg-white"
                        >
                          {/* Col 1: Product (Name only) */}
                          <div className="col-span-3 flex items-center min-w-0 w-full">
                            <div className="flex-grow space-y-1.5 min-w-0">
                              <div className="h-3.5 bg-slate-200 animate-pulse rounded w-3/4" />
                              <div className="h-2.5 bg-slate-200 animate-pulse rounded w-1/4" />
                            </div>
                          </div>
                          {/* Col 2: Brand */}
                          <div className="col-span-1 sm:pl-2">
                            <div className="h-3.5 bg-slate-200 animate-pulse rounded w-12" />
                          </div>
                          {/* Col 3: Category */}
                          <div className="col-span-2 sm:pl-2">
                            <div className="h-3.5 bg-slate-200 animate-pulse rounded w-20" />
                          </div>
                          {/* Col 4: Price */}
                          <div className="col-span-2 sm:pl-2">
                            <div className="h-3.5 bg-slate-200 animate-pulse rounded w-16" />
                          </div>
                          {/* Col 5: Status */}
                          <div className="col-span-1 sm:pl-2">
                            <div className="h-6 bg-slate-200 animate-pulse rounded-full w-16" />
                          </div>
                          {/* Col 6: Featured */}
                          <div className="col-span-1 sm:pl-2">
                            <div className="h-4 bg-slate-200 animate-pulse rounded w-8" />
                          </div>
                          {/* Col 7: Created Date */}
                          <div className="col-span-2 text-right pr-2">
                            <div className="h-3.5 bg-slate-200 animate-pulse rounded w-20" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={`space-y-2 transition-opacity duration-205 ${isRefreshing ? 'opacity-30 pointer-events-none' : ''}`}>
                    {filtered.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => navigate(`/admin/products/${p.id}`)}
                        className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center p-3 rounded-xl border border-slate-100 hover:border-blue-150 hover:bg-blue-50/40 transition-all duration-200 cursor-pointer gap-2.5 sm:gap-0 bg-white"
                      >
                        {/* Col 1: Product (Name & ID only) */}
                        <div className="col-span-3 flex items-center min-w-0 w-full">
                          <div className="min-w-0">
                            <div className="text-[12.5px] font-bold text-slate-800 leading-tight truncate">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-none">
                              {p.displayId || p.id}
                            </div>
                          </div>
                        </div>

                        {/* Col 2: Brand */}
                        <div className="col-span-1 flex items-center text-[11px] text-slate-655 font-bold sm:pl-2">
                          {p.brand}
                        </div>

                        {/* Col 3: Category */}
                        <div className="col-span-2 flex items-center space-x-1.5 text-[11px] text-slate-455 font-bold sm:pl-2">
                          <Tag className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.category}</span>
                        </div>

                        {/* Col 4: Price */}
                        <div className="col-span-2 flex items-center space-x-1.5 text-[12.5px] font-extrabold text-slate-855 sm:pl-2">
                          <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                          <span>₹{p.price.toLocaleString('en-IN')}</span>
                        </div>

                        {/* Col 5: Status */}
                        <div className="col-span-1 flex items-center sm:pl-2">
                          <ProductStatusBadge status={p.status} />
                        </div>

                        {/* Col 6: Featured */}
                        <div className="col-span-1 flex items-center sm:pl-2">
                          {p.featured ? (
                            <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded bg-blue-50 text-blue-650 border border-blue-100 text-[8.5px] font-black uppercase tracking-wider">
                              Yes
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-350 font-bold">No</span>
                          )}
                        </div>

                        {/* Col 7: Created Date */}
                        <div className="col-span-2 text-right pr-2 text-[11px] text-slate-455 font-semibold">
                          {p.createdAt || p.updatedAt || '16-Jul-2026'}
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

                {/* Pagination Controls */}
                <div className="border-t border-slate-100 px-5 py-4 flex items-center justify-between bg-slate-50/10">
                  <div className="text-[11px] font-bold text-slate-455">
                    Showing <span className="text-slate-800">{totalProducts === 0 ? 0 : ((page - 1) * limit) + 1}</span> to{' '}
                    <span className="text-slate-800">
                      {Math.min(page * limit, totalProducts)}
                    </span>{' '}
                    of <span className="text-slate-800">{totalProducts}</span> products
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-[11px] font-black text-slate-655 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer animate-all duration-150"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-7.5 h-7.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                            page === pageNum
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'border border-slate-200 hover:bg-slate-50 text-slate-655'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-[11px] font-black text-slate-655 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer animate-all duration-150"
                    >
                      Next
                    </button>
                  </div>
                </div>
            </div>
          )}
        </div>
      ) : (
          /* ================= PREMIUM PRODUCT BUILDER WORKSPACE ================= */
          <div className="space-y-6 animate-fadeIn pb-12">
            
            {/* Header controls (Matching exact buttons checklist: Preview, Publish Product only) */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-5 border-b border-slate-200 gap-4">
              <div className="space-y-1 text-left">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      navigate('/admin/products');
                    }}
                    className="text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {editingProductId 
                      ? (isPreviewMode ? "Product Details" : "Edit Product") 
                      : "Create Product"}
                  </h1>
                  {editingProductId && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black bg-blue-50 text-blue-650 border border-blue-100 uppercase tracking-wider ml-2">
                      {isPreviewMode ? "View Mode" : "Editing Product"}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-slate-555 font-semibold pl-7">
                  {editingProductId 
                    ? (isPreviewMode ? "View product specifications and metrics." : "Update your product information.") 
                    : "Create and publish premium technology products."}
                </p>
              </div>

              {/* Action Control Buttons */}
              <div className="flex items-center space-x-3 self-end md:self-auto">
                {isPreviewMode ? (
                  /* View Mode */
                  <>
                    <button
                      onClick={() => navigate('/admin/products')}
                      className="h-9 px-4.5 rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-[11.5px] font-bold text-slate-655 flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    {editingProductId && (
                      <button
                        onClick={() => setIsPreviewMode(false)}
                        className="h-9 px-5.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11.5px] font-black transition-all shadow-sm active:scale-95 flex items-center space-x-1.5 cursor-pointer shadow-blue-600/20"
                      >
                        <span>Edit</span>
                      </button>
                    )}
                  </>
                ) : (
                  /* Edit Mode */
                  <>
                    {editingProductId && (
                      <button
                        onClick={() => {
                          const p = productsList.find(item => item.id === editingProductId);
                          if (p) setProductToDelete(p);
                        }}
                        disabled={isSaving || isDeleting}
                        className="h-9 px-4 rounded-xl border border-red-200 bg-red-50 text-red-655 hover:bg-red-100/50 text-[11.5px] font-bold flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Product</span>
                      </button>
                    )}

                    <button
                      onClick={async () => {
                        // Cancel button: discard unsaved changes, reload latest data, return to View Mode
                        if (editingProductId) {
                          setDetailsLoading(true);
                          try {
                            const res = await productService.getProductById(editingProductId);
                            if (res) {
                              const item = res.data || res.product || res;
                              const mapped = mapProductToItem(item);
                              setName(mapped.name);
                              setDescription(mapped.description);
                              setBrand(mapped.brand);
                              setCategoryId(mapped.categoryId);
                              setPrice(mapped.price);
                              setDiscount(mapped.discount);
                              setFeatured(mapped.featured);
                              setStatus(mapped.status);
                              setUploadedImages(mapped.images || []);
                              const specsArray = Object.entries(mapped.specifications || {}).map(([key, value]) => ({
                                key,
                                value,
                              }));
                              setSpecsList(specsArray);
                              setProductDetails(mapped);
                            }
                          } catch (err) {
                            console.error('Error reloading product details:', err);
                          } finally {
                            setDetailsLoading(false);
                          }
                          setIsPreviewMode(true);
                        } else {
                          // If creating, cancel goes back to products list
                          navigate('/admin/products');
                        }
                      }}
                      disabled={isSaving}
                      className="h-9 px-4.5 rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-[11.5px] font-bold text-slate-655 flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <span>Cancel</span>
                    </button>

                    <button
                      onClick={handlePublishProduct}
                      disabled={!isSaveEnabled || isSaving || isUploading}
                      className={`h-9 px-5.5 rounded-xl text-[11.5px] font-black transition-all shadow-sm active:scale-95 flex items-center space-x-1.5 cursor-pointer ${
                        isSaveEnabled && !isSaving && !isUploading
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none cursor-not-allowed'
                      }`}
                    >
                      {(isSaving || isUploading) ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>
                            {isUploading 
                              ? "Uploading Images..." 
                              : (editingProductId ? "Saving..." : "Creating...")}
                          </span>
                        </>
                      ) : (
                        <span>{editingProductId ? "Save Changes" : "Publish Product"}</span>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {loading || detailsLoading ? (
              <DetailPageSkeleton columns={3} />
            ) : productNotFound ? (
              <div className="max-w-md mx-auto py-16 text-center space-y-5 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-black text-slate-800">Product Not Found</h2>
                  <p className="text-[11.5px] text-slate-455 font-semibold">The product you are trying to view does not exist or has been deleted from the catalog.</p>
                </div>
                <button
                  onClick={() => navigate('/admin/products')}
                  className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Back to Products
                </button>
              </div>
            ) : isPreviewMode ? (
              <div className="max-w-5xl mx-auto animate-fadeIn">
                <CustomerProductDetailsPreview />
              </div>
            ) : (
              /* Two-column builder view: Left 65% Workspace, Right 35% Live Preview Panel */
              <div className="grid grid-cols-1 lg:grid-cols-10 gap-7 items-start">
                
                {/* LEFT COLUMN: Workspace forms (65%) */}
                <div className="lg:col-span-6 space-y-12 bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 text-left shadow-sm">
                  
                  {/* Basic Information section */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2 text-blue-600">
                      <Grid className="w-5 h-5" />
                      <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">Basic Information</h2>
                    </div>
                    <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                      Configure main product details, brand mappings, active catalogue classification category, and status.
                    </p>
                    <hr className="border-slate-100" />

                    <div className="space-y-5 pt-2">
                      {/* Product Name */}
                      <FloatingInput
                        label="Product Name *"
                        value={name}
                        onChange={setName}
                        placeholder="e.g. MacBook Pro M3 Max"
                      />

                      {/* Description */}
                      <FloatingTextarea
                        label="Description *"
                        value={description}
                        onChange={setDescription}
                        placeholder="Provide details about specs, product performance, layout design, etc."
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Searchable Brand Dropdown */}
                        <BrandDropdown selected={brand} brands={dbBrands.length > 0 ? dbBrands : brandOptions} onSelect={setBrand} />

                        {/* Searchable Category Dropdown */}
                        <CategoryDropdown selectedId={categoryId} categories={categoriesList.map(c => ({ id: c.categoryId, label: c.name }))} onSelect={setCategoryId} />
                      </div>

                      {/* Pricing block with 2x2 Grid Layout */}
                      <div className="border-t border-slate-100 pt-6 text-left">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-5">
                          
                          {/* Row 1, Col 1: Price Input */}
                          <div className="w-full flex flex-col space-y-1.5">
                            <label className="text-[10px] font-black text-slate-455 uppercase tracking-wider pl-1.5">Price (INR) *</label>
                            <div className="relative flex items-center border border-slate-200 hover:border-slate-355 rounded-2xl bg-white h-14 px-4 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10 transition-all duration-200 shadow-sm shadow-slate-100/50">
                              <IndianRupee className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                              <input
                                type="number"
                                placeholder="0.00"
                                value={price || ''}
                                onChange={e => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setPrice(val);
                                }}
                                className="w-full bg-transparent text-[12.5px] font-extrabold text-slate-800 text-right focus:outline-none placeholder-slate-300"
                              />
                            </div>
                          </div>

                          {/* Row 1, Col 2: Discount Input */}
                          <div className="w-full flex flex-col space-y-1.5">
                            <label className="text-[10px] font-black text-slate-455 uppercase tracking-wider pl-1.5">Discount (%)</label>
                            <div className="relative flex items-center border border-slate-200 hover:border-slate-355 rounded-2xl bg-white h-14 px-4 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10 transition-all duration-200 shadow-sm shadow-slate-100/50">
                              <input
                                type="number"
                                placeholder="0"
                                min="0"
                                max="100"
                                value={discount || ''}
                                onChange={e => {
                                  let val = parseFloat(e.target.value) || 0;
                                  if (val > 100) val = 100;
                                  if (val < 0) val = 0;
                                  setDiscount(val);
                                }}
                                className="w-full bg-transparent text-[12.5px] font-extrabold text-slate-800 text-right focus:outline-none placeholder-slate-300 pr-1"
                              />
                              <Percent className="w-3.5 h-3.5 text-slate-400 ml-1.5 flex-shrink-0" />
                            </div>
                          </div>

                          {/* Row 2, Col 1: Featured Toggle Card */}
                          <div className="w-full flex flex-col space-y-1.5">
                            <label className="text-[10px] font-black text-slate-455 uppercase tracking-wider pl-1.5">Featured Product</label>
                            <div className="flex items-center justify-between border border-slate-200 hover:border-slate-350 rounded-2xl bg-white hover:bg-slate-50/60 h-14 px-4 shadow-sm shadow-slate-100/40 transition-all duration-200">
                              <div className="flex items-center space-x-2">
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                                <span className="text-[12.5px] font-bold text-slate-800 whitespace-nowrap">Featured Product</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFeatured(!featured)}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                                  featured ? 'bg-blue-600' : 'bg-slate-200'
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    featured ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Row 2, Col 2: Custom Status Dropdown */}
                          <div className="w-full flex flex-col space-y-1.5">
                            <label className="text-[10px] font-black text-slate-455 uppercase tracking-wider pl-1.5">Status *</label>
                            <StatusDropdown selected={status} onSelect={setStatus} />
                          </div>

                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Images Section */}
                  <div className="space-y-6 pt-6">
                    <div className="flex items-center space-x-2 text-blue-600">
                      <Camera className="w-5 h-5" />
                      <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">Media Gallery</h2>
                    </div>
                    <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                      Upload high fidelity product gallery images. Supported formats are PNG, JPG, and WEBP.
                    </p>
                    <hr className="border-slate-100" />

                    <div className="space-y-5 pt-2">
                      {/* Premium drag & drop uploader card (No dotted rectangles or emoji labels) */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-6.5 text-center transition-all duration-200 flex flex-col items-center justify-center space-y-2.5 cursor-pointer bg-white hover:bg-slate-50/60 ${
                          isDragging ? 'border-blue-500 bg-blue-50/10' : 'border-slate-200 hover:border-slate-350'
                        }`}
                        onClick={() => document.getElementById('image-uploader-input')?.click()}
                      >
                        <input
                          id="image-uploader-input"
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-[12.5px] font-black text-slate-800">Upload Product Images</h4>
                          <p className="text-[9.5px] text-slate-400 font-semibold mt-1">
                            Drag & Drop files here, or <span className="text-blue-600 hover:underline">Click to Browse</span>
                          </p>
                        </div>
                      </div>

                      {/* Progress progress indicator */}
                      {uploadProgress !== null && (
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 animate-pulse text-left">
                          <div className="flex justify-between text-[8.5px] font-black text-slate-400 uppercase tracking-wider">
                            <span>Compressing & Formatting Assets...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full transition-all duration-250" style={{ width: `${uploadProgress}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Dynamic Photo Library Cards */}
                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                          {uploadedImages.map((img, idx) => (
                            <div
                              key={img.key}
                              className="group relative aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-150 flex items-center justify-center p-2.5 shadow-sm hover:shadow transition-shadow"
                            >
                              <img src={getImageUrl(img.imageUrl)} alt={`asset-${idx}`} className="w-full h-full object-contain rounded-lg" />
                              
                              {/* Primary image badge */}
                              {idx === 0 && (
                                <span className="absolute top-2 left-2 z-10 bg-slate-900/90 text-white text-[7.5px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider">
                                  Cover
                                </span>
                              )}

                              {/* Hover actions */}
                              <div className="absolute inset-0 bg-slate-900/35 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                <div className="flex items-center justify-between">
                                  <span className="w-6 h-6 rounded-lg bg-white/95 backdrop-blur-sm text-slate-700 flex items-center justify-center cursor-grab shadow">
                                    <Move className="w-3 h-3" />
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteImage(idx);
                                    }}
                                    className="w-6 h-6 rounded-full bg-white text-red-500 hover:bg-red-50 flex items-center justify-center shadow cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="flex justify-between items-center bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg text-[9px] font-bold text-slate-700 shadow-sm">
                                  <span>{idx + 1}/{uploadedImages.length}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReplaceImage(idx);
                                    }}
                                    className="text-blue-600 hover:underline flex items-center space-x-0.5 cursor-pointer ml-1.5"
                                  >
                                    <RefreshCw className="w-2.5 h-2.5" />
                                    <span>Replace</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Specifications Section */}
                  <div className="space-y-6 pt-6">
                    <div className="flex items-center space-x-2 text-blue-600">
                      <Sliders className="w-5 h-5" />
                      <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">Specifications</h2>
                    </div>
                    <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                      Define tech specs parameters rows dynamically with infinite listings.
                    </p>
                    <hr className="border-slate-100" />

                    <div className="space-y-3 pt-2">
                      {specsList.map((spec, idx) => (
                        <div key={idx} className="flex items-center space-x-3.5 animate-fadeIn">
                          <input
                            type="text"
                            value={spec.key}
                            placeholder="Specification (e.g. Processor)"
                            onChange={e => handleSpecChange(idx, 'key', e.target.value)}
                            className="w-1/3 h-10 px-3 bg-white hover:bg-slate-50/60 border border-slate-200 hover:border-slate-350 focus:bg-slate-50/80 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:outline-none rounded-xl text-[12px] font-extrabold text-slate-850 placeholder-slate-350 transition-all duration-200"
                          />
                          <input
                            type="text"
                            value={spec.value}
                            placeholder="Value (e.g. Intel i9)"
                            onChange={e => handleSpecChange(idx, 'value', e.target.value)}
                            className="flex-1 h-10 px-3 bg-white hover:bg-slate-50/60 border border-slate-200 hover:border-slate-350 focus:bg-slate-50/80 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:outline-none rounded-xl text-[12px] font-semibold text-slate-655 placeholder-slate-350 transition-all duration-200"
                          />
                          <button
                            onClick={() => handleRemoveSpecRow(idx)}
                            className="w-8 h-8 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center transition-colors cursor-pointer border border-slate-100 hover:border-red-100"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {specsList.length === 0 && (
                        <div className="p-6 text-center text-slate-400 text-[11.5px] font-semibold">
                          No specifications configured. Click "Add Specification" to begin.
                        </div>
                      )}

                      <div className="pt-1.5 text-left">
                        <button
                          onClick={handleAddSpecRow}
                          className="h-8.5 px-4 rounded-xl border border-blue-100 bg-blue-50/40 text-blue-650 hover:bg-blue-50 text-[11px] font-black flex items-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Specification</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: Live Preview (35%) */}
                <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-5 max-h-[calc(100vh-100px)] overflow-y-auto pr-1 scrollbar-thin">
                  
                  {/* Sticky Preview Showcase */}
                  <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm p-5 space-y-4.5 relative overflow-hidden text-left hover:shadow-md transition-shadow duration-300">
                    <div className="absolute top-2.5 right-2.5 z-20 flex items-center space-x-1 px-2.5 py-0.5 bg-blue-50 text-blue-650 border border-blue-100 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                      <Info className="w-2.5 h-2.5" />
                      <span>Live Preview</span>
                    </div>

                    {/* Image stage */}
                    <div className="relative aspect-square w-full rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-4">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-gradient-to-tr from-blue-500/10 to-indigo-500/5 blur-2xl" />
                      {uploadedImages.length > 0 ? (
                        <SafeImage
                          src={getImageUrl(uploadedImages[0]?.imageUrl)}
                          alt="Preview"
                          className="w-full h-full relative z-10"
                          imgClassName="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-1.5 text-slate-300">
                          <Boxes className="w-8 h-8" />
                          <span className="text-[10px] font-bold uppercase">No Images</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata details */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-blue-650 tracking-wider uppercase">
                          {brand || 'Brand'}
                        </span>

                        <div className="flex items-center space-x-1.5">
                          {featured && (
                            <span className="bg-blue-50 text-blue-655 border border-blue-100 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                              Featured
                            </span>
                          )}
                          <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase border ${
                            status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-650 border-emerald-100' : status === 'INACTIVE' ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {status}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-[13.5px] font-extrabold text-slate-900 tracking-tight leading-tight line-clamp-1">
                        {name || 'Product Title'}
                      </h4>

                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-[15px] font-black text-slate-900">
                          ₹{finalPrice.toLocaleString('en-IN')}
                        </span>
                        {discount > 0 && (
                          <span className="text-[10px] text-slate-400 font-semibold line-through">
                            ₹{price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-455 font-semibold leading-relaxed line-clamp-2">
                        {description || 'Provide product description in form editor to update live preview details...'}
                      </p>
                    </div>

                    {/* Specs Table */}
                    {specsList.some(s => s.key && s.value) && (
                      <div className="border-t border-slate-50 pt-3 space-y-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Technical specifications</span>
                        <div className="grid grid-cols-2 gap-2 text-[10.5px] font-semibold text-slate-655">
                          {specsList.filter(s => s.key && s.value).slice(0, 3).map((spec, idx) => (
                            <div key={idx} className="bg-slate-50/40 p-1.5 rounded-lg border border-slate-100/50">
                              <span className="text-slate-400 block text-[8px] font-black uppercase truncate">{spec.key}</span>
                              <span className="text-slate-850 block truncate">{spec.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {uploadedImages.length > 1 && (
                      <div className="text-[9px] font-black text-slate-400 tracking-wide bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block">
                        {uploadedImages.length} images in gallery
                      </div>
                    )}

                    {/* Simple completion stats */}
                    <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                        <span className="text-[11px] font-black text-slate-800">Workspace Complete</span>
                      </div>
                      <span className="text-[12.5px] font-black text-blue-650">{tracker.percentage}%</span>
                    </div>

                    {/* Mock customer buy actions */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <button className="h-8.5 rounded-lg bg-slate-900 text-white text-[9.5px] font-black uppercase tracking-wider cursor-not-allowed" disabled>
                        Add to Cart
                      </button>
                      <button className="h-8.5 rounded-lg border border-slate-900 bg-white text-slate-900 text-[9.5px] font-black uppercase tracking-wider cursor-not-allowed" disabled>
                        Buy Now
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
