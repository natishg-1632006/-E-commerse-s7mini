import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { AnimatedCounter } from '../../components/common/AnimatedCounter';
import { InventoryTableSkeleton, DetailPageSkeleton } from '../../components/admin/AdminSkeletons';
import {
  AlertTriangle,
  Search,
  Grid,
  Boxes,
  CheckCircle,
  XCircle,
  Clock,
  ShoppingBag,
  ChevronDown,
  Loader2,
  ArrowLeft,
  Package,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { inventoryService } from '../../services/inventory.service';
import { productService } from '../../services/product.service';
import macbookImg from '../../assets/products/macbook.jpg';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  threshold: number;
  reservedStock: number;
  soldQty: number;
  img: string;
  brand: string;
  status: string;
  lastUpdated: string;
}

const CustomSwitch: React.FC<{
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description?: string;
}> = ({ checked, onChange, label, description }) => {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex flex-col text-left">
        <span className="text-[12px] font-extrabold text-slate-800">{label}</span>
        {description && <span className="text-[10.5px] text-slate-400 font-semibold">{description}</span>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6.5 w-11.5 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none ${
          checked ? 'bg-blue-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-md ring-0 transition duration-250 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

const InventoryStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const baseClass = "inline-flex items-center justify-center space-x-1 px-3 py-1 rounded-full text-[10px] font-bold border flex-shrink-0 text-center";
  const normalized = (status || '').trim().toLowerCase();
  
  if (normalized === 'out of stock' || normalized === 'outofstock') {
    return (
      <span className={`${baseClass} bg-red-50 text-red-500 border-red-100`}>
        <XCircle className="w-3 h-3 flex-shrink-0" />
        <span>Out of Stock</span>
      </span>
    );
  }
  if (normalized === 'low stock' || normalized === 'lowstock') {
    return (
      <span className={`${baseClass} bg-amber-50 text-amber-650 border-amber-100`}>
        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
        <span>Low Stock</span>
      </span>
    );
  }
  if (normalized === 'inactive') {
    return (
      <span className={`${baseClass} bg-slate-50 text-slate-500 border-slate-100`}>
        <XCircle className="w-3 h-3 flex-shrink-0" />
        <span>Inactive</span>
      </span>
    );
  }
  return (
    <span className={`${baseClass} bg-emerald-50 text-emerald-655 border-emerald-100`}>
      <CheckCircle className="w-3 h-3 flex-shrink-0" />
      <span>In Stock</span>
    </span>
  );
};

// --- Custom Reusable Dropdown Component ---
interface DropdownProps<T> {
  label: string;
  selected: T;
  options: { value: T; label: string }[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelect: (value: T) => void;
}

function PremiumDropdown<T>({ label, selected, options, isOpen, setIsOpen, onSelect }: DropdownProps<T>) {
  const activeLabel = options.find(o => o.value === selected)?.label || '';
  return (
    <div className="relative min-w-[168px]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-10.5 w-full px-4 rounded-xl border text-slate-700 text-[11.5px] font-bold transition-all flex items-center justify-between space-x-2.5 shadow-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none cursor-pointer ${
          isOpen
            ? 'bg-slate-50/80 border-blue-600 ring-4 ring-blue-600/10 shadow-sm shadow-blue-600/5'
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
              key={String(option.value)}
              onClick={() => {
                onSelect(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 text-[11.5px] font-bold transition-colors hover:bg-slate-50 ${
                selected === option.value ? 'text-blue-600 bg-blue-50/10' : 'text-slate-650'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type SortField = 'name' | 'available' | 'current' | 'reserved' | 'sold' | 'lastUpdated' | 'status';

const sortOptions = [
  { value: 'name' as SortField, label: 'Product Name' },
  { value: 'available' as SortField, label: 'Available Stock' },
  { value: 'current' as SortField, label: 'Current Stock' },
  { value: 'reserved' as SortField, label: 'Reserved Stock' },
  { value: 'sold' as SortField, label: 'Sold Quantity' },
  { value: 'lastUpdated' as SortField, label: 'Last Updated' },
  { value: 'status' as SortField, label: 'Status' },
];

type StatusFilterField = 'All' | 'In Stock' | 'Low Stock' | 'Out of Stock';

const statusOptions = [
  { value: 'All' as StatusFilterField, label: 'All Status' },
  { value: 'In Stock' as StatusFilterField, label: 'In Stock' },
  { value: 'Low Stock' as StatusFilterField, label: 'Low Stock' },
  { value: 'Out of Stock' as StatusFilterField, label: 'Out of Stock' },
];

const AdminInventory: React.FC = () => {
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterField>('All');
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [viewMode, setViewMode] = useState<'all' | 'low-stock'>('all');
  
  // Custom dropdown open states
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // Edit stock state (switches view to Full Inventory Details Page workspace when set)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadInventoryData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [prodRes, invRes] = await Promise.all([
        productService.getProducts({ limit: 1000 }),
        viewMode === 'low-stock' 
          ? inventoryService.getLowStockInventory() 
          : inventoryService.getAllInventory()
      ]);

      let products: any[] = [];
      if (prodRes) {
        if (Array.isArray(prodRes)) {
          products = prodRes;
        } else {
          products = prodRes.products || prodRes.data || [];
        }
      }

      let inventoryItems: any[] = [];
      if (invRes) {
        if (Array.isArray(invRes)) {
          inventoryItems = invRes;
        } else {
          inventoryItems = invRes.data || [];
        }
      }

      const mappedList: InventoryItem[] = inventoryItems.map((inv: any) => {
        const product = products.find(p => p.id === inv.productId || p.productId === inv.productId);
        let imgUrl = '';
        if (product) {
          if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            const img = product.images[0];
            imgUrl = typeof img === 'string' ? img : (img.imageUrl || img.url || '');
          } else {
            imgUrl = product.img || '';
          }
        }
        return {
          id: inv.productId,
          name: product ? product.name : `Product ${inv.productId}`,
          sku: product ? (product.sku || `${product.brand ? product.brand.substring(0,3).toUpperCase() : 'PRD'}-${product.name.substring(0,5).toUpperCase()}-${inv.productId.substring(0,4)}`) : `SKU-${inv.productId.substring(0,4)}`,
          category: product ? (product.category || product.categoryName || 'Uncategorized') : 'Uncategorized',
          currentStock: inv.currentStock || 0,
          threshold: inv.lowStockThreshold || 0,
          reservedStock: inv.reservedStock || 0,
          soldQty: inv.soldQuantity || 0,
          img: imgUrl || macbookImg,
          brand: product ? product.brand : '',
          status: inv.status || 'In Stock',
          lastUpdated: inv.lastUpdated || new Date().toISOString()
        };
      });

      setInventoryList(mappedList);
    } catch (err: any) {
      console.error('Error loading inventory:', err);
      triggerToast(err.response?.data?.message || err.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, [viewMode]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
  };

  const handleStatusFilterChange = (val: StatusFilterField) => {
    setStatusFilter(val);
    if (val === 'Low Stock' || val === 'Out of Stock') {
      setViewMode('low-stock');
    } else {
      setViewMode('all');
    }
  };

  const handleSortChange = (val: SortField) => {
    setSortBy(val);
  };
  
  const [editThreshold, setEditThreshold] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Loading state
  const [isUpdating, setIsUpdating] = useState(false);

  // Stock Adjustment Card Inline states
  const [adjustmentQty, setAdjustmentQty] = useState<number>(10);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Manual Restock');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [activeAdjType, setActiveAdjType] = useState<'increase' | 'decrease' | null>(null);

  // Inventory settings switch & dropdown states
  const [enableTracking, setEnableTracking] = useState(true);
  const [allowBackorders, setAllowBackorders] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState('Main Warehouse');
  const [selectedSupplier, setSelectedSupplier] = useState('Apple Inc.');

  // Dirty form initial states tracking
  const [initialTracking, setInitialTracking] = useState(true);
  const [initialBackorders, setInitialBackorders] = useState(false);
  const [initialWarehouse, setInitialWarehouse] = useState('Main Warehouse');
  const [initialSupplier, setInitialSupplier] = useState('Apple Inc.');
  const [initialThreshold, setInitialThreshold] = useState(0);

  // Dialog / Warning states
  const [showNavigationDiscardModal, setShowNavigationDiscardModal] = useState(false);

  // Nested Confirmation modal state
  const [pendingConfirm, setPendingConfirm] = useState<{
    item: InventoryItem;
    oldStock: number;
    operation: 'increase' | 'decrease';
    quantity: number;
    newStock: number;
    oldThreshold: number;
    newThreshold: number;
  } | null>(null);

  const [pendingAdjustmentConfirm, setPendingAdjustmentConfirm] = useState<{
    type: 'increase' | 'decrease';
    quantity: number;
    currentStock: number;
    newStock: number;
  } | null>(null);

  // Success message toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter logic
  const filtered = inventoryList.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));
      
    const matchesStatus = 
      statusFilter === 'All' || 
      (p.status || '').trim().toLowerCase() === statusFilter.trim().toLowerCase();
      
    return matchesSearch && matchesStatus;
  });

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'available') {
      const availA = a.currentStock - a.reservedStock;
      const availB = b.currentStock - b.reservedStock;
      return availB - availA;
    }
    if (sortBy === 'current') {
      return b.currentStock - a.currentStock;
    }
    if (sortBy === 'reserved') {
      return b.reservedStock - a.reservedStock;
    }
    if (sortBy === 'sold') {
      return b.soldQty - a.soldQty;
    }
    if (sortBy === 'lastUpdated') {
      return new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime();
    }
    if (sortBy === 'status') {
      return (a.status || '').localeCompare(b.status || '');
    }
    return 0;
  });

  const syncInitialStates = (threshold: number) => {
    setInitialThreshold(threshold);
    setEditThreshold(threshold);
    setInitialTracking(true);
    setInitialBackorders(false);
    setInitialWarehouse('Main Warehouse');
    setInitialSupplier('Apple Inc.');
    setEnableTracking(true);
    setAllowBackorders(false);
    setSelectedWarehouse('Main Warehouse');
    setSelectedSupplier('Apple Inc.');
  };

  const isDirty = 
    editThreshold !== initialThreshold ||
    enableTracking !== initialTracking ||
    allowBackorders !== initialBackorders ||
    selectedWarehouse !== initialWarehouse ||
    selectedSupplier !== initialSupplier;

  const discardUnsavedChanges = () => {
    setEditThreshold(initialThreshold);
    setEnableTracking(initialTracking);
    setAllowBackorders(initialBackorders);
    setSelectedWarehouse(initialWarehouse);
    setSelectedSupplier(initialSupplier);
    setValidationError(null);
  };

  const handleBackClick = () => {
    if (isDirty) {
      setShowNavigationDiscardModal(true);
    } else {
      setEditingItem(null);
    }
  };

  const triggerAdjustmentConfirm = (type: 'increase' | 'decrease') => {
    if (!editingItem) return;
    if (adjustmentQty <= 0) {
      triggerToast('Adjustment quantity must be greater than zero.');
      return;
    }
    if (type === 'decrease' && editingItem.currentStock - adjustmentQty < 0) {
      triggerToast('❌ Cannot decrease more than current stock.');
      return;
    }

    setPendingAdjustmentConfirm({
      type,
      quantity: adjustmentQty,
      currentStock: editingItem.currentStock,
      newStock: type === 'increase' ? editingItem.currentStock + adjustmentQty : editingItem.currentStock - adjustmentQty
    });
  };

  const confirmAdjustmentCall = async () => {
    if (!pendingAdjustmentConfirm || !editingItem) return;
    const { type, quantity } = pendingAdjustmentConfirm;
    
    setIsAdjusting(true);
    setActiveAdjType(type);
    setPendingAdjustmentConfirm(null);
    try {
      if (type === 'increase') {
        await inventoryService.increaseStock(editingItem.id, quantity, adjustmentReason.trim());
        triggerToast('Inventory updated successfully.');
      } else {
        await inventoryService.decreaseStock(editingItem.id, quantity, adjustmentReason.trim());
        triggerToast('Inventory updated successfully.');
      }
      setAdjustmentQty(10);
      setAdjustmentReason('Manual Restock');
      await refreshDetails(editingItem.id);
      await loadInventoryData(true);
    } catch (err: any) {
      console.error('Error adjusting stock:', err);
      let errorMsg = 'Failed to adjust stock.';
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        errorMsg = err.response.data.errors.map((e: any) => e.msg || e.message).join(', ');
      } else {
        errorMsg = err.response?.data?.message || err.message || errorMsg;
      }
      triggerToast(errorMsg);
    } finally {
      setIsAdjusting(false);
      setActiveAdjType(null);
    }
  };

  // Refresh details page info from backend
  const refreshDetails = async (productId: string) => {
    setDetailsLoading(true);
    try {
      const res = await inventoryService.getInventoryByProductId(productId);
      const inv = res.data || res;
      if (inv) {
        setEditingItem(prev => prev ? {
          ...prev,
          currentStock: inv.currentStock,
          threshold: inv.lowStockThreshold,
          reservedStock: inv.reservedStock,
          soldQty: inv.soldQuantity,
          status: inv.status,
          lastUpdated: inv.lastUpdated
        } : null);
        syncInitialStates(inv.lowStockThreshold || 0);
      }
    } catch (err: any) {
      console.error('Error refreshing details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleEditClick = async (item: InventoryItem) => {
    setEditingItem(item);
    setDetailsLoading(true);
    setValidationError(null);
    try {
      const res = await inventoryService.getInventoryByProductId(item.id);
      const inv = res.data || res;
      if (inv) {
        setEditingItem(prev => prev ? {
          ...prev,
          currentStock: inv.currentStock,
          threshold: inv.lowStockThreshold,
          reservedStock: inv.reservedStock,
          soldQty: inv.soldQuantity,
          status: inv.status,
          lastUpdated: inv.lastUpdated
        } : null);
        syncInitialStates(inv.lowStockThreshold || 0);
      }
    } catch (err: any) {
      console.error('Error fetching inventory details:', err);
      triggerToast(err.response?.data?.message || err.message || 'Failed to fetch inventory details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const triggerConfirmModal = () => {
    if (!editingItem) return;
    if (editThreshold < 0) {
      setValidationError('Low stock threshold cannot be negative.');
      return;
    }
    setValidationError(null);

    setPendingConfirm({
      item: editingItem,
      oldStock: editingItem.currentStock,
      operation: 'increase',
      quantity: 0,
      newStock: editingItem.currentStock,
      oldThreshold: editingItem.threshold,
      newThreshold: editThreshold,
    });
  };

  const confirmSaveChanges = async () => {
    if (!pendingConfirm || !editingItem) return;

    setIsUpdating(true);
    try {
      await inventoryService.updateInventoryThreshold(editingItem.id, editThreshold);
      triggerToast('Low stock threshold updated successfully.');
      setPendingConfirm(null);
      
      // Update clean state values
      setInitialThreshold(editThreshold);
      setInitialTracking(enableTracking);
      setInitialBackorders(allowBackorders);
      setInitialWarehouse(selectedWarehouse);
      setInitialSupplier(selectedSupplier);

      await refreshDetails(editingItem.id);
      await loadInventoryData(true);
    } catch (err: any) {
      console.error('Error updating threshold:', err);
      triggerToast(err.response?.data?.message || err.message || 'Failed to update threshold.');
    } finally {
      setIsUpdating(false);
    }
  };

  const outOfStockCount = inventoryList.filter(p => {
    const st = (p.status || '').trim().toLowerCase();
    return st === 'out of stock' || st === 'outofstock';
  }).length;

  const lowStockCount = inventoryList.filter(p => {
    const st = (p.status || '').trim().toLowerCase();
    return st === 'low stock' || st === 'lowstock';
  }).length;

  const inStockCount = inventoryList.filter(p => {
    const st = (p.status || '').trim().toLowerCase();
    return st === 'in stock' || st === 'instock';
  }).length;

  const totalReserved = inventoryList.reduce((acc, p) => acc + (p.reservedStock || 0), 0);
  const totalSold = inventoryList.reduce((acc, p) => acc + (p.soldQty || 0), 0);
  // Compute validation state for UI updates
  const isFormValid = editThreshold >= 0;

  // Exact Grid Percentages:
  // Product -> 24%, Available -> 11%, Current -> 11%, Threshold -> 14%, Reserved -> 10%, Sold -> 10%, Status -> 10%, Auto space -> 10%
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '24% 11% 11% 14% 10% 10% 10% auto',
  };

  return (
    <AdminLayout>
      <div className="p-5 sm:p-7 space-y-6 relative animate-fadeIn">
        {/* Success Toast */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 flex items-center space-x-2 bg-slate-900 text-white text-[12px] font-bold px-4 py-3 rounded-xl shadow-lg border border-slate-800 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {!editingItem ? (
          /* ================= LIST VIEW ================= */
          <div className="space-y-6 animate-fadeIn">
            {/* Page Header */}
            <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-[12px] font-bold text-blue-600 tracking-wider uppercase">Warehouse Hub</div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Inventory</h1>
                <p className="text-[12.5px] text-slate-555 font-medium mt-0.5">
                  Stock levels, adjustments pipeline, and warehouse warnings
                </p>
              </div>
            </div>

            {/* Alarm Notice */}
            {(outOfStockCount > 0 || lowStockCount > 0) && (
              <div className="flex items-center space-x-3 bg-red-50 border border-red-200/40 rounded-2xl px-5 py-3.5 shadow-sm">
                <AlertTriangle className="w-4.5 h-4.5 text-red-500 flex-shrink-0 animate-bounce" />
                <span className="text-[12.5px] font-bold text-red-655">
                  Alert: {outOfStockCount} items out of stock and {lowStockCount} items running below threshold. Action required.
                </span>
              </div>
            )}

            {/* Quick statistics highlights block */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map(idx => (
                  <div key={idx} className="bg-white border border-slate-100 rounded-[16px] p-4 h-[90px] flex flex-col justify-between shadow-sm animate-pulse">
                    <div className="flex justify-between items-center"><div className="h-2.5 w-16 bg-slate-200 rounded" /><div className="w-7 h-7 bg-slate-100 rounded-full" /></div>
                    <div className="h-5 w-10 bg-slate-300 rounded mt-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div 
                  onClick={() => { setStatusFilter('All'); setViewMode('all'); }}
                  className="bg-white border border-slate-100 rounded-[16px] p-4 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Products</span>
                    <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <Boxes className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-slate-800 mt-2 leading-none">
                    <AnimatedCounter value={inventoryList.length} />
                  </div>
                </div>

                <div 
                  onClick={() => { setStatusFilter('In Stock'); setViewMode('all'); }}
                  className="bg-white border border-slate-100 rounded-[16px] p-4 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Stock</span>
                    <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-650 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-slate-800 mt-2 leading-none">
                    <AnimatedCounter value={inStockCount} />
                  </div>
                </div>

                <div 
                  onClick={() => { setStatusFilter('Low Stock'); setViewMode('low-stock'); }}
                  className="bg-white border border-slate-100 rounded-[16px] p-4 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Stock</span>
                    <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-slate-800 mt-2 leading-none">
                    <AnimatedCounter value={lowStockCount} />
                  </div>
                </div>

                <div 
                  onClick={() => { setStatusFilter('Out of Stock'); setViewMode('low-stock'); }}
                  className="bg-white border border-slate-100 rounded-[16px] p-4 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-red-200 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Out Of Stock</span>
                    <div className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-slate-800 mt-2 leading-none">
                    <AnimatedCounter value={outOfStockCount} />
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-[16px] p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 cursor-default">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reserved</span>
                    <div className="w-7 h-7 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-slate-800 mt-2 leading-none">
                    <AnimatedCounter value={totalReserved} />
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-[16px] p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 cursor-default">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sold</span>
                    <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-slate-800 mt-2 leading-none">
                    <AnimatedCounter value={totalSold} />
                  </div>
                </div>
              </div>
            )}

            {/* Search, Custom Status Filters & Premium Custom Sort selector row */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Search Input */}
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => handleSearchChange(e.target.value)}
                    placeholder="Search by name or category..."
                    className="w-full h-10.5 pl-9 pr-4 bg-white hover:bg-slate-50/60 border border-slate-200 hover:border-slate-350 focus:bg-slate-50/80 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:outline-none rounded-xl text-[12px] text-slate-700 placeholder-slate-400 font-medium transition-all duration-200"
                  />
                </div>
                
                {/* Premium Reusable Status Dropdown Filter */}
                <PremiumDropdown<StatusFilterField>
                  label="Status"
                  selected={statusFilter}
                  options={statusOptions}
                  isOpen={isStatusOpen}
                  setIsOpen={setIsStatusOpen}
                  onSelect={handleStatusFilterChange}
                />
              </div>

              {/* Premium Custom Sort dropdown selector */}
              <PremiumDropdown<SortField>
                label="Sort By"
                selected={sortBy}
                options={sortOptions}
                isOpen={isSortOpen}
                setIsOpen={setIsSortOpen}
                onSelect={handleSortChange}
              />
            </div>

            {loading ? (
              <InventoryTableSkeleton />
            ) : (
              /* Inventory Panel List */
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col pt-1 w-full overflow-hidden relative">
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

                <div className={`w-full flex flex-col transition-opacity duration-205 ${isRefreshing ? 'opacity-55 pointer-events-none' : ''}`}>
                  {/* Header Row */}
                  <div
                    style={gridStyle}
                    className="hidden sm:grid gap-2 items-center border-b border-slate-100 px-4 py-3 bg-slate-50/20 text-[10px] font-black text-slate-400 uppercase tracking-wider"
                  >
                    <div>Product</div>
                    <div className="text-right">Available</div>
                    <div className="text-right">Current</div>
                    <div className="text-right">Threshold</div>
                    <div className="text-right">Reserved</div>
                    <div className="text-right">Sold</div>
                    <div className="text-center">Status</div>
                    <div></div>
                  </div>                  {/* List Rows */}
                  <div className="relative p-2 sm:p-3 bg-white min-h-[250px]">
                    {isRefreshing && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] z-10 p-2 sm:p-3 space-y-2 sm:space-y-2.5 pointer-events-none">
                        {[1, 2, 3, 4, 5, 6].map((idx) => (
                          <div
                            key={idx}
                            style={gridStyle}
                            className="flex flex-col sm:grid gap-2 sm:gap-3 items-start sm:items-center p-3.5 sm:p-2.5 rounded-xl border border-slate-50 bg-white"
                          >
                            {/* 1. Product */}
                            <div className="flex items-center space-x-2.5 w-full sm:w-auto min-w-0">
                              <div className="min-w-0 flex-1 space-y-1.5">
                                <div className="h-3.5 bg-slate-200 animate-pulse rounded w-4/5" />
                                <div className="h-2.5 bg-slate-200 animate-pulse rounded w-1/3" />
                              </div>
                            </div>
                            {/* 2. Available */}
                            <div className="flex justify-end w-full sm:w-auto"><div className="h-4 bg-slate-200 animate-pulse rounded w-12" /></div>
                            {/* 3. Current */}
                            <div className="flex justify-end w-full sm:w-auto"><div className="h-4 bg-slate-200 animate-pulse rounded w-12" /></div>
                            {/* 4. Threshold */}
                            <div className="flex justify-end w-full sm:w-auto"><div className="h-4 bg-slate-200 animate-pulse rounded w-12" /></div>
                            {/* 5. Reserved */}
                            <div className="flex justify-end w-full sm:w-auto"><div className="h-4 bg-slate-200 animate-pulse rounded w-12" /></div>
                            {/* 6. Sold */}
                            <div className="flex justify-end w-full sm:w-auto"><div className="h-4 bg-slate-200 animate-pulse rounded w-12" /></div>
                            {/* 7. Status */}
                            <div className="flex justify-center w-full sm:w-auto"><div className="h-7 bg-slate-200 animate-pulse rounded-full w-20" /></div>
                            {/* 8. Blank auto track */}
                            <div></div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className={`space-y-2 sm:space-y-2.5 transition-opacity duration-205 ${isRefreshing ? 'opacity-30 pointer-events-none' : ''}`}>
                      {sorted.map((p) => {
                        const availableStock = p.currentStock - p.reservedStock;
                        const st = (p.status || '').trim().toLowerCase();
                        const isBelowThreshold = st === 'low stock' || st === 'lowstock' || st === 'out of stock' || st === 'outofstock';

                        return (
                          <div
                            key={p.id}
                            onClick={() => handleEditClick(p)}
                            className="flex flex-col sm:grid gap-2 sm:gap-3 items-start sm:items-center p-3.5 sm:p-2.5 rounded-xl border border-slate-100 cursor-pointer transition-all duration-200 hover:border-blue-150 hover:bg-slate-50/40 hover:shadow-sm bg-white"
                            style={gridStyle}
                          >
                            {/* 1. Product Details (title truncated to 1 line) */}
                            <div className="flex items-center space-x-2.5 w-full sm:w-auto min-w-0">
                              <div className="min-w-0 flex-1">
                                <div className="text-[12px] font-bold text-slate-855 truncate whitespace-nowrap leading-tight" title={p.name}>
                                  {p.name}
                                </div>
                                <div className="text-[9.5px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1 leading-none">
                                  <Grid className="w-3 h-3 text-slate-355 flex-shrink-0" />
                                  <span>{p.category}</span>
                                </div>
                              </div>
                            </div>

                            {/* 2. Available stock status */}
                            <div className="flex sm:justify-end items-center text-[12.5px] font-extrabold text-slate-800">
                              <span className="sm:hidden text-slate-400 text-[10px] mr-1.5">Available:</span>
                              <div className="flex items-center space-x-1">
                                <CheckCircle className={`w-3.5 h-3.5 ${availableStock <= 0 ? 'text-red-400' : 'text-slate-400'} flex-shrink-0`} />
                                <span>{availableStock} Units</span>
                              </div>
                            </div>

                            {/* 3. Current stock */}
                            <div className="flex sm:justify-end items-center text-[12px] font-bold text-slate-800">
                              <span className="sm:hidden text-slate-400 text-[10px] mr-1.5">Current:</span>
                              <div className="flex items-center space-x-1">
                                <Boxes className={`w-3.5 h-3.5 ${isBelowThreshold ? 'text-red-400' : 'text-slate-450'} flex-shrink-0`} />
                                <span>{p.currentStock} Units</span>
                              </div>
                            </div>

                            {/* 4. Alert low threshold stock value badge */}
                            <div className="flex sm:justify-end items-center text-[11.5px] font-semibold text-slate-500">
                              <span className="sm:hidden text-slate-400 text-[10px] mr-1.5">Threshold:</span>
                              <div className="flex items-center space-x-1">
                                <AlertTriangle className={`w-3.5 h-3.5 ${isBelowThreshold ? 'text-red-500 animate-bounce mt-0.5' : 'text-slate-350'} flex-shrink-0`} />
                                <span className={isBelowThreshold ? 'text-red-655 font-black' : ''}>{p.threshold} Limit</span>
                              </div>
                            </div>

                            {/* 5. Reserved stock */}
                            <div className="flex sm:justify-end items-center text-[11.5px] font-semibold text-slate-500">
                              <span className="sm:hidden text-slate-400 text-[10px] mr-1.5">Reserved:</span>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3.5 h-3.5 text-slate-350 flex-shrink-0" />
                                <span>{p.reservedStock} Units</span>
                              </div>
                            </div>

                            {/* 6. Sold stock */}
                            <div className="flex sm:justify-end items-center text-[11.5px] font-semibold text-slate-500">
                              <span className="sm:hidden text-slate-400 text-[10px]">Sold:</span>
                              <div className="flex items-center space-x-1">
                                <ShoppingBag className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span>{p.soldQty} Units</span>
                              </div>
                            </div>

                            {/* 7. Status badge */}
                            <div className="flex items-center justify-start sm:justify-center w-full sm:w-auto">
                              <InventoryStatusBadge status={p.status} />
                            </div>

                            {/* 8. Blank auto track */}
                            <div></div>
                          </div>
                        );
                      })}

                      {sorted.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                          <Boxes className="w-12 h-12 text-slate-200" />
                          <div>
                            <div className="text-[13.5px] font-black text-slate-900">No inventory records found.</div>
                            <div className="text-[11.5px] text-slate-400 mt-0.5">Filter search criteria returned empty results.</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ================= WORKSPACE VIEW: FULL INVENTORY DETAILS PAGE ================= */
          <div className="space-y-6 animate-fadeIn pb-10">
            {/* Header & Sticky Actions Bar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-5 border-b border-slate-150 gap-4">
              <div className="space-y-2">
                <button
                  onClick={handleBackClick}
                  className="flex items-center space-x-2 text-[12px] font-bold text-blue-600 hover:text-blue-750 transition-colors cursor-pointer group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Back to Inventory List</span>
                </button>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{editingItem.name}</h1>
                  </div>
                  <InventoryStatusBadge status={editingItem.status} />
                </div>
                
                <div className="flex items-center space-x-4 text-[11px] text-slate-455 font-bold mt-1">
                  <span>Product ID: {editingItem.id}</span>
                  <span className="text-slate-200">•</span>
                  <span>SKU: {editingItem.sku}</span>
                  <span className="text-slate-200">•</span>
                  <span>Category: {editingItem.category}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-start md:self-auto">
                <button
                  type="button"
                  onClick={handleBackClick}
                  className="h-11 px-5 rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-[12px] font-bold text-slate-655 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={triggerConfirmModal}
                  disabled={!isFormValid || isUpdating}
                  className={`h-11 px-6 rounded-xl text-[12px] font-extrabold transition-all shadow-md active:scale-95 flex items-center space-x-1.5 cursor-pointer ${
                    isFormValid
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none cursor-not-allowed'
                  }`}
                >
                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>

            {/* Sticky Unsaved Changes Alert bar */}
            {isDirty && (
              <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md shadow-amber-600/5 animate-slideDown">
                <div className="flex items-center space-x-2.5 text-amber-800">
                  <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse flex-shrink-0" />
                  <div className="text-left">
                    <span className="text-[12.5px] font-black">You have unsaved settings changes</span>
                    <p className="text-[10.5px] font-semibold text-amber-650">Low stock threshold changes have not been written to the database yet.</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={discardUnsavedChanges}
                    className="flex-1 sm:flex-initial h-9 px-4 rounded-xl border border-amber-300 text-amber-800 bg-white hover:bg-amber-50 text-[11.5px] font-bold transition-all cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={triggerConfirmModal}
                    className="flex-1 sm:flex-initial h-9 px-4.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11.5px] font-black shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {detailsLoading ? (
              <DetailPageSkeleton columns={2} />
            ) : (
              <>
                {/* Validation warning block */}
                {validationError && (
                  <div className="p-3.5 bg-red-50 border border-red-200/50 rounded-2xl flex items-center space-x-2 text-red-655 text-[12px] font-bold animate-pulse">
                    <AlertTriangle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Section 2: Inventory Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <div>
                      <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Current Stock</span>
                      <div className="text-2xl font-black text-slate-800 mt-1 leading-none">{editingItem.currentStock} Units</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <Boxes className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <div>
                      <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Available Stock</span>
                      <div className="text-2xl font-black text-blue-650 mt-1 leading-none">{(editingItem.currentStock - editingItem.reservedStock)} Units</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-650 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <div>
                      <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Reserved Stock</span>
                      <div className="text-2xl font-black text-slate-700 mt-1 leading-none">{editingItem.reservedStock} Units</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <div>
                      <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Sold Quantity</span>
                      <div className="text-2xl font-black text-slate-800 mt-1 leading-none">{editingItem.soldQty} Units</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Two Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Stock Management & Inventory Settings (lg:col-span-8) */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* Grid of current stock and threshold cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Current Stock Card */}
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3.5 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-slate-400">
                            <Package className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Current Stock</span>
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-450 border border-slate-200/50">
                            Read Only
                          </span>
                        </div>
                        <div>
                          <div className="text-2xl font-black text-slate-900 leading-none">{editingItem.currentStock} Units</div>
                          <div className="mt-2.5 flex items-center justify-start">
                            <InventoryStatusBadge status={editingItem.status} />
                          </div>
                        </div>
                      </div>

                      {/* Low Stock Threshold Card */}
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3.5 text-left">
                        <div className="flex items-center space-x-2 text-slate-400">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-wider">Low Stock Threshold</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="relative w-28 shrink-0">
                            <input
                              type="number"
                              min={0}
                              value={editThreshold}
                              onChange={e => {
                                setEditThreshold(parseInt(e.target.value) || 0);
                                setValidationError(null);
                              }}
                              className={`w-full h-10 px-3 bg-white border ${
                                validationError ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-200 hover:border-slate-350 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                              } focus:outline-none rounded-xl text-[13px] font-black text-slate-700 transition-all`}
                            />
                          </div>
                          <span className="text-[11px] font-extrabold text-slate-800">Units</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-semibold leading-normal">
                          When stock reaches this value, the product will be marked as Low Stock.
                        </p>
                      </div>
                    </div>

                    {/* Stock Adjustment Card */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6 text-left">
                      <div>
                        <h3 className="text-base font-black text-slate-900 tracking-tight">Stock Adjustment</h3>
                        <p className="text-[12px] text-slate-400 font-semibold mt-0.5">
                          Configure low-stock alert thresholds, supplier channels, and warehouse properties.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Quantity Selector: [-] 10 Units [+] */}
                        <div className="flex flex-col space-y-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Adjustment Quantity</span>
                          
                          <div className="flex items-center bg-white border border-slate-200 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10 rounded-xl h-12 shadow-sm overflow-hidden w-full sm:w-[220px]">
                            {/* Minus Button */}
                            <button
                              type="button"
                              disabled={adjustmentQty <= 1}
                              onClick={() => setAdjustmentQty(Math.max(1, adjustmentQty - 1))}
                              className="w-12 h-full flex items-center justify-center border-r border-slate-200 hover:bg-slate-50 text-slate-600 font-extrabold active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer select-none"
                            >
                              −
                            </button>
                            
                            {/* Centered Quantity Value & Units */}
                            <div className="flex-1 flex items-center justify-center space-x-1 px-2 h-full">
                              <input
                                type="number"
                                min={1}
                                value={adjustmentQty || ''}
                                onChange={e => setAdjustmentQty(Math.max(1, parseInt(e.target.value) || 0))}
                                className="w-12 text-center bg-transparent border-none text-[15px] font-black text-slate-800 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-[11px] font-extrabold text-slate-400 select-none">Units</span>
                            </div>

                            {/* Plus Button */}
                            <button
                              type="button"
                              onClick={() => setAdjustmentQty(adjustmentQty + 1)}
                              className="w-12 h-full flex items-center justify-center border-l border-slate-200 hover:bg-slate-50 text-slate-600 font-extrabold active:scale-95 transition-all cursor-pointer select-none"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Adjustment Reason */}
                        <div className="flex flex-col space-y-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Adjustment Reason</span>
                          <input
                            type="text"
                            value={adjustmentReason}
                            onChange={e => setAdjustmentReason(e.target.value)}
                            placeholder="e.g. Manual Restock, Correction"
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 hover:border-slate-350 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:outline-none rounded-xl text-[12.5px] font-bold text-slate-700 transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Action Buttons: Primary (Increase Stock - Green) / Secondary (Decrease Stock - Orange/Red) */}
                      <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <button
                          type="button"
                          disabled={isAdjusting || adjustmentQty <= 0}
                          onClick={() => triggerAdjustmentConfirm('increase')}
                          className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12.5px] font-extrabold shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          {isAdjusting && activeAdjType === 'increase' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          <span>Increase Stock</span>
                        </button>
                        <button
                          type="button"
                          disabled={isAdjusting || adjustmentQty <= 0 || editingItem.currentStock - adjustmentQty < 0}
                          onClick={() => triggerAdjustmentConfirm('decrease')}
                          className="flex-1 h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[12.5px] font-extrabold shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          {isAdjusting && activeAdjType === 'decrease' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          <span>Decrease Stock</span>
                        </button>
                      </div>

                      {/* Inline negative stock error validation messages */}
                      {editingItem.currentStock - adjustmentQty < 0 && (
                        <span className="text-[11px] font-bold text-red-500 pl-1 block">
                          Stock cannot become negative.
                        </span>
                      )}

                      {/* Compact New Stock Preview Card */}
                      <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-2 text-left">
                        <div className="flex items-center space-x-1.5 text-slate-400">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span className="text-[9.5px] font-black uppercase tracking-wider">Adjustment Preview</span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-[11.5px] font-bold text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">Current Stock:</span>
                            <span className="text-slate-800 font-extrabold">{editingItem.currentStock}</span>
                          </div>
                          
                          <span className="hidden sm:inline text-slate-350">|</span>
                          
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">If Increased:</span>
                            <span className="text-slate-850">{editingItem.currentStock}</span>
                            <span className="text-emerald-600">+{adjustmentQty}</span>
                            <span className="text-slate-350">→</span>
                            <span className="text-blue-600 font-black">{editingItem.currentStock + adjustmentQty} Units</span>
                          </div>

                          <span className="hidden sm:inline text-slate-350">|</span>
                          
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">If Decreased:</span>
                            <span className="text-slate-855">{editingItem.currentStock}</span>
                            <span className="text-orange-600">-{adjustmentQty}</span>
                            <span className="text-slate-355">→</span>
                            <span className="text-blue-600 font-black">
                              {Math.max(0, editingItem.currentStock - adjustmentQty)} Units
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Inventory Settings */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-5 text-left">
                      <div>
                        <h3 className="text-[14px] font-black text-slate-900">Inventory Settings</h3>
                        <p className="text-[11.5px] text-slate-400 font-semibold mt-0.5">
                          Configure low-stock alert thresholds, supplier channels, and warehouse properties.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1 block">Warehouse Location</span>
                          <select
                            value={selectedWarehouse}
                            onChange={e => setSelectedWarehouse(e.target.value)}
                            className="w-full h-12 px-3.5 bg-slate-50 border border-slate-200 hover:border-slate-350 focus:bg-white focus:border-blue-600 focus:outline-none rounded-2xl text-[12.5px] font-bold text-slate-700 transition-all cursor-pointer"
                          >
                            <option value="Main Warehouse">Main Warehouse (Floor A)</option>
                            <option value="North Facility">North Facility (Bay 4)</option>
                            <option value="East Coast Depot">East Coast Depot (Depot 12)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1 block">Supplier</span>
                          <select
                            value={selectedSupplier}
                            onChange={e => setSelectedSupplier(e.target.value)}
                            className="w-full h-12 px-3.5 bg-slate-50 border border-slate-200 hover:border-slate-350 focus:bg-white focus:border-blue-600 focus:outline-none rounded-2xl text-[12.5px] font-bold text-slate-700 transition-all cursor-pointer"
                          >
                            <option value="Apple Inc.">Apple Inc. (Direct)</option>
                            <option value="Samsung Logistics">Samsung Logistics</option>
                            <option value="Generic Wholesale Co.">Generic Wholesale Co.</option>
                          </select>
                        </div>

                        <div className="flex flex-col justify-center bg-slate-50/50 border border-slate-100 rounded-2xl px-4 py-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Computed Inventory Status</span>
                          <div className="mt-1 flex items-center justify-start">
                            <InventoryStatusBadge status={editingItem.status} />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 space-y-2">
                        <CustomSwitch
                          checked={enableTracking}
                          onChange={setEnableTracking}
                          label="Enable Inventory Tracking"
                          description="Monitor stock levels in real time and warn when low stock is reached"
                        />
                        <div className="border-b border-slate-50 my-1" />
                        <CustomSwitch
                          checked={allowBackorders}
                          onChange={setAllowBackorders}
                          label="Allow Backorders"
                          description="Customers can purchase this item even if stock levels drop below zero"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Sidebar summaries (lg:col-span-4) */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Real-time Summary Card */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 text-left">
                      <h3 className="text-[14px] font-black text-slate-900">Inventory Properties</h3>
                      <div className="border-t border-slate-50 pt-2.5 space-y-3.5 text-[11.5px] text-slate-655 font-semibold">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Current Status</span>
                          <span className="text-slate-800 font-bold capitalize">{editingItem.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Warehouse Location</span>
                          <span className="text-slate-800 font-bold">{selectedWarehouse}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Current Stock</span>
                          <span className="text-slate-800 font-bold">{editingItem.currentStock} Units</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Available Stock</span>
                          <span className="text-blue-600 font-bold">{editingItem.currentStock - editingItem.reservedStock} Units</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Reserved Quantity</span>
                          <span className="text-slate-800 font-bold">{editingItem.reservedStock} Units</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-2 text-[10px]">
                          <span className="text-slate-400">Last Synchronized</span>
                          <span className="text-slate-500">{new Date(editingItem.lastUpdated || '').toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Nested Confirmation Dialog modal */}
        {pendingConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 w-full max-w-sm shadow-xl space-y-4 text-left">
              <div className="flex items-center space-x-2.5 text-amber-500">
                <AlertTriangle className="w-5.5 h-5.5 animate-pulse" />
                <h3 className="text-[14px] font-black text-slate-900 leading-tight">Update Threshold?</h3>
              </div>
              
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-[11.5px] text-slate-655 font-semibold">
                <div>
                  <span className="text-slate-400">Product:</span>{' '}
                  <span className="font-extrabold text-slate-800">{pendingConfirm.item.name}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/55 pt-1.5">
                  <span className="text-slate-400">Current Threshold:</span>
                  <span className="text-slate-850 font-bold">{pendingConfirm.oldThreshold} Units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">New Threshold:</span>
                  <span className="text-blue-650 font-black">{pendingConfirm.newThreshold} Units</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 justify-end pt-1">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => setPendingConfirm(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-[12px] font-bold text-slate-655 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={confirmSaveChanges}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold rounded-xl transition-all shadow-md shadow-blue-600/25 active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                >
                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Confirm Update</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Discard Confirm Modal */}
        {showNavigationDiscardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 w-full max-w-sm shadow-xl space-y-4 text-left">
              <div className="flex items-center space-x-2.5 text-amber-500">
                <AlertTriangle className="w-5.5 h-5.5 animate-pulse" />
                <h3 className="text-[14px] font-black text-slate-900 leading-tight">Discard Unsaved Changes?</h3>
              </div>
              
              <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed">
                You have unsaved inventory configuration changes. Discarding will revert all settings.
              </p>

              <div className="flex items-center space-x-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowNavigationDiscardModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-[12px] font-bold text-slate-655 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNavigationDiscardModal(false);
                    discardUnsavedChanges();
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Adjustment Confirmation Dialog Modal */}
        {pendingAdjustmentConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 w-full max-w-sm shadow-xl space-y-4 text-left">
              <div className="flex items-center space-x-2.5 text-blue-600">
                <RefreshCw className="w-5 h-5 text-blue-650 animate-spin" style={{ animationDuration: '3s' }} />
                <h3 className="text-[14px] font-black text-slate-900 leading-tight">
                  {pendingAdjustmentConfirm.type === 'increase' ? 'Increase Stock?' : 'Decrease Stock?'}
                </h3>
              </div>
              
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-[11.5px] text-slate-655 font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-400">Action:</span>
                  <span className="text-slate-800 font-extrabold uppercase text-[10px]">
                    {pendingAdjustmentConfirm.type} Stock
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200/55 pt-1.5">
                  <span className="text-slate-400">Quantity to Adjust:</span>
                  <span className="text-blue-650 font-black">{pendingAdjustmentConfirm.quantity} Units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Stock:</span>
                  <span className="text-slate-850 font-bold">{pendingAdjustmentConfirm.currentStock} Units</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/55 pt-1.5">
                  <span className="text-slate-400">New Stock Level:</span>
                  <span className="text-emerald-650 font-black text-[12.5px]">{pendingAdjustmentConfirm.newStock} Units</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setPendingAdjustmentConfirm(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-[12px] font-bold text-slate-655 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAdjustmentCall}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminInventory;
