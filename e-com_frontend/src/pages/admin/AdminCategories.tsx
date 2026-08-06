import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../layouts/AdminLayout';
import {
  Search,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  Upload,
  RefreshCw,
  Trash2,
  Star,
  Check,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';
import { categoryService } from '../../services/category.service';
import type { CategoryImagePayload } from '../../services/category.service';
import { productService } from '../../services/product.service';
import { getImageUrl } from '../../utils/imageHelper';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  featured: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  image: string;
  productsCount: number;
  createdOn: string;
  updatedAt?: string;
  imageObj?: CategoryImagePayload | null;
}

// --- Custom Category Status Badge matching Order Status Badges exactly ---
const CategoryStatusBadge: React.FC<{ status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' }> = ({ status }) => {
  const baseClass = "inline-flex items-center justify-center space-x-1 px-3 py-1 rounded-full text-[10px] font-bold border flex-shrink-0 text-center";

  if (status === 'ACTIVE') {
    return (
      <span className={`${baseClass} bg-emerald-50 text-emerald-650 border-emerald-100`}>
        <CheckCircle className="w-3 h-3 flex-shrink-0" />
        <span>Active</span>
      </span>
    );
  }
  if (status === 'INACTIVE') {
    return (
      <span className={`${baseClass} bg-slate-50 text-slate-500 border-slate-200`}>
        <Clock className="w-3 h-3 flex-shrink-0" />
        <span>Inactive</span>
      </span>
    );
  }
  return (
    <span className={`${baseClass} bg-red-50 text-red-500 border-red-100`}>
      <XCircle className="w-3 h-3 flex-shrink-0" />
      <span>Archived</span>
    </span>
  );
};

