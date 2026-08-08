import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useClickOutside } from '../hooks/useClickOutside';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { MainLayout } from '../layouts/MainLayout';
import { Price } from '../components/ui/Price';
import { addToCartBackend } from '../store/cartSlice';
import toast from 'react-hot-toast';
import { orderService } from '../services/order.service';
import { productService } from '../services/product.service';
import {
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  Truck,
  Download,
  RefreshCw,
  MapPin,
  CreditCard,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Loader2
} from 'lucide-react';

import ssdImg from '../assets/products/samsung_t7_ssd.jpg';
import sleeveImg from '../assets/products/laptop_sleeve_leather.jpg';
import matImg from '../assets/products/premium_desk_mat.jpg';
import guideImg from '../assets/products/guide.jpg';
import { getImageUrl } from '../utils/imageHelper';
import { Rating } from '../components/ui/Rating';



const decodeJwtSub = (token: string): string | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload)?.sub || null;
  } catch (e) {
    return null;
  }
};

const formatDate = (isoString: string) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return isoString;
  }
};

const getTrackingSteps = (status: string, statusHistory: any[]) => {
  const stepsDef = [
    { label: 'Pending Payment', key: 'PENDING_PAYMENT' },
    { label: 'Processing', key: 'PROCESSING' },
    { label: 'Packed', key: 'PACKED' },
    { label: 'Shipped', key: 'SHIPPED' },
    { label: 'Out for Delivery', key: 'OUT_FOR_DELIVERY' },
    { label: 'Completed', key: 'DELIVERED' }
  ];

  const currentStatusUpper = status.toUpperCase().replace(/ /g, '_');
  let currentIdx = stepsDef.findIndex(step => 
    step.key === currentStatusUpper || 
    (step.key === 'PENDING_PAYMENT' && currentStatusUpper === 'PENDING')
  );

  const getHistoryItem = (key: string) => {
    return statusHistory.find((h: any) => String(h.status).toUpperCase() === key);
  };

  return stepsDef.map((step, idx) => {
    const histItem = getHistoryItem(step.key);
    const active = !!histItem || (currentIdx !== -1 && idx <= currentIdx);
    const date = histItem ? formatDate(histItem.timestamp) : (active ? 'Completed' : 'Expected soon');

    return {
      label: step.label,
      date,
      active
    };
  });
};