// --- Custom Reusable Filter/Sort Dropdown Component ---
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
        className={`h-10.5 w-full px-4 rounded-xl border text-slate-700 text-[11.5px] font-bold transition-all flex items-center justify-between space-x-2.5 shadow-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none cursor-pointer ${
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

// --- Custom Status Dropdown inside form fields ---
const FormStatusDropdown: React.FC<{
  selected: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  disabled?: boolean;
  onSelect: (status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') => void;
}> = ({ selected, disabled, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { value: 'ACTIVE', label: 'Active', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle },
    { value: 'INACTIVE', label: 'Inactive', color: 'text-slate-500 bg-slate-50 border-slate-100', icon: Clock },
    { value: 'ARCHIVED', label: 'Archived', color: 'text-red-500 bg-red-50 border-red-100', icon: XCircle },
  ];

  const selectedOpt = options.find(o => o.value === selected) || options[0];

  return (
    <div className="relative w-full text-left">
      <label className="absolute left-4.5 -top-2 z-10 text-[9.5px] bg-white px-1.5 text-blue-655 font-bold">
        Status *
      </label>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between border rounded-2xl h-14 px-4 transition-all duration-200 ${
          disabled
            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-75'
            : isOpen
              ? 'bg-slate-50/80 border-blue-600 ring-4 ring-blue-600/10 shadow-sm shadow-blue-600/5 cursor-pointer'
              : 'bg-white hover:bg-slate-50/60 border-slate-200 hover:border-slate-350 shadow-sm shadow-slate-100/40 cursor-pointer'
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

interface AdminCategoriesProps {
  mode?: 'list' | 'create' | 'edit';
}
const SafeImage: React.FC<{ src: string; alt: string; className?: string; imgClassName?: string }> = ({
  src,
  alt,
  className = '',
  imgClassName = 'w-full h-full object-cover',
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  const resolvedSrc = getImageUrl({ image: src, name: alt });

  return (
    <div className={`relative ${className} bg-slate-50 flex-shrink-0 overflow-hidden`}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
          <div className="w-full h-full bg-slate-100 animate-pulse" />
        </div>
      )}
      <img
        src={error ? getImageUrl({ name: alt }) : resolvedSrc}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`${imgClassName} transition-opacity duration-300 ease-in-out ${loaded || error ? 'opacity-100' : 'opacity-0 absolute'}`}
      />
    </div>
  );
};

const AdminCategories: React.FC<AdminCategoriesProps> = ({ mode = 'list' }) => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(mode === 'list');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorState, setErrorState] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(mode === 'edit');
  const [isSaving, setIsSaving] = useState(false);
  const [categoryDetails, setCategoryDetails] = useState<CategoryItem | null>(null);
  const [isEditingCategory, setIsEditingCategory] = useState(mode !== 'edit');

  // Synchronously update loading states when mode/categoryId changes to prevent visual flashes
  const [prevMode, setPrevMode] = useState(mode);
  const [prevCategoryId, setPrevCategoryId] = useState(categoryId);

  if (mode !== prevMode || categoryId !== prevCategoryId) {
    setPrevMode(mode);
    setPrevCategoryId(categoryId);
    setIsEditingCategory(mode !== 'edit');
    if (mode === 'list') {
      setLoading(true);
      setErrorState(false);
    } else if (mode === 'edit') {
      setDetailsLoading(true);
    } else {
      setLoading(false);
      setDetailsLoading(false);
    }
  }

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [featuredFilter, setFeaturedFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name');
  
  // Pagination States
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);

  // Filter Dropdown Open States
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFeaturedOpen, setIsFeaturedOpen] = useState(false);

  // Form Field States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [imageObj, setImageObj] = useState<CategoryImagePayload | null>(null);
  
  // Upload and Dragging simulation
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // Validation Inline Errors
  const [validationError, setValidationError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);

  // Toast System
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Map backend object to CategoryItem
  const mapCategoryToItem = (item: any): CategoryItem => {
    let imageUrl = getImageUrl(item);
    
    return {
      id: item.id || item.categoryId || '',
      name: item.name || '',
      slug: item.slug || item.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '',
      description: item.description || '',
      featured: !!item.featured,
      status: item.status || 'ACTIVE',
      image: imageUrl,
      productsCount: item.productsCount || 0,
      createdOn: item.createdAt 
        ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
        : (item.createdOn || ''),
      updatedAt: item.updatedAt 
        ? new Date(item.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
        : (item.updatedAt || ''),
      imageObj: (typeof item.image === 'object' && item.image !== null) ? item.image : null,
    };
  };

  // Load Categories list from Backend API
  const loadCategories = async () => {
    setLoading(true);
    setErrorState(false);
    try {
      const order = sortBy === 'name' ? 'asc' : 'desc';
      const apiSortBy = sortBy === 'createdOn' ? 'createdAt' : sortBy;
      
      const response = await categoryService.getCategories({
        page,
        limit,
        search,
        status: statusFilter,
        featured: featuredFilter,
        sortBy: apiSortBy,
        order,
      });

      let fetchedList: any[] = [];
      let totalCount = 0;
      
      if (response) {
        if (Array.isArray(response)) {
          fetchedList = response;
          totalCount = response.length;
        } else if (response.categories && Array.isArray(response.categories)) {
          fetchedList = response.categories;
          totalCount = response.total !== undefined ? response.total : fetchedList.length;
        } else if (response.data && Array.isArray(response.data)) {
          fetchedList = response.data;
          totalCount = response.total !== undefined ? response.total : (response.pagination?.total !== undefined ? response.pagination.total : fetchedList.length);
        }
      }

      // Fetch products to count how many belong to each category
      let productsList: any[] = [];
      try {
        const prodResponse = await productService.getProducts({ limit: 1000 });
        if (prodResponse) {
          if (Array.isArray(prodResponse)) {
            productsList = prodResponse;
          } else if (prodResponse.products && Array.isArray(prodResponse.products)) {
            productsList = prodResponse.products;
          } else if (prodResponse.data && Array.isArray(prodResponse.data)) {
            productsList = prodResponse.data;
          }
        }
      } catch (prodErr) {
        console.error('Error fetching products for category counts:', prodErr);
      }

      const productsCountMap: Record<string, number> = {};
      productsList.forEach((p: any) => {
        if (p.categoryId) {
          productsCountMap[p.categoryId] = (productsCountMap[p.categoryId] || 0) + 1;
        }
        if (p.category) {
          const catNameLower = String(p.category).toLowerCase().trim();
          productsCountMap[catNameLower] = (productsCountMap[catNameLower] || 0) + 1;
        }
      });

      const mappedCategories = fetchedList.map((item) => {
        const mapped = mapCategoryToItem(item);
        const countFromId = productsCountMap[mapped.id] || 0;
        const countFromName = productsCountMap[mapped.name.toLowerCase().trim()] || 0;
        mapped.productsCount = countFromId || countFromName || 0;
        return mapped;
      });

      setCategories(mappedCategories);
      setTotalCategories(totalCount);
      setTotalPages(Math.max(1, Math.ceil(totalCount / limit)));
      setErrorState(false);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      triggerToast(err.response?.data?.message || err.message || 'Network error fetching categories.');
      if (categories.length === 0) {
        setErrorState(true);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Reset page when sorting/search/filters change
  useEffect(() => {
    if (mode === 'list') {
      setPage(1);
    }
  }, [search, statusFilter, featuredFilter, sortBy]);

  // Load Categories list effect
  useEffect(() => {
    if (mode === 'list') {
      loadCategories();
    }
  }, [mode, page, limit, search, statusFilter, featuredFilter, sortBy]);

  // Fetch Category Details if in Edit Mode
  useEffect(() => {
    const fetchDetails = async () => {
      if (mode === 'edit' && categoryId) {
        setDetailsLoading(true);
        setValidationError(null);
        setNameError(null);
        setDescError(null);
        try {
          const res = await categoryService.getCategoryById(categoryId);
          if (res) {
            const item = res.data || res.category || res;
            const mapped = mapCategoryToItem(item);

            // Fetch products count for this category
            try {
              const prodResponse = await productService.getProducts({ limit: 1000 });
              let productsList: any[] = [];
              if (prodResponse) {
                if (Array.isArray(prodResponse)) {
                  productsList = prodResponse;
                } else if (prodResponse.products && Array.isArray(prodResponse.products)) {
                  productsList = prodResponse.products;
                } else if (prodResponse.data && Array.isArray(prodResponse.data)) {
                  productsList = prodResponse.data;
                }
              }
              const countFromId = productsList.filter((p: any) => p.categoryId === mapped.id).length;
              const countFromName = productsList.filter((p: any) => String(p.category).toLowerCase().trim() === mapped.name.toLowerCase().trim()).length;
              mapped.productsCount = countFromId || countFromName || 0;
            } catch (prodErr) {
              console.error('Error fetching count for detail view:', prodErr);
            }

            setName(mapped.name);
            setDescription(mapped.description);
            setFeatured(mapped.featured);
            setStatus(mapped.status);
            setUploadedImage(mapped.image);
            setImageObj(mapped.imageObj || null);
            setCategoryDetails(mapped);
          }
        } catch (err: any) {
          console.error('Error fetching category details:', err);
          triggerToast(err.response?.data?.message || err.message || 'Error loading category details.');
          navigate('/admin/categories');
        } finally {
          setDetailsLoading(false);
        }
      } else if (mode === 'create') {
        setName('');
        setDescription('');
        setFeatured(false);
        setStatus('ACTIVE');
        setUploadedImage('');
        setImageObj(null);
        setCategoryDetails(null);
        setValidationError(null);
        setNameError(null);
        setDescError(null);
      }
    };
    fetchDetails();
  }, [mode, categoryId, navigate]);

  // Drag and Drop simulation
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
      handleUploadImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadImage(e.target.files[0]);
    }
  };

  // Upload image to pre-signed S3 flow
  const handleUploadImage = async (file: File) => {
    setValidationError(null);
    
    // File format validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      const errorMsg = 'Invalid file type. Supported formats: JPG, PNG, WEBP.';
      console.error('Invalid file type:', file.type);
      setValidationError(errorMsg);
      triggerToast('Invalid file type');
      return;
    }

    // Size limit verification (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const errorMsg = 'File too large. Maximum allowed file size is 5 MB.';
      console.error('File too large:', file.size);
      setValidationError(errorMsg);
      triggerToast('File too large');
      return;
    }

    setIsUploadingImage(true);
    setUploadProgress(10);
    
    try {
      // Step 1: Generate pre-signed URL
      console.log('Generating pre-signed URL...');
      setUploadProgress(35);
      
      let urlRes: any;
      try {
        urlRes = await categoryService.generateUploadUrl(file);
      } catch (err: any) {
        console.error('Error generating pre-signed URL:', err);
        throw new Error('Failed to generate upload URL');
      }

      if (!urlRes || !urlRes.uploadUrl) {
        console.error('Invalid upload-url response structure:', urlRes);
        throw new Error('Failed to generate upload URL');
      }
      
      console.log('Pre-signed URL generated.');
      
      // Step 2: Upload directly to S3
      console.log('Uploading file to S3...');
      setUploadProgress(70);
      
      try {
        await categoryService.uploadImageToS3(urlRes.uploadUrl, file);
      } catch (err: any) {
        console.error('Error uploading file to S3:', err);
        if (err.message && err.message.toLowerCase().includes('network error')) {
          throw new Error('Network error');
        }
        throw new Error('S3 upload failed');
      }
      
      console.log('S3 upload successful.');
      
      // Step 3: Success! Store returned image info
      console.log('Saving image metadata...');
      setUploadProgress(100);
      
      const imageUrl = urlRes.imageUrl || urlRes.url;
      const key = urlRes.key;

      setUploadedImage(imageUrl);
      setImageObj({
        key: key,
        url: imageUrl,
      });
      
      console.log('Image upload completed.');
      triggerToast('Image Uploaded Successfully');
    } catch (err: any) {
      console.error('Error uploading image:', err);
      const errorMessage = err.message || 'Failed to upload image to S3';
      triggerToast(errorMessage);
      setValidationError(errorMessage + '. Please check connection and try again.');
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(null);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage('');
    setImageObj(null);
    triggerToast('Category image removed.');
  };

  // Form submission handler communicating with Backend REST endpoint
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    setNameError(null);
    setDescError(null);

    const nameVal = name.trim();
    const descVal = description.trim();

    // Validation
    if (!nameVal) {
      setNameError('Category name is required.');
      hasError = true;
    }

    if (!descVal) {
      setDescError('Category description is required.');
      hasError = true;
    } else if (descVal.length > 250) {
      setDescError('Description cannot exceed 250 characters.');
      hasError = true;
    }

    if (hasError) return;

    setIsSaving(true);
    
    try {
      const payload: any = {
        name: nameVal,
        description: descVal,
        featured,
        status,
      };
      if (imageObj && imageObj.key && imageObj.url) {
        payload.image = imageObj;
      } else if (uploadedImage) {
        payload.image = { url: uploadedImage, key: 'category-img' };
      }

      if (mode === 'edit' && categoryId) {
        await categoryService.updateCategory(categoryId, payload);
        triggerToast('Category Updated Successfully');
        // Refresh details representation
        const res = await categoryService.getCategoryById(categoryId);
        if (res) {
          const item = res.data || res.category || res;
          const mapped = mapCategoryToItem(item);
          setName(mapped.name);
          setDescription(mapped.description);
          setFeatured(mapped.featured);
          setStatus(mapped.status);
          setUploadedImage(mapped.image);
          setImageObj(mapped.imageObj || null);
          setCategoryDetails(mapped);
        }
        setIsEditingCategory(false);
      } else if (mode === 'create') {
        await categoryService.createCategory(payload);
        triggerToast('Category Created Successfully');
        setTimeout(() => {
          navigate('/admin/categories');
        }, 800);
      }
    } catch (err: any) {
      console.error('Error saving category:', err);
      triggerToast(err.response?.data?.message || err.message || 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'productsCount', label: 'Product Count' },
    { value: 'createdOn', label: 'Created Date' },
  ];

  const statusFilterOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active Only' },
    { value: 'INACTIVE', label: 'Inactive Only' },
    { value: 'ARCHIVED', label: 'Archived Only' },
  ];

  const featuredFilterOptions = [
    { value: 'ALL', label: 'All Featured' },
    { value: 'true', label: 'Featured Only' },
    { value: 'false', label: 'Non-Featured' },
  ];

  const selectedCategoryObj = mode === 'edit' ? categoryDetails : null;

  return (
    <AdminLayout>
      <div className="p-4.5 sm:p-7 space-y-6 relative bg-[#F8FAFC]">
        {/* Success Toast */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 flex items-center space-x-2 bg-slate-900 text-white text-[12px] font-bold px-4 py-3 rounded-xl shadow-lg border border-slate-800 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {mode === 'list' ? (
          /* ================= CATEGORY CATALOG LIST VIEW ================= */
          <div className="space-y-6 animate-fadeIn">
            {/* Page Header */}
            <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-left">
                <div className="text-[12px] font-bold text-blue-600 tracking-wider uppercase">Classifications catalog</div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Categories</h1>
                <p className="text-[12.5px] text-slate-555 font-medium mt-0.5">
                  Manage all product categories
                </p>
              </div>
              <button
                onClick={() => navigate('/admin/categories/create')}
                className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-all flex items-center space-x-1.5 shadow-md shadow-blue-600/25 active:scale-95 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>

            {/* Search, Sort, and Status Filter row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 flex-1">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full h-10.5 pl-9 pr-4 bg-white hover:bg-slate-50/60 border border-slate-200 hover:border-slate-350 focus:bg-slate-50/80 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:outline-none rounded-xl text-[12px] text-slate-700 placeholder-slate-400 font-medium transition-all duration-200"
                  />
                </div>
                
                {/* Status Filter */}
                <FilterDropdown
                  label="Status"
                  selected={statusFilter}
                  options={statusFilterOptions}
                  isOpen={isStatusOpen}
                  setIsOpen={setIsStatusOpen}
                  onSelect={setStatusFilter}
                />

                {/* Featured Filter */}
                <FilterDropdown
                  label="Featured"
                  selected={featuredFilter}
                  options={featuredFilterOptions}
                  isOpen={isFeaturedOpen}
                  setIsOpen={setIsFeaturedOpen}
                  onSelect={setFeaturedFilter}
                />
              </div>

              {/* Sort Selection */}
              <FilterDropdown
                label="Sort By"
                selected={sortBy}
                options={sortOptions}
                isOpen={isSortOpen}
                setIsOpen={setIsSortOpen}
                onSelect={setSortBy}
              />
            </div>

            {errorState ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-12 shadow-sm text-center flex flex-col items-center justify-center space-y-4">
                <XCircle className="w-12 h-12 text-red-500 stroke-[1.5]" />
                <div>
                  <h3 className="text-[14px] font-black text-slate-800">Unable to load categories</h3>
                  <p className="text-[11.5px] text-slate-400 mt-1 max-w-sm">
                    We encountered an error while fetching categories from the server. Please check your connection and try again.
                  </p>
                </div>
                <button
                  onClick={loadCategories}
                  className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-750 text-white text-[12px] font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Connection</span>
                </button>
              </div>
            ) : loading ? (
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col pt-1">
                <div className="hidden sm:grid sm:grid-cols-12 items-center border-b border-slate-100 px-5 py-3 bg-slate-50/20 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <div className="col-span-3 pl-2">Category</div>
                  <div className="col-span-3 pl-2">Description</div>
                  <div className="col-span-1.5 text-center">Featured</div>
                  <div className="col-span-1.5 text-center">Status</div>
                  <div className="col-span-1.5 text-center">Products</div>
                  <div className="col-span-1.5 text-right pr-2">Created On</div>
                </div>

                <div className="divide-y divide-slate-50 px-3 py-2 sm:p-4 space-y-2 bg-white">
                  {[1, 2, 3, 4, 5, 6].map((idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center p-3 rounded-xl border border-slate-50 gap-2.5 sm:gap-0 bg-white"
                    >
                      {/* Category Name & Slug */}
                      <div className="col-span-3 flex flex-col items-start min-w-0 sm:pl-2 text-left space-y-1.5">
                        <div className="h-4 bg-slate-100 rounded w-28 animate-pulse" />
                        <div className="h-3 bg-slate-100 rounded w-16 animate-pulse" />
                      </div>

                      {/* Description */}
                      <div className="col-span-3 pr-4 text-left space-y-1.5">
                        <div className="h-3.5 bg-slate-100 rounded w-4/5 animate-pulse" />
                        <div className="h-3 bg-slate-100 rounded w-2/3 animate-pulse" />
                      </div>

                      {/* Featured Category */}
                      <div className="col-span-1.5 flex items-center justify-center">
                        <div className="h-5 bg-slate-100 rounded w-10 animate-pulse" />
                      </div>

                      {/* Status */}
                      <div className="col-span-1.5 flex items-center justify-center">
                        <div className="h-7 bg-slate-100 rounded-full w-20 animate-pulse" />
                      </div>

                      {/* Products */}
                      <div className="col-span-1.5 flex items-center justify-center">
                        <div className="h-4 bg-slate-100 rounded w-16 animate-pulse" />
                      </div>

                      {/* Created On */}
                      <div className="col-span-1.5 flex items-center justify-end pr-2">
                        <div className="h-3.5 bg-slate-100 rounded w-20 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Categories Table catalog list */
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col pt-1 relative">
                {/* Style override tags */}
                <style>{`
                  @keyframes loadingBar {
                    0% { left: -35%; }
                    100% { left: 100%; }
                  }
                  .animate-loadingBar {
                    animation: loadingBar 1s linear infinite;
                  }
                `}</style>
                
                {/* Subtle top progress bar inside the table */}
                {isRefreshing && (
                  <div className="w-full h-0.5 bg-blue-100 relative overflow-hidden z-10">
                    <div className="absolute top-0 left-0 h-full bg-blue-600 animate-loadingBar w-1/3 rounded-full" />
                  </div>
                )}

                 <div className="hidden sm:grid sm:grid-cols-12 items-center border-b border-slate-100 px-5 py-3 bg-slate-50/20 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <div className="col-span-3 pl-2">Category</div>
                  <div className="col-span-3 pl-2">Description</div>
                  <div className="col-span-1.5 text-center">Featured</div>
                  <div className="col-span-1.5 text-center">Status</div>
                  <div className="col-span-1.5 text-center">Products</div>
                  <div className="col-span-1.5 text-right pr-2">Created On</div>
                </div>

                <div className="relative p-3 sm:p-4 bg-white min-h-[250px]">
                  {isRefreshing && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] z-10 p-3 sm:p-4 space-y-2 pointer-events-none">
                      {[1, 2, 3, 4, 5, 6].map((idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center p-3 rounded-xl border border-slate-50 gap-2.5 sm:gap-0 bg-white"
                        >
                          {/* Category Name & Slug */}
                          <div className="col-span-3 flex flex-col items-start min-w-0 sm:pl-2 text-left space-y-1.5">
                            <div className="h-4 bg-slate-200 rounded w-28 animate-pulse" />
                            <div className="h-3 bg-slate-200 rounded w-16 animate-pulse" />
                          </div>

                          {/* Description */}
                          <div className="col-span-3 pr-4 text-left space-y-1.5">
                            <div className="h-3.5 bg-slate-200 rounded w-4/5 animate-pulse" />
                            <div className="h-3 bg-slate-200 rounded w-2/3 animate-pulse" />
                          </div>

                          {/* Featured Category */}
                          <div className="col-span-1.5 flex items-center justify-center">
                            <div className="h-5 bg-slate-200 rounded w-10 animate-pulse" />
                          </div>

                          {/* Status */}
                          <div className="col-span-1.5 flex items-center justify-center">
                            <div className="h-7 bg-slate-200 rounded-full w-20 animate-pulse" />
                          </div>

                          {/* Products */}
                          <div className="col-span-1.5 flex items-center justify-center">
                            <div className="h-4 bg-slate-200 rounded w-16 animate-pulse" />
                          </div>

                          {/* Created On */}
                          <div className="col-span-1.5 flex items-center justify-end pr-2">
                            <div className="h-3.5 bg-slate-200 rounded w-20 animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={`space-y-2 transition-opacity duration-205 ${isRefreshing ? 'opacity-30 pointer-events-none' : ''}`}>
                    {categories.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => navigate(`/admin/categories/${c.id}`)}
                        className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center p-3 rounded-xl border border-slate-100 hover:border-blue-150 hover:bg-blue-50/40 transition-all duration-200 cursor-pointer gap-2.5 sm:gap-0 bg-white"
                      >
                        {/* Category Name & Slug */}
                        <div className="col-span-3 flex flex-col items-start min-w-0 sm:pl-2 text-left">
                          <span className="text-[12.5px] font-bold text-slate-800 truncate leading-tight">{c.name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-none">{c.slug}</span>
                        </div>

                        {/* Description */}
                        <div className="col-span-3 text-[11px] text-slate-550 leading-relaxed font-semibold pr-4 line-clamp-2 text-left">
                          {c.description}
                        </div>

                        {/* Featured Category */}
                        <div className="col-span-1.5 flex items-center justify-center">
                          {c.featured ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 text-[8px] font-black uppercase tracking-wider">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-50 text-slate-400 border border-slate-100 text-[8px] font-black uppercase tracking-wider">
                              No
                            </span>
                          )}
                        </div>

                        {/* Status */}
                        <div className="col-span-1.5 flex items-center justify-center">
                          <CategoryStatusBadge status={c.status} />
                        </div>

                        {/* Products */}
                        <div className="col-span-1.5 text-center text-[11.5px] font-bold text-slate-700">
                          {c.productsCount} Products
                        </div>

                        {/* Created On */}
                        <div className="col-span-1.5 text-right pr-2 text-[10.5px] text-slate-400 font-semibold">
                          {c.createdOn}
                        </div>

                      </div>
                    ))}

                    {categories.length === 0 && (
                      <div className="text-center py-10 text-slate-400 font-semibold text-xs flex flex-col items-center justify-center space-y-2">
                        <BookOpen className="w-8 h-8 text-slate-300" />
                        <span>No categories found matching filters.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-white rounded-b-2xl">
                    <div className="text-[11.5px] font-bold text-slate-500">
                      Showing Page <span className="text-slate-800">{page}</span> of <span className="text-slate-800">{totalPages}</span> ({totalCategories} categories)
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        disabled={page <= 1 || loading}
                        onClick={() => setPage(p => p - 1)}
                        className="h-8.5 px-3.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-655 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Previous
                      </button>
                      <button
                        disabled={page >= totalPages || loading}
                        onClick={() => setPage(p => p + 1)}
                        className="h-8.5 px-3.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-655 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ================= DEDICATED CREATE & DETAILS PAGE ================= */
          <div className="space-y-6 animate-fadeIn pb-12">
            {/* Sticky Header block */}
            <div className="sticky top-0 z-20 bg-[#F8FAFC]/95 backdrop-blur-sm border-b border-slate-100 pb-5 pt-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1 text-left">
                <button
                  onClick={() => navigate('/admin/categories')}
                  className="flex items-center space-x-1 text-[11.5px] font-bold text-slate-400 hover:text-slate-700 transition-colors border-none bg-transparent cursor-pointer pl-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Categories</span>
                </button>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                  {mode === 'edit' ? (isEditingCategory ? 'Edit Category' : 'Category Details') : 'Create Category'}
                </h1>
                <p className="text-[12px] text-slate-500 font-semibold">
                  {mode === 'edit' 
                    ? (isEditingCategory ? 'Update your category details.' : 'Manage category information and settings.') 
                    : 'Configure group details, status indicators, and cover assets.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 self-end sm:self-auto">
                {!isEditingCategory ? (
                  /* View Mode */
                  <>
                    <button
                      onClick={() => navigate('/admin/categories')}
                      className="h-10 px-4.5 rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-[12px] font-bold text-slate-655 flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    {mode === 'edit' && (
                      <button
                        onClick={() => setIsEditingCategory(true)}
                        className="h-10 px-5.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-black transition-all flex items-center space-x-1.5 active:scale-95 shadow-md shadow-blue-600/25 cursor-pointer"
                      >
                        <span>Edit</span>
                      </button>
                    )}
                  </>
                ) : (
                  /* Edit Mode */
                  <>
                    <button
                      onClick={async () => {
                        // Cancel button: discard unsaved changes, reload latest data, return to View Mode
                        if (mode === 'edit' && categoryId) {
                          setDetailsLoading(true);
                          setValidationError(null);
                          setNameError(null);
                          setDescError(null);
                          try {
                            const res = await categoryService.getCategoryById(categoryId);
                            if (res) {
                              const item = res.data || res.category || res;
                              const mapped = mapCategoryToItem(item);
                              setName(mapped.name);
                              setDescription(mapped.description);
                              setFeatured(mapped.featured);
                              setStatus(mapped.status);
                              setUploadedImage(mapped.image);
                              setImageObj(mapped.imageObj || null);
                              setCategoryDetails(mapped);
                            }
                          } catch (err) {
                            console.error('Error reloading category details:', err);
                          } finally {
                            setDetailsLoading(false);
                          }
                          setIsEditingCategory(false);
                        } else {
                          // If creating, cancel goes back to list
                          navigate('/admin/categories');
                        }
                      }}
                      disabled={isSaving || isUploadingImage}
                      className="h-10 px-4.5 rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-[12px] font-bold text-slate-655 flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <span>Cancel</span>
                    </button>

                    <button
                      onClick={handleSave}
                      disabled={isSaving || isUploadingImage || detailsLoading}
                      className={`h-10 px-5.5 rounded-xl text-[12px] font-black transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer ${
                        isSaving || isUploadingImage || detailsLoading
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25'
                      }`}
                    >
                      {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {detailsLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
                {/* Left Column: Category Information Card Skeleton */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-white border border-slate-100 rounded-[24px] p-6 md:p-8 space-y-6 shadow-sm text-left animate-pulse">
                    <div className="space-y-1">
                      <div className="h-5 bg-slate-100 rounded w-1/3" />
                      <div className="h-3 bg-slate-100 rounded w-1/4 mt-1.5" />
                    </div>
                    
                    <hr className="border-slate-100" />

                    {/* Category Image Card skeleton */}
                    <div className="space-y-2.5">
                      <div className="h-3 bg-slate-100 rounded w-20 pl-1.5" />
                      <div className="aspect-square w-48 bg-slate-100 rounded-2xl" />
                    </div>

                    {/* Category Name skeleton */}
                    <div className="h-14 bg-slate-100 rounded-2xl w-full" />

                    {/* Description skeleton */}
                    <div className="h-28 bg-slate-100 rounded-2xl w-full" />
                  </div>
                </div>

                {/* Right Column: Settings Card & Summary Card Skeleton */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Category Settings Card skeleton */}
                  <div className="bg-white border border-slate-100 rounded-[24px] p-6.5 space-y-5 shadow-sm text-left animate-pulse">
                    <div className="space-y-0.5">
                      <div className="h-4.5 bg-slate-100 rounded w-1/2" />
                      <div className="h-3 bg-slate-100 rounded w-2/3 mt-1.5" />
                    </div>
                    
                    <hr className="border-slate-100" />

                    {/* Featured toggle skeleton */}
                    <div className="h-14 bg-slate-100 rounded-2xl w-full" />

                    {/* Status dropdown skeleton */}
                    <div className="h-12 bg-slate-100 rounded-2xl w-full" />
                  </div>

                  {/* Category Summary Card skeleton */}
                  <div className="bg-white border border-slate-100 rounded-[24px] p-6.5 space-y-5 shadow-sm text-left animate-pulse">
                    <div className="space-y-0.5">
                      <div className="h-4.5 bg-slate-100 rounded w-1/2" />
                      <div className="h-3 bg-slate-100 rounded w-1/3 mt-1.5" />
                    </div>
                    
                    <hr className="border-slate-100" />

                    <div className="space-y-3.5">
                      {[1, 2, 3, 4, 5, 6].map((idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <div className="h-3 bg-slate-100 rounded w-1/4" />
                          <div className="h-3 bg-slate-100 rounded w-1/3" />
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              /* Grid Columns */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Category Information Card */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-white border border-slate-100 rounded-[24px] p-6 md:p-8 space-y-6 shadow-sm text-left">
                    <div className="space-y-1">
                      <h3 className="text-md font-black text-slate-800 tracking-tight">Category Information</h3>
                      <p className="text-[10.5px] text-slate-455 font-bold uppercase tracking-wider">Classification media and parameters</p>
                    </div>
                    
                    <hr className="border-slate-100" />

                    {/* Drag & Drop Cover Image uploader */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-slate-455 uppercase tracking-wider pl-1.5">Category Image</label>
                      
                      {isUploadingImage ? (
                        <div className="border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center bg-blue-50/10 flex flex-col items-center justify-center space-y-3.5 cursor-not-allowed">
                          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
                          <div className="w-full max-w-xs space-y-2">
                            <h4 className="text-[13px] font-black text-slate-850">Uploading Image...</h4>
                            {uploadProgress !== null && (
                              <div className="space-y-1.5">
                                <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                  <span>Progress</span>
                                  <span>{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-blue-600 h-full rounded-full transition-all duration-250" style={{ width: `${uploadProgress}%` }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : !uploadedImage ? (
                        <div
                          onDragOver={e => isEditingCategory && handleDragOver(e)}
                          onDragLeave={() => isEditingCategory && handleDragLeave()}
                          onDrop={e => isEditingCategory && handleDrop(e)}
                          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 flex flex-col items-center justify-center space-y-3.5 bg-white hover:bg-slate-50/60 ${
                            !isEditingCategory ? 'cursor-not-allowed border-slate-200 bg-slate-50/40' :
                            isDragging ? 'border-blue-500 bg-blue-50/15 cursor-pointer' : 'border-slate-200 hover:border-slate-355 cursor-pointer'
                          }`}
                          onClick={() => isEditingCategory && document.getElementById('category-details-uploader')?.click()}
                        >
                          <input
                            id="category-details-uploader"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-[13px] font-black text-slate-800">Upload Category Image</h4>
                            <p className="text-[10px] text-slate-455 font-semibold mt-1">
                              Drag & Drop image here, or <span className="text-blue-600 hover:underline">Click to Browse</span>
                            </p>
                            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                              JPG, PNG, WEBP • Max 5 MB • Recommended 600 × 600 px
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="relative aspect-square w-48 bg-slate-50 rounded-2xl overflow-hidden border border-slate-150 flex items-center justify-center p-3 shadow-sm group">
                          <SafeImage src={uploadedImage} alt="Category Cover preview" className="w-full h-full object-cover rounded-lg" />
                          {isEditingCategory && (
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                              <button
                                type="button"
                                onClick={() => document.getElementById('category-details-uploader-replace')?.click()}
                                className="w-9.5 h-9.5 rounded-full bg-white text-blue-600 hover:bg-blue-50 flex items-center justify-center shadow transition-all cursor-pointer border-none"
                                title="Replace Image"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="w-9.5 h-9.5 rounded-full bg-white text-red-500 hover:bg-red-50 flex items-center justify-center shadow transition-all cursor-pointer border-none"
                                title="Remove Image"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <input
                                id="category-details-uploader-replace"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                              />
                            </div>
                          )}
                        </div>
                      )}
                      


                      {validationError && (
                        <p className="text-[10.5px] text-red-500 font-bold mt-1 pl-1.5">{validationError}</p>
                      )}
                    </div>

                    {/* Category Name */}
                    <div className="relative w-full text-left">
                      <div className={`relative flex items-center border rounded-2xl transition-all duration-200 ${
                        nameError 
                          ? 'border-red-300 ring-4 ring-red-500/10 bg-slate-50/80' 
                          : 'bg-white hover:bg-slate-50/60 border-slate-200 hover:border-slate-350 focus-within:bg-slate-50/80 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10'
                      }`}>
                        <div className="flex-grow relative py-3.5 px-4">
                          <label className="absolute left-4 -top-2 z-10 text-[9.5px] bg-white px-1.5 text-blue-655 font-bold">
                            Category Name *
                          </label>
                          <input
                            type="text"
                            value={name}
                            disabled={!isEditingCategory}
                            onChange={e => setName(e.target.value)}
                            placeholder="Enter category name"
                            className={`w-full bg-transparent text-[12.5px] font-bold text-slate-800 focus:outline-none placeholder-slate-300 ${!isEditingCategory ? 'cursor-not-allowed opacity-75' : ''}`}
                          />
                        </div>
                      </div>
                      {nameError && (
                        <p className="text-[10px] text-red-500 font-bold mt-1 pl-1.5">{nameError}</p>
                      )}
                    </div>

                    {/* Description Description */}
                    <div className="relative w-full text-left">
                      <div className={`relative flex items-start border rounded-2xl transition-all duration-200 ${
                        descError 
                          ? 'border-red-300 ring-4 ring-red-500/10 bg-slate-50/80' 
                          : 'bg-white hover:bg-slate-50/60 border-slate-200 hover:border-slate-355 focus-within:bg-slate-50/80 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10'
                      }`}>
                        <div className="flex-grow relative py-3.5 px-4">
                          <label className="absolute left-4 -top-2 z-10 text-[9.5px] bg-white px-1.5 text-blue-655 font-bold">
                            Description *
                          </label>
                          <textarea
                            value={description}
                            disabled={!isEditingCategory}
                            onChange={e => setDescription(e.target.value.slice(0, 250))}
                            placeholder="Enter category description"
                            rows={4}
                            className={`w-full bg-transparent text-[12.5px] font-semibold text-slate-700 focus:outline-none placeholder-slate-300 resize-none mt-1 ${!isEditingCategory ? 'cursor-not-allowed opacity-75' : ''}`}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between mt-1 text-[9px] font-bold text-slate-400 pl-1.5 pr-1.5">
                        <span>{descError ? <span className="text-red-500">{descError}</span> : <span>Max 250 characters</span>}</span>
                        <span className={description.length >= 250 ? "text-red-500" : ""}>{description.length}/250</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Settings Card & Summary Card */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Category Settings Card */}
                  <div className="bg-white border border-slate-100 rounded-[24px] p-6.5 space-y-5 shadow-sm text-left">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-slate-800 tracking-tight">Category Settings</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Configure status and listing visibility</p>
                    </div>
                    
                    <hr className="border-slate-100" />

                    {/* Featured Category iOS Toggle */}
                    <div className="w-full flex flex-col space-y-1">
                      <label className="text-[10px] font-black text-slate-455 uppercase tracking-wider pl-1.5">Featured Category</label>
                      <div className="flex items-center justify-between border border-slate-200 hover:border-slate-355 rounded-2xl bg-white h-14 px-4 shadow-sm shadow-slate-100/50">
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                          <span className="text-[12.5px] font-bold text-slate-800 whitespace-nowrap">Featured</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => isEditingCategory && setFeatured(!featured)}
                          disabled={!isEditingCategory}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                            !isEditingCategory ? 'cursor-not-allowed bg-slate-100 opacity-60' :
                            featured ? 'bg-blue-600 cursor-pointer' : 'bg-slate-200 cursor-pointer'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              featured ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      <span className="text-[8.5px] text-slate-400 font-semibold pl-1.5 mt-0.5 leading-tight">
                        Featured categories will appear in highlighted sections of the store.
                      </span>
                    </div>

                    {/* Status Dropdown selector */}
                    <div className="w-full flex flex-col space-y-1">
                      <label className="text-[10px] font-black text-slate-455 uppercase tracking-wider pl-1.5">Status *</label>
                      <FormStatusDropdown selected={status} disabled={!isEditingCategory} onSelect={setStatus} />
                    </div>
                  </div>

                  {/* Category Summary Card */}
                  <div className="bg-white border border-slate-100 rounded-[24px] p-6.5 space-y-5 shadow-sm text-left">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-slate-800 tracking-tight">Category Summary</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quick reference details</p>
                    </div>
                    
                    <hr className="border-slate-100" />

                    <div className="space-y-3.5">
                      {/* ID */}
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                        <span>Category ID</span>
                        <span className="font-bold text-slate-800 select-all">{selectedCategoryObj?.id || 'Pending Classification'}</span>
                      </div>

                      {/* Created Date */}
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                        <span>Created Date</span>
                        <span className="font-bold text-slate-800">{selectedCategoryObj?.createdOn || 'Today'}</span>
                      </div>

                      {/* Last Updated */}
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                        <span>Last Updated</span>
                        <span className="font-bold text-slate-800">{selectedCategoryObj?.updatedAt || 'Never'}</span>
                      </div>

                      {/* Products count */}
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                        <span>Number of Products</span>
                        <span className="font-bold text-slate-850">{selectedCategoryObj?.productsCount || 0} Products</span>
                      </div>

                      {/* Featured */}
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                        <span>Featured</span>
                        <span className="font-bold text-slate-800">{featured ? 'Yes' : 'No'}</span>
                      </div>

                      {/* Current Status */}
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                        <span>Current Status</span>
                        <CategoryStatusBadge status={status} />
                      </div>
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

export default AdminCategories;