interface DropdownProps {
  label: string;
  selected: string;
  options: { value: string; label: string }[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelect: (value: string) => void;
}

const OrderFilterDropdown: React.FC<DropdownProps> = ({
  label,
  selected,
  options,
  isOpen,
  setIsOpen,
  onSelect
}) => {
  const activeLabel = options.find(o => o.value === selected)?.label || selected || label;
  const ref = useRef<HTMLDivElement | null>(null);
  
  useClickOutside(ref, () => {
    if (isOpen) setIsOpen(false);
  });

  return (
    <div ref={ref} className="relative text-left flex-1 sm:flex-none z-20 min-w-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-11 w-full sm:w-auto px-4 rounded-[10px] border text-slate-700 text-[12px] sm:text-[13px] font-bold transition-all flex items-center justify-between gap-2 shadow-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none cursor-pointer ${
          isOpen
            ? 'bg-slate-50/80 border-blue-600 ring-4 ring-blue-600/10'
            : 'bg-white hover:bg-slate-50/60 border-slate-200 hover:border-slate-350 shadow-slate-100/40'
        }`}
      >
        <span className="truncate">{label}: {activeLabel}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 sm:left-auto sm:right-0 mt-2 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 w-full sm:w-56 flex flex-col animate-fadeIn"
        >
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => {
                onSelect(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 text-[11px] sm:text-[12px] font-bold transition-colors hover:bg-slate-50 flex items-center justify-between border-none bg-transparent cursor-pointer ${
                selected === option.value ? 'text-blue-600 bg-blue-50/30' : 'text-slate-655'
              }`}
            >
              <span>{option.label}</span>
              {selected === option.value && <Check className="w-3.5 h-3.5 text-blue-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const Orders: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const payingOrderId = null;

  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All Orders');
  const [expandedMobileOrders, setExpandedMobileOrders] = useState<Record<string, boolean>>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  // Dropdown states
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('ALL');
  const [selectedSort, setSelectedSort] = useState('NEWEST');

  const [isOpenStatus, setIsOpenStatus] = useState(false);
  const [isOpenDate, setIsOpenDate] = useState(false);
  const [isOpenSort, setIsOpenSort] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('natcart_access_token') || localStorage.getItem('natcart_token');
      if (!token) {
        navigate('/login');
        return;
      }
      const userId = decodeJwtSub(token);
      if (!userId) {
        navigate('/login');
        return;
      }

      // Fetch user orders
      const userOrders = await orderService.getOrdersByUser(userId);
      setOrders(userOrders || []);

      // Also fetch catalog products to resolve potential recommendations dynamically
      const res = await productService.getProducts({ limit: 100 });
      const prodData = res.data || res.products || (Array.isArray(res) ? res : []);
      setCatalogProducts(prodData || []);

    } catch (err: any) {
      console.error('Error loading user orders:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to load orders.';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Load real orders from backend
  useEffect(() => {
    fetchOrders();
  }, [navigate]);

  const handlePayNow = (orderId: string) => {
    navigate(`/checkout?orderId=${orderId}`);
  };

  // Tab configurations
  const tabs = ['All Orders', 'In Transit', 'Delivered'];

  // Toggle package details expansion on mobile
  const toggleMobileOrderExpansion = (orderId: string) => {
    setExpandedMobileOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };



  // Add accessory to Redux cart
  const handleAddToCart = async (product: any) => {
    try {
      await dispatch(
        addToCartBackend({
          productId: product.id || product.productId,
          quantity: 1,
        })
      ).unwrap();
      toast.success(`${product.name} added to cart!`);
    } catch (err: any) {
      toast.error(err || 'Failed to add item to cart.');
    }
  };

  const handleBuyNow = async (product: any) => {
    try {
      await dispatch(
        addToCartBackend({
          productId: product.id || product.productId,
          quantity: 1,
        })
      ).unwrap();
      navigate('/cart');
    } catch (err: any) {
      navigate('/cart');
    }
  };

  // Format all backend orders to canonical list structures
  const ordersList = useMemo(() => {
    return orders.map(ord => {
      const items = ord.items || [];
      const mainItem = items[0] || {};
      
      const name = mainItem.name
        ? `${mainItem.name}${items.length > 1 ? ` + ${items.length - 1} more` : ''}`
        : 'Tech Purchase';

      const image = getImageUrl(mainItem);
      const brand = mainItem.brand || 'Premium';
      const ram = mainItem.specifications?.ram || mainItem.specifications?.RAM || '';
      const storage = mainItem.specifications?.storage || mainItem.specifications?.Storage || '';
      const specs = ram && storage ? `${brand} • ${ram}, ${storage}` : `${brand} • Standard`;

      const placedDate = formatDate(ord.createdAt);
      const trackingSteps = getTrackingSteps(ord.orderStatus || 'Pending Payment', ord.statusHistory || []);

      const shippingAddress = {
        name: ord.shippingAddress?.fullName || 'Customer',
        address: ord.shippingAddress?.address || 'Standard Shipping',
        cityStateZip: `${ord.shippingAddress?.city || ''}, ${ord.shippingAddress?.state || ''} - ${ord.shippingAddress?.pincode || ''}`
      };

      const paymentSummary = {
        subtotal: ord.totalAmount,
        shipping: 0,
        total: ord.totalAmount
      };

      let displayStatus = ord.orderStatus || 'Pending';
      if (['PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(String(ord.orderStatus).toUpperCase())) {
        displayStatus = 'In Transit';
      } else if (String(ord.orderStatus).toUpperCase() === 'DELIVERED') {
        displayStatus = 'Completed';
      }

      return {
        id: ord.orderId,
        displayId: ord.displayId || ord.orderId,
        placedDate,
        deliveredDate: ['DELIVERED', 'COMPLETED'].includes(String(ord.orderStatus).toUpperCase()) ? formatDate(ord.updatedAt) : null,
        status: displayStatus,
        quantity: items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0),
        price: ord.totalAmount,
        name,
        specs,
        image,
        trackingSteps,
        shippingAddress,
        paymentSummary,
        rawItems: items,
        paymentMethod: ord.paymentMethod || 'Card',
        paymentStatus: ord.paymentStatus || 'Pending',
        couponCode: ord.couponCode,
        discountAmount: ord.discountAmount
      };
    });
  }, [orders]);

  const ordMap = useMemo(() => {
    const map: Record<string, any> = {};
    orders.forEach(o => { map[o.orderId] = o; });
    return map;
  }, [orders]);

  // Filter and sort logic
  const filteredOrders = useMemo(() => {
    let result = [...ordersList];

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(order =>
        order.id.toLowerCase().includes(q) ||
        order.name.toLowerCase().includes(q)
      );
    }

    // Horizontal Tab filter (All, In Transit, Delivered)
    if (activeTab === 'In Transit') {
      result = result.filter(order => order.status === 'In Transit');
    } else if (activeTab === 'Delivered') {
      result = result.filter(order => ['Delivered', 'Completed'].includes(order.status));
    }

    // Dropdown Status Filter
    if (selectedStatus !== 'ALL') {
      const matchStatus = selectedStatus.replace(/_/g, ' ').toUpperCase();
      result = result.filter(order => {
        const rawOrd = ordMap[order.id];
        if (!rawOrd) return false;
        const rawStatusUpper = String(rawOrd.orderStatus || '').toUpperCase();
        
        if (matchStatus === 'PENDING PAYMENT') {
          return rawStatusUpper === 'PENDING PAYMENT' || rawStatusUpper === 'PENDING';
        }
        if (matchStatus === 'IN TRANSIT') {
          return ['PROCESSING', 'PACKED', 'SHIPPED', 'OUT FOR DELIVERY', 'OUT_FOR_DELIVERY', 'OUT_FOR_DELIVERY'].includes(rawStatusUpper);
        }
        if (matchStatus === 'DELIVERED') {
          return rawStatusUpper === 'DELIVERED';
        }
        if (matchStatus === 'CANCELLED') {
          return rawStatusUpper === 'CANCELLED';
        }
        if (matchStatus === 'PAYMENT_FAILED') {
          return rawStatusUpper === 'PAYMENT_FAILED' || rawStatusUpper === 'FAILED';
        }
        return rawStatusUpper === matchStatus;
      });
    }

    // Dropdown Date Filter
    if (selectedDate !== 'ALL') {
      const now = new Date();
      result = result.filter(order => {
        if (!order.id) return false;
        const rawOrd = ordMap[order.id];
        if (!rawOrd || !rawOrd.createdAt) return false;
        const placed = new Date(rawOrd.createdAt);
        const diffMs = now.getTime() - placed.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (selectedDate === '30_DAYS') return diffDays <= 30;
        if (selectedDate === '3_MONTHS') return diffDays <= 90;
        if (selectedDate === '6_MONTHS') return diffDays <= 180;
        if (selectedDate === 'THIS_YEAR') return placed.getFullYear() === now.getFullYear();
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      const rawA = ordMap[a.id];
      const rawB = ordMap[b.id];
      const dateA = rawA && rawA.createdAt ? new Date(rawA.createdAt).getTime() : 0;
      const dateB = rawB && rawB.createdAt ? new Date(rawB.createdAt).getTime() : 0;

      if (selectedSort === 'NEWEST') return dateB - dateA;
      if (selectedSort === 'OLDEST') return dateA - dateB;
      if (selectedSort === 'PRICE_DESC') return b.price - a.price;
      if (selectedSort === 'PRICE_ASC') return a.price - b.price;
      return 0;
    });

    return result;
  }, [ordersList, orders, ordMap, searchQuery, activeTab, selectedStatus, selectedDate, selectedSort]);

  // Accessories list (Frequently Bought Together) dynamically resolved from catalog database
  const accessories = useMemo(() => {
    const defaultAccs = [
      { id: 'acc-sleeve', name: 'ProLeather Shield 14"', price: 8900, listPrice: 11900, image: sleeveImg, specs: 'Premium Leather', category: 'Accessories', brand: 'Premium', discount: 25, stock: 5 },
      { id: 'acc-dock', name: 'CoreLink Multi-Dock', price: 14900, listPrice: 17900, image: ssdImg, specs: '10-in-1 Hub', category: 'Accessories', brand: 'Premium', discount: 16, stock: 5 },
      { id: 'acc-mat', name: 'TypeFlow Mechanical Air', price: 19900, listPrice: 24900, image: matImg, specs: 'Wireless Mechanical', category: 'Accessories', brand: 'Premium', discount: 20, stock: 5 },
      { id: 'acc-kit', name: 'NanoClear Display Kit', price: 2900, listPrice: 3900, image: guideImg, specs: 'Microfiber & Spray', category: 'Accessories', brand: 'Premium', discount: 25, stock: 5 }
    ];

    if (catalogProducts.length === 0) return defaultAccs;

    return catalogProducts.slice(0, 4).map((prod, idx) => {
      const def = defaultAccs[idx] || defaultAccs[0];
      const image = getImageUrl(prod);
      const ram = prod.specifications?.ram || prod.specifications?.RAM || prod.ram || 'Standard';
      const storage = prod.specifications?.storage || prod.specifications?.Storage || prod.storage || 'Standard';
      const listPrice = prod.listPrice || (prod.discount ? Math.round(prod.price / (1 - prod.discount / 100)) : prod.price);

      return {
        id: prod.productId || prod.id,
        name: prod.name,
        price: prod.price,
        listPrice,
        image,
        specs: ram && storage ? `${ram}, ${storage}` : (ram || storage || def.specs),
        category: prod.category || 'Accessories',
        discount: prod.discount || 0,
        stock: prod.stock !== undefined ? prod.stock : 10,
        originalProduct: prod,
        brand: prod.brand || 'Accessories'
      };
    });
  }, [catalogProducts]);

  // Computed status stats widgets values
  const statsWidget = useMemo(() => {
    const total = ordersList.length;
    const delivered = ordersList.filter(o => ['Delivered', 'Completed'].includes(o.status)).length;
    const pending = total - delivered;
    return { total, delivered, pending };
  }, [ordersList]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto flex flex-col items-stretch space-y-8 select-none text-left animate-pulse">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center space-x-2 text-[10.5px] font-bold text-slate-455">
            <div className="h-3.5 w-10 bg-slate-200 rounded" />
            <div className="h-3.5 w-3 bg-slate-300/50" />
            <div className="h-3.5 w-16 bg-slate-200 rounded" />
            <div className="h-3.5 w-3 bg-slate-300/50" />
            <div className="h-3.5 w-16 bg-slate-200 rounded" />
          </div>

          {/* Header Title */}
          <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-7 w-40 bg-slate-300 rounded" />
              <div className="h-3.5 w-60 bg-slate-200 rounded" />
            </div>
            <div className="flex space-x-2">
              <div className="h-9 w-20 bg-slate-100 rounded-xl" />
              <div className="h-9 w-20 bg-slate-100 rounded-xl" />
            </div>
          </div>

          {/* Tabs & Search controls */}
          <div className="space-y-4">
            <div className="flex space-x-2 pb-2">
              <div className="h-8 w-24 bg-slate-200 rounded-full" />
              <div className="h-8 w-24 bg-slate-105 rounded-full" />
              <div className="h-8 w-24 bg-slate-105 rounded-full" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="h-10 flex-grow bg-slate-105 rounded-xl" />
              <div className="h-10 w-24 bg-slate-105 rounded-xl" />
            </div>
          </div>

          {/* Skeletons list */}
          <div className="space-y-5">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="bg-white border border-slate-200/50 rounded-3xl p-6 space-y-5 shadow-sm shimmer-sweep">
                {/* Header card metadata */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div className="flex space-x-4">
                    <div className="h-4.5 w-24 bg-slate-300 rounded" />
                    <div className="h-4.5 w-20 bg-slate-200 rounded" />
                  </div>
                  <div className="h-5 w-24 bg-slate-300 rounded-full" />
                </div>
                {/* Details layout */}
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-2xl flex-shrink-0" />
                  <div className="space-y-2 flex-grow">
                    <div className="h-4.5 w-48 bg-slate-300 rounded" />
                    <div className="h-3 w-32 bg-slate-200 rounded" />
                  </div>
                  <div className="h-5 w-20 bg-slate-300 rounded" />
                </div>
                {/* Timeline visual */}
                <div className="h-12 w-full bg-slate-100 rounded-2xl" />
                {/* Actions footer */}
                <div className="flex justify-end space-x-3.5 pt-4 border-t border-slate-100">
                  <div className="h-9 w-28 bg-slate-200 rounded-lg" />
                  <div className="h-9 w-28 bg-slate-200 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'PENDING_PAYMENT', label: 'Pending Payment' },
    { value: 'IN_TRANSIT', label: 'In Transit' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'PAYMENT_FAILED', label: 'Payment Failed' }
  ];

  const dateOptions = [
    { value: 'ALL', label: 'All Time' },
    { value: '30_DAYS', label: 'Last 30 Days' },
    { value: '3_MONTHS', label: 'Last 3 Months' },
    { value: '6_MONTHS', label: 'Last 6 Months' },
    { value: 'THIS_YEAR', label: 'This Year' }
  ];

  const sortOptions = [
    { value: 'NEWEST', label: 'Newest First' },
    { value: 'OLDEST', label: 'Oldest First' },
    { value: 'PRICE_DESC', label: 'Price: High to Low' },
    { value: 'PRICE_ASC', label: 'Price: Low to High' }
  ];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-1 sm:px-4 space-y-6">
        
        {/* Breadcrumb Path */}
        <nav className="text-[11px] font-black text-slate-450 uppercase tracking-widest flex items-center space-x-1.5 justify-start select-none">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span>&gt;</span>
          <span className="hover:text-blue-600 transition-colors cursor-pointer">Account</span>
          <span>&gt;</span>
          <span className="text-slate-900">My Orders</span>
        </nav>

        {ordersList.length > 0 ? (
          /* Active Loaded State Layout */
          <>
            {/* Desktop-only Header Dashboard Row */}
            <div className="hidden sm:flex items-center justify-between text-left">
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Orders</h1>
                <p className="text-xs text-slate-500 font-semibold">View, track, manage, and review all your purchases.</p>
              </div>

              {/* Status Stats Widgets */}
              <div className="flex items-center space-x-3.5">
                <div className="bg-white border border-slate-200/60 rounded-2xl px-5 py-2.5 flex flex-col items-start min-w-[80px] shadow-sm select-none">
                  <span className="text-[9px] font-black text-slate-455 uppercase tracking-wider">Total</span>
                  <span className="text-base font-black text-blue-600 mt-0.5">{statsWidget.total}</span>
                </div>
                <div className="bg-white border border-slate-200/60 rounded-2xl px-5 py-2.5 flex flex-col items-start min-w-[80px] shadow-sm select-none">
                  <span className="text-[9px] font-black text-slate-455 uppercase tracking-wider">Delivered</span>
                  <span className="text-base font-black text-green-650 mt-0.5">{statsWidget.delivered}</span>
                </div>
                <div className="bg-white border border-slate-200/60 rounded-2xl px-5 py-2.5 flex flex-col items-start min-w-[80px] shadow-sm select-none">
                  <span className="text-[9px] font-black text-slate-455 uppercase tracking-wider">Pending</span>
                  <span className="text-base font-black text-blue-600 mt-0.5">{statsWidget.pending}</span>
                </div>
              </div>
            </div>

            {/* Filters Navigation Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
              {/* Horizontal Tabs selector */}
              <div className="flex items-center space-x-2.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-5 py-2 rounded-full text-xs font-black tracking-wide cursor-pointer transition-all border shrink-0",
                      activeTab === tab
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Search and Dropdowns Filter Row */}
            <div className="bg-slate-50/45 border border-slate-200/50 rounded-[20px] p-3 flex flex-col md:flex-row md:items-center justify-between gap-3.5 select-none">
              {/* Search input container */}
              <div className="relative w-full md:w-80 flex-shrink-0">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Order ID or Product Name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 border border-slate-200 rounded-[10px] pl-10 pr-4 text-[13px] font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all bg-white shadow-sm"
                />
              </div>

              {/* Dropdowns container */}
              <div className="flex flex-row items-center gap-3 w-full md:w-auto">
                <OrderFilterDropdown
                  label="Status"
                  selected={selectedStatus}
                  options={statusOptions}
                  isOpen={isOpenStatus}
                  setIsOpen={(open) => {
                    setIsOpenStatus(open);
                    if (open) { setIsOpenDate(false); setIsOpenSort(false); }
                  }}
                  onSelect={setSelectedStatus}
                />

                <OrderFilterDropdown
                  label="Date"
                  selected={selectedDate}
                  options={dateOptions}
                  isOpen={isOpenDate}
                  setIsOpen={(open) => {
                    setIsOpenDate(open);
                    if (open) { setIsOpenStatus(false); setIsOpenSort(false); }
                  }}
                  onSelect={setSelectedDate}
                />

                <OrderFilterDropdown
                  label="Sort"
                  selected={selectedSort}
                  options={sortOptions}
                  isOpen={isOpenSort}
                  setIsOpen={(open) => {
                    setIsOpenSort(open);
                    if (open) { setIsOpenStatus(false); setIsOpenDate(false); }
                  }}
                  onSelect={setSelectedSort}
                />
              </div>
            </div>

            {/* Orders Listing Grid */}
            <div className="space-y-5">
              {filteredOrders.length > 0 ? (
                searchQuery.trim() !== '' ? (
                  /* Compact search results table */
                  <div className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11.5px] border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            <th className="px-6 py-4 font-black">Order</th>
                            <th className="px-6 py-4 font-black">Order ID</th>
                            <th className="px-6 py-4 font-black">Date Placed</th>
                            <th className="px-6 py-4 font-black">Total</th>
                            <th className="px-6 py-4 font-black text-center">Status</th>
                            <th className="px-6 py-4 font-black text-right pr-6">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                              {/* Order Image + Title */}
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3.5 max-w-[280px]">
                                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1.5 flex-shrink-0">
                                    <img src={order.image} alt={order.name} className="w-full h-full object-contain" />
                                  </div>
                                  <div className="truncate font-bold text-slate-800 tracking-tight">
                                    {order.name}
                                  </div>
                                </div>
                              </td>
                              {/* Order ID */}
                              <td className="px-6 py-4 font-mono font-bold text-blue-650">
                                #{order.displayId || order.id}
                              </td>
                              {/* Date */}
                              <td className="px-6 py-4 text-slate-500 font-semibold">
                                {order.placedDate}
                              </td>
                              {/* Total Price */}
                              <td className="px-6 py-4 font-black text-slate-800">
                                <Price value={order.paymentSummary.total} />
                              </td>
                              {/* Status Badge */}
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                  ['Delivered', 'Completed'].includes(order.status)
                                    ? 'bg-emerald-55 border-emerald-100 text-emerald-700 font-extrabold'
                                    : order.status === 'Cancelled'
                                    ? 'bg-rose-50 border-rose-100 text-rose-600 font-extrabold'
                                    : 'bg-blue-50 border border-blue-100/50 text-blue-600 font-extrabold'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              {/* Actions */}
                              <td className="px-6 py-4 text-right pr-6">
                                <div className="flex items-center justify-end space-x-2">
                                  {order.status === 'Pending Payment' && (
                                    <button
                                      onClick={() => handlePayNow(order.id)}
                                      className="h-7 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black tracking-wider uppercase transition-all shadow-sm shadow-amber-500/10 active:scale-95 cursor-pointer border-none"
                                    >
                                      Pay Now
                                    </button>
                                  )}
                                  <Link
                                    to={`/orders/${order.id}`}
                                    className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black tracking-wider uppercase transition-all shadow-sm shadow-blue-600/10 active:scale-95 flex items-center justify-center cursor-pointer"
                                  >
                                    View
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <React.Fragment key={order.id}>

                    
                    {/* Desktop Card Layout */}
                    <div className="hidden sm:flex bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex-col space-y-6 text-left">
                      
                      {/* Order Details Header */}
                      <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100/80 flex items-center justify-center p-2.5 flex-shrink-0">
                            <img src={order.image} alt={order.name} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-900 tracking-tight">{order.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span>Order ID: <b className="text-blue-650">#{order.displayId || order.id}</b></span>
                              <span>•</span>
                              <span>{order.placedDate}</span>
                              {order.couponCode && (
                                <>
                                  <span>•</span>
                                  <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[9.5px] font-extrabold tracking-wide border border-emerald-100 uppercase font-mono">
                                    <Tag className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>Coupon Applied: {order.couponCode}</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status tag & tracking buttons */}
                        <div className="flex items-center space-x-3">
                          <span
                            className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-black tracking-wider uppercase flex items-center space-x-1.5",
                              ['Delivered', 'Completed'].includes(order.status)
                                ? "bg-green-50 text-green-755 border border-green-100/60"
                                : "bg-blue-50 text-blue-755 border border-blue-100/60"
                            )}
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>{order.status}</span>
                          </span>
                          <span className="text-[10px] font-black text-slate-455">Qty: {order.quantity}</span>
                          <span className="text-xs font-black text-slate-950 ml-2">
                            <Price value={order.price} />
                          </span>
                        </div>
                      </div>

                      {/* Content block: Tracking steps timeline, shipping details, total summary */}
                      <div className="grid grid-cols-12 gap-8">
                        {/* Left Side: Live Tracking Line Progress */}
                        <div className="col-span-7 flex flex-col justify-center space-y-4">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tracking Status</span>
                          
                          {/* Progress Nodes Row */}
                          <div className="flex items-center justify-between relative mt-2 px-1 select-none">
                            {/* Horizontal joining connector bar background */}
                            <div className="absolute top-[13px] left-3 right-3 h-[2.5px] bg-slate-100 z-0" />
                            
                            {/* Horizontal active colored connector path */}
                            <div
                              className="absolute top-[13px] left-3 h-[2.5px] bg-blue-600 transition-all duration-500 z-0"
                              style={{
                                width: `${(() => {
                                  const lastActiveIdx = order.trackingSteps.reduce((last: number, step: any, idx: number) => step.active ? idx : last, 0);
                                  return (lastActiveIdx / (order.trackingSteps.length - 1)) * 100;
                                })()}%`
                              }}
                            />

                            {/* Tracking nodes mapping */}
                            {order.trackingSteps.map((step, idx) => (
                              <div key={idx} className="flex flex-col items-center space-y-2 relative z-10">
                                {/* Circular Node */}
                                <div
                                  className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                    step.active
                                      ? "border-blue-600 bg-blue-600 text-white"
                                      : "border-slate-200 bg-white text-slate-300"
                                  )}
                                >
                                  {step.active ? (
                                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                                  ) : (
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                  )}
                                </div>
                                {/* Meta details label */}
                                <div className="text-center">
                                  <div className="text-[10px] font-black text-slate-800 tracking-tight leading-none">{step.label}</div>
                                  <div className="text-[8px] text-slate-400 font-semibold mt-1 whitespace-nowrap">{step.date}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Middle: Shipping Details & Payment Invoice summary */}
                        <div className="col-span-5 border-l border-slate-100 pl-8 grid grid-cols-2 gap-6">
                          
                          {/* Shipping address details */}
                          <div className="space-y-2 text-left">
                            <div className="flex items-center space-x-1.5 text-[9px] font-black text-slate-450 uppercase tracking-wider">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>Shipping Address</span>
                            </div>
                            <div className="text-[11px] space-y-0.5">
                              <div className="font-extrabold text-slate-800">{order.shippingAddress.name}</div>
                              <div className="text-slate-500 font-semibold">{order.shippingAddress.address}</div>
                              <div className="text-slate-500 font-semibold">{order.shippingAddress.cityStateZip}</div>
                            </div>
                          </div>

                          {/* Payment price aggregate summaries */}
                          <div className="space-y-2 text-left">
                            <div className="flex items-center space-x-1.5 text-[9px] font-black text-slate-455 uppercase tracking-wider">
                              <CreditCard className="w-3 h-3 text-slate-400" />
                              <span>Payment Summary</span>
                            </div>
                            <div className="text-[10.5px] space-y-1.5 font-bold">
                              <div className="flex justify-between text-slate-500">
                                <span>Subtotal</span>
                                <Price value={order.paymentSummary.subtotal} />
                              </div>
                              <div className="flex justify-between text-slate-500">
                                <span>Shipping</span>
                                <span className="text-green-600">Free</span>
                              </div>
                              <div className="flex justify-between text-slate-850 font-black border-t border-slate-100 pt-1.5">
                                <span>Total</span>
                                <Price value={order.paymentSummary.total} />
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Card Footer Options */}
                      <div className="border-t border-slate-100 pt-4 flex items-center justify-between select-none">
                        <div className="flex items-center space-x-2">
                          <button className="flex items-center space-x-1.5 text-[10px] font-black text-slate-450 hover:text-slate-700 transition-colors cursor-pointer bg-transparent border-none">
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Invoice</span>
                          </button>
                        </div>

                        <div className="flex items-center space-x-3">
                          {['Delivered', 'Completed'].includes(order.status) ? (
                            <>
                              <button
                                onClick={() => navigate(`/orders/${order.id}`)}
                                className="h-9 px-5 rounded-full border border-slate-200 text-[10px] font-black text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer active:scale-95"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  if (order.rawItems && order.rawItems.length > 0) {
                                    order.rawItems.forEach((it: any) => {
                                      dispatch(
                                        addToCartBackend({
                                          productId: it.productId,
                                          quantity: it.quantity,
                                        })
                                      );
                                    });
                                  }
                                }}
                                className="h-9 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 shadow transition-colors cursor-pointer active:scale-95"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Buy Again</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => navigate(`/orders/${order.id}`)}
                                className="h-9 px-5 rounded-full border border-slate-200 text-[10px] font-black text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer active:scale-95"
                              >
                                Details
                              </button>
                              {String(order.paymentStatus).toUpperCase() !== 'PAID' && 
                               String(order.status).toUpperCase() !== 'CANCELLED' && 
                               String(order.status).toUpperCase() !== 'EXPIRED' && (
                                <button
                                  disabled={payingOrderId !== null}
                                  onClick={() => handlePayNow(order.id)}
                                  className="h-9 px-6 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 shadow transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                                >
                                  {payingOrderId === order.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CreditCard className="w-3.5 h-3.5" />
                                  )}
                                  <span>Pay Now</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Mobile Card Layout (Screenshot 1 replica) */}
                    <div className="block sm:hidden bg-white border border-slate-200/60 rounded-3xl p-4.5 shadow-sm space-y-4 text-left">
                      
                      {/* Card Header Row */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <div className="text-xs font-black text-slate-800">Order #{order.displayId || order.id}</div>
                          <div className="text-[10px] text-slate-450 font-bold">Placed on {order.placedDate}</div>
                          {order.couponCode && (
                            <div className="pt-1 select-none">
                              <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-extrabold border border-emerald-100 uppercase font-mono">
                                <Tag className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Applied: {order.couponCode}</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Status badge */}
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[9px] font-black flex items-center space-x-1",
                            ['Delivered', 'Completed'].includes(order.status)
                              ? "bg-green-50 text-green-700"
                              : "bg-blue-50 text-blue-700"
                          )}
                        >
                          <Truck className="w-3 h-3 flex-shrink-0" />
                          <span>{order.status}</span>
                        </span>
                      </div>

                      {/* Product capsule representation */}
                      <div className="bg-slate-50/50 border border-slate-100/60 rounded-2xl p-3 flex items-center space-x-3.5">
                        <div className="w-14 h-14 rounded-xl bg-white border border-slate-100 flex items-center justify-center p-2 flex-shrink-0">
                          <img src={order.image} alt={order.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-black text-slate-850 truncate">{order.name}</div>
                          <div className="text-[10px] text-slate-455 font-bold mt-0.5 truncate">{order.specs}</div>
                          <Price value={order.price} className="text-xs font-black text-slate-900 mt-1.5 block" />
                        </div>
                      </div>
                      {/* Expandable Package Tracker */}
                      <div className="border-t border-b border-slate-100/80 py-2.5">
                        <button
                          onClick={() => toggleMobileOrderExpansion(order.id)}
                          className="w-full flex items-center justify-between text-xs font-black text-blue-600 hover:text-blue-800 focus:outline-none bg-transparent border-none cursor-pointer"
                        >
                          <span>Track Package</span>
                          {expandedMobileOrders[order.id] ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        {expandedMobileOrders[order.id] && (
                          <div className="mt-4 pl-3 space-y-6 relative">
                            {order.trackingSteps.map((step, idx) => {
                              const showActiveLine = step.active && idx < order.trackingSteps.length - 1 && order.trackingSteps[idx + 1].active;
                              return (
                                <div key={idx} className="flex items-start space-x-3.5 relative">
                                  {idx < order.trackingSteps.length - 1 && (
                                    <div
                                      className={cn(
                                        "absolute left-2.5 top-5 h-7.5 w-[2px] -translate-x-1/2 z-0",
                                        showActiveLine ? "bg-blue-600" : "bg-slate-100"
                                      )}
                                    />
                                  )}
                                  
                                  <div
                                    className={cn(
                                      "w-5 h-5 rounded-full border flex items-center justify-center z-10 transition-colors duration-300 flex-shrink-0",
                                      step.active
                                        ? "border-blue-600 bg-blue-600 text-white"
                                        : "border-slate-200 bg-white text-slate-350"
                                    )}
                                  >
                                    {step.active ? (
                                      <Check className="w-2.5 h-2.5 stroke-[3.5px]" />
                                    ) : (
                                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                    )}
                                  </div>
                                  
                                  <div className="text-left leading-tight">
                                    <div className="text-[11px] font-black text-slate-800">{step.label}</div>
                                    <div className="text-[9.5px] text-slate-455 font-bold mt-0.5">{step.date}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Mobile action buttons footer block */}
                      <div className="flex items-center space-x-3 select-none">
                        {['Delivered', 'Completed'].includes(order.status) ? (
                          <>
                            <button
                              onClick={() => {
                                if (order.rawItems && order.rawItems.length > 0) {
                                  order.rawItems.forEach((it: any) => {
                                    dispatch(
                                      addToCartBackend({
                                        productId: it.productId,
                                        quantity: it.quantity,
                                      })
                                    );
                                  });
                                }
                              }}
                              className="flex-grow h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center shadow cursor-pointer active:scale-95 border-none"
                            >
                              BUY AGAIN
                            </button>
                            <button
                              onClick={() => navigate(`/orders/${order.id}`)}
                              className="h-12 px-6 rounded-2xl border border-slate-200/85 bg-white text-xs font-black text-slate-750 hover:bg-slate-50 transition-colors cursor-pointer active:scale-95 shadow-sm"
                            >
                              Details
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => navigate(`/orders/${order.id}`)}
                              className="flex-grow h-12 rounded-2xl border border-slate-200/85 bg-white text-xs font-black text-slate-755 hover:bg-slate-50 transition-colors cursor-pointer active:scale-95 shadow-sm"
                            >
                              Details
                            </button>
                            {String(order.paymentStatus).toUpperCase() !== 'PAID' && 
                             String(order.status).toUpperCase() !== 'CANCELLED' && 
                             String(order.status).toUpperCase() !== 'EXPIRED' && (
                              <button
                                disabled={payingOrderId !== null}
                                onClick={() => handlePayNow(order.id)}
                                className="flex-grow h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow transition-colors cursor-pointer active:scale-95 border-none disabled:opacity-50"
                              >
                                {payingOrderId === order.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                                ) : (
                                  <CreditCard className="w-4 h-4 text-white" />
                                )}
                                <span>PAY NOW</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>


                    </React.Fragment>
                  ))
                )
              ) : (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-12 text-center text-slate-500">
                  No orders matched your search query.
                </div>
              )}
            </div>

            {/* Bottom Accessories Recommendations section */}
            <div className="space-y-4 pt-6 text-left">
              <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-100">
                <Sparkles className="w-4.5 h-4.5 text-blue-655" />
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Accessories for your Tech
                </h3>
                <span className="text-[10px] text-slate-400 font-bold ml-1 hidden sm:inline">Based on your recent NeuralPro purchase</span>
              </div>

              {/* Slider grid layout */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
                {accessories.map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => navigate(`/product/${acc.id}`)}
                    className="group relative bg-white border border-slate-200/60 rounded-[30px] p-4 flex flex-col justify-between hover:shadow-[0_24px_50px_rgba(15,23,42,0.04)] hover:-translate-y-1 transition-all duration-350 select-none text-left cursor-pointer"
                  >
                    {/* Thumbnail box */}
                    <div className="relative aspect-[4/3] w-full rounded-[22px] overflow-hidden bg-slate-50/70 p-2 sm:p-2.5 flex items-center justify-center mb-4">
                      <img
                        src={acc.image}
                        alt={acc.name}
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-col flex-grow justify-between text-left">
                      <div className="space-y-1.5">
                        <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest leading-none block">{acc.brand}</span>
                        <h3 className="text-[13.5px] font-black text-slate-900 tracking-tight leading-snug mt-1 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[36px]">
                          {acc.name}
                        </h3>
                        
                        {/* Rating row (custom Accessory placeholder since reviews is omitted on Orders page) */}
                        <div className="flex items-center space-x-1 pt-1">
                          <Rating value={5} readOnly size="sm" />
                          <span className="text-[10.5px] text-slate-800 font-bold ml-1.5">(0)</span>
                        </div>

                        {/* Price Section below the name */}
                        <div className="flex items-center flex-wrap gap-1.5">
                          <Price value={acc.price} className="text-[15px] font-black text-slate-900 leading-none" />
                          {acc.listPrice && acc.listPrice > acc.price && (
                            <>
                              <Price value={acc.listPrice} className="text-[11px] text-slate-400 line-through font-semibold leading-none ml-1" />
                              <span className="px-1.5 py-0.5 rounded-[5px] bg-emerald-50 text-[9px] font-extrabold text-emerald-600 border border-emerald-100/50 uppercase tracking-wider leading-none">
                                {acc.discount}% OFF
                              </span>
                            </>
                          )}
                        </div>

                        {/* Category Tag under the price */}
                        {acc.category && (
                          <div className="flex pt-1">
                            <span className="px-2 py-0.5 rounded bg-blue-50/60 text-[9px] font-bold text-blue-700 border border-blue-100/40 uppercase tracking-wider">
                              {acc.category}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="border-t border-slate-100/80 my-3" />
                        <div className="flex items-center space-x-2 w-full flex-shrink-0">
                          {/* Cart Icon Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(acc);
                            }}
                            className="w-10 h-8 rounded-lg bg-slate-50 border border-slate-200/50 hover:bg-slate-100 hover:border-slate-300 text-slate-700 flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm"
                            title="Add to Cart"
                          >
                            <ShoppingCart className="w-4 h-4 stroke-[2.2px]" />
                          </button>
                          {/* Buy Now Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuyNow(acc);
                            }}
                            className="h-8 flex-grow rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm border-none"
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Empty orders dashboard layout (Screenshot 2) */
          <div className="w-full py-12 flex flex-col items-center justify-center text-center space-y-12">
            
            {/* Box package vector container */}
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                {/* Visual state marker */}
                <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-blue-50 text-blue-700 border border-blue-100/60 text-[9px] font-extrabold rounded-full px-2.5 py-0.5 flex items-center space-x-1 whitespace-nowrap shadow-sm">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  <span>My Orders</span>
                </div>

                {/* Container card with empty orders icon */}
                <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-[32px] bg-white border border-slate-200/70 flex items-center justify-center shadow-lg relative overflow-hidden group p-6">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Visual Orders folder vector */}
                  <div className="relative w-full h-full rounded-2xl bg-blue-50/40 border border-blue-100/50 flex flex-col items-center justify-center p-4 text-blue-600">
                    <ShoppingBag className="w-16 h-16 stroke-[1.2px]" />
                    <span className="text-[10px] font-black tracking-widest uppercase mt-3">No Active Orders</span>
                    <span className="text-[8.5px] text-slate-400 font-bold mt-1 max-w-[120px] leading-tight">
                      Explore the shop items to place orders
                    </span>
                  </div>
                </div>
              </div>

              {/* Title & subtitle details */}
              <div className="space-y-2 max-w-md mt-3 px-4">
                <h2 className="text-xl font-black text-slate-855 tracking-tight">No Orders Yet</h2>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  You haven't placed any orders yet. Start exploring our premium tech collection and discover premium hardware designed for the future.
                </p>
              </div>
            </div>

            {/* Empty state CTA options */}
            <div className="flex items-center space-x-4 select-none">
              <button
                onClick={() => navigate('/')}
                className="h-11 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
              >
                Start Shopping
              </button>
              <button
                onClick={() => navigate('/')}
                className="h-11 px-6 rounded-full border border-slate-200 bg-white text-slate-700 text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                Browse Categories
              </button>
            </div>

          </div>
        )}

      </div>
    </MainLayout>
  );
};

// Helper utility for conditional classes merge
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default Orders;
