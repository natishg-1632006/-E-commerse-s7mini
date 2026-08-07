import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AdminLayout } from '../../layouts/AdminLayout';
import {
  OrdersTableSkeleton,
  OrdersKPISkeleton,
  OrderDetailsSkeleton,
} from '../../components/admin/AdminSkeletons';
import { SafeImage } from '../../components/admin/AdminSkeletons';
import { orderService } from '../../services/order.service';
import type { Order, GetOrdersParams, OrderStats } from '../../services/order.service';
import {
  Search,
  Filter,
  Download,
  ShoppingBag,
  Package,
  Calendar,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronRight,
  User,
  FileText,
  ArrowRight,
  AlertTriangle,
  Truck,
  Activity,
  ArrowLeft,
  Copy,
  ChevronLeft,
  MapPin,
  CreditCard,
  ShoppingCart,
  DollarSign,
  Ban,
  Loader2,
  Mail,
  ChevronDown,
  Check,
  Printer
} from 'lucide-react';

// --- Custom Filter Dropdown (matches AdminProducts design) ---
interface OrderFilterDropdownProps {
  label: string;
  selected: string;
  options: { value: string; label: string }[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelect: (value: string) => void;
  minWidth?: string;
}

const OrderFilterDropdown: React.FC<OrderFilterDropdownProps> = ({ label, selected, options, isOpen, setIsOpen, onSelect, minWidth = '168px' }) => {
  const activeLabel = options.find(o => o.value === selected)?.label || selected || label;
  return (
    <div className="relative text-left flex-shrink-0" style={{ minWidth }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-11 w-full px-4 rounded-[10px] border text-slate-700 text-[13px] font-bold transition-all flex items-center justify-between gap-2 shadow-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none cursor-pointer ${
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
          className="absolute right-0 mt-2 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 w-full min-w-[200px] flex flex-col animate-fadeIn"
          onMouseLeave={() => setIsOpen(false)}
        >
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => {
                onSelect(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 text-[12px] font-bold transition-colors hover:bg-slate-50 flex items-center justify-between ${
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

const OrderPanelFilterDropdown: React.FC<{
  label: string;
  selected: string;
  options: { value: string; label: string }[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelect: (value: string) => void;
}> = ({ label: _label, selected, options, isOpen, setIsOpen, onSelect }) => {
  const activeLabel = options.find(o => o.value === selected)?.label || selected;
  return (
    <div className="relative text-left w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 px-3 rounded-lg border text-[12px] font-semibold transition-all flex items-center justify-between gap-1.5 outline-none cursor-pointer ${
          isOpen
            ? 'bg-white border-blue-500 ring-2 ring-blue-500/10'
            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
        }`}
      >
        <span className="truncate">{activeLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 right-0 mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-52 overflow-y-auto flex flex-col animate-fadeIn"
          onMouseLeave={() => setIsOpen(false)}
        >
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => {
                onSelect(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-[11.5px] font-semibold transition-colors hover:bg-slate-50 flex items-center justify-between ${
                selected === option.value ? 'text-blue-600 bg-blue-50/30' : 'text-slate-650'
              }`}
            >
              <span>{option.label}</span>
              {selected === option.value && <Check className="w-3 h-3 text-blue-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_WORKFLOW = [
  'Processing',
  'Packed',
  'Shipped',
  'Out For Delivery',
  'Delivered',
  'Completed',
];

const TERMINAL_STATUSES = ['Delivered', 'Completed', 'Cancelled'];

const ORDER_STATUSES = [
  'All',
  'Processing',
  'Packed',
  'Shipped',
  'Out For Delivery',
  'Delivered',
  'Completed',
  'Cancelled',
];

const PAYMENT_METHODS  = ['All', 'COD', 'Card', 'UPI', 'Net Banking', 'Wallet'];
const SORT_OPTIONS = [
  { label: 'Newest First',      value: 'newest' },
  { label: 'Oldest First',      value: 'oldest' },
  { label: 'Highest Amount',    value: 'highestAmount' },
  { label: 'Lowest Amount',     value: 'lowestAmount' },
];
const DATE_RANGES = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Custom'];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined || amount === null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

const formatDate = (iso: string | undefined) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
};

const formatDatetime = (iso: string | undefined) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
};

const getAvatarInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getDateRangeDates = (range: string): { startDate?: string; endDate?: string } => {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const toISO = (d: Date) => d.toISOString().split('T')[0];
  switch (range) {
    case 'Today':      return { startDate: toISO(today), endDate: toISO(today) };
    case 'Yesterday':  { const y = new Date(today); y.setDate(y.getDate() - 1); return { startDate: toISO(y), endDate: toISO(y) }; }
    case 'Last 7 Days':  { const s = new Date(today); s.setDate(s.getDate() - 6); return { startDate: toISO(s), endDate: toISO(today) }; }
    case 'Last 30 Days': { const s = new Date(today); s.setDate(s.getDate() - 29); return { startDate: toISO(s), endDate: toISO(today) }; }
    case 'This Month':   { const s = new Date(today.getFullYear(), today.getMonth(), 1); return { startDate: toISO(s), endDate: toISO(today) }; }
    default: return {};
  }
};


const getCustomerName = (o: Order): string =>
  o.shippingAddress?.fullName || o.customerInfo?.fullName || 'Unknown Customer';

const getCustomerEmail = (o: Order): string =>
  o.email || o.shippingAddress?.email || o.customerInfo?.email || '—';

const getOrderStatus = (o: Order): string =>
  o.orderStatus || o.status || 'Pending Payment';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const OrderStatusBadge: React.FC<{ status: string; compact?: boolean }> = ({ status }) => {
  const base = `inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[11.5px] font-bold border flex-shrink-0 transition-all`;
  const variants: Record<string, string> = {
    Delivered:          'bg-emerald-50 text-emerald-700 border-emerald-100',
    Completed:          'bg-emerald-50 text-emerald-700 border-emerald-100',
    Shipped:            'bg-indigo-50 text-indigo-700 border-indigo-100',
    'Out For Delivery': 'bg-amber-50 text-amber-700 border-amber-100',
    Packed:             'bg-purple-50 text-purple-700 border-purple-100',
    Processing:         'bg-blue-50 text-blue-700 border-blue-100',
    'Pending Payment':  'bg-amber-50 text-amber-700 border-amber-100',
    'Payment Failed':   'bg-red-50 text-red-600 border-red-100',
    Cancelled:          'bg-red-50 text-red-600 border-red-100',
  };
  const icons: Record<string, React.ReactNode> = {
    Delivered:          <CheckCircle className="w-3.5 h-3.5" />,
    Completed:          <CheckCircle className="w-3.5 h-3.5" />,
    Cancelled:          <XCircle className="w-3.5 h-3.5" />,
    'Payment Failed':   <XCircle className="w-3.5 h-3.5" />,
    'Pending Payment':  <Clock className="w-3.5 h-3.5" />,
    Shipped:            <Truck className="w-3.5 h-3.5" />,
    'Out For Delivery': <Truck className="w-3.5 h-3.5" />,
    Packed:             <Package className="w-3.5 h-3.5" />,
    Processing:         <RefreshCw className="w-3.5 h-3.5" />,
  };
  return (
    <span className={`${base} ${variants[status] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
      {icons[status]}
      <span>{status}</span>
    </span>
  );
};
// ─────────────────────────────────────────────────────────────────────────────
// KPI Card – fixed layout, no wrapping, dynamic sizing to prevent overflow
// ─────────────────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label:    string;
  subLabel: string;
  value:    string | number;
  icon:     React.ReactNode;
  iconBg:   string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, subLabel, value, icon, iconBg }) => {
  const getValSize = (val: string | number) => {
    const len = String(val).length;
    if (len > 14) return 'text-[13px]';
    if (len > 12) return 'text-[15px]';
    if (len > 10) return 'text-[18px]';
    return 'text-[22px]';
  };

  return (
    <motion.div
      layout
      transition={{
        duration: 0.3,
        ease: 'easeInOut',
      }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="bg-white border border-slate-100 rounded-[12px] p-3.5 shadow-sm hover:shadow-md hover:border-slate-200 transition-shadow duration-305 flex flex-col justify-between h-[114px] w-full cursor-default select-none"
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-[12px] font-semibold uppercase tracking-[0.4px] text-slate-400 whitespace-nowrap block max-w-[85%] truncate">
          {label}
        </span>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg} transition-all duration-300`}>
          <span className="scale-90">{icon}</span>
        </div>
      </div>
      <div className="flex flex-col justify-end flex-grow mt-1.5">
        <div className={`font-bold text-slate-900 leading-none tabular-nums transition-all duration-300 whitespace-nowrap ${getValSize(value)}`}>
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </div>
        <div className="text-[11px] text-slate-500 font-medium mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
          {subLabel}
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Order List Page
// ─────────────────────────────────────────────────────────────────────────────

interface OrderListPageProps {
  onSelectOrder: (orderId: string) => void;
}

const OrderListPage: React.FC<OrderListPageProps> = ({ onSelectOrder }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const readParam    = (k: string, def = '')    => searchParams.get(k) ?? def;
  const readNumParam = (k: string, def: number) => { const v = searchParams.get(k); return v !== null ? Number(v) : def; };

  // ── Committed filter state ─────────────────────────────────────────────────
  const [searchCustomer,      setSearchCustomer]      = useState(() => readParam('q'));
  const [filterOrderStatus,   setFilterOrderStatus]   = useState(() => readParam('status', 'All'));
  const [filterPaymentMethod, setFilterPaymentMethod] = useState(() => readParam('paymentMethod', 'All'));
  const [filterDateRange,     setFilterDateRange]     = useState(() => readParam('dateRange'));
  const [filterCustomStart,   setFilterCustomStart]   = useState(() => readParam('from'));
  const [filterCustomEnd,     setFilterCustomEnd]     = useState(() => readParam('to'));
  const [filterSort,          setFilterSort]          = useState(() => readParam('sort', 'newest'));
  const [filterMinAmount,     setFilterMinAmount]     = useState(() => readParam('minAmount'));
  const [filterMaxAmount,     setFilterMaxAmount]     = useState(() => readParam('maxAmount'));
  const [page,                setPage]                = useState(() => readNumParam('page', 1));
  const limit = 15;

  // ── Draft state for filters panel ──────────────────────────────────────────
  const [draftStatus,    setDraftStatus]    = useState(filterOrderStatus);
  const [draftPayMethod, setDraftPayMethod] = useState(filterPaymentMethod);
  const [draftDateRange, setDraftDateRange] = useState(filterDateRange);
  const [draftFrom,      setDraftFrom]      = useState(filterCustomStart);
  const [draftTo,        setDraftTo]        = useState(filterCustomEnd);
  const [draftSort,      setDraftSort]      = useState(filterSort);
  const [draftMin,       setDraftMin]       = useState(filterMinAmount);
  const [draftMax,       setDraftMax]       = useState(filterMaxAmount);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [showFilters,  setShowFilters]  = useState(false);
  const [isSortDropOpen,      setIsSortDropOpen]      = useState(false);
  const [isDateDropOpen,      setIsDateDropOpen]      = useState(false);
  const [isStatusDropOpen,    setIsStatusDropOpen]    = useState(false);
  const [isPayMethodDropOpen, setIsPayMethodDropOpen] = useState(false);
  const [orders,       setOrders]       = useState<Order[]>([]);
  const [total,        setTotal]        = useState(0);
  const [totalPages,   setTotalPages]   = useState(1);
  const [dashboardStats, setDashboardStats] = useState<OrderStats | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [toastMsg,     setToastMsg]     = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef    = useRef<AbortController | null>(null);

  const triggerToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3500); };

  // ── Sync committed state to URL ────────────────────────────────────────────
  const syncUrl = useCallback(() => {
    const p: Record<string, string> = {};
    if (searchCustomer)                                    p.q             = searchCustomer;
    if (filterOrderStatus   && filterOrderStatus   !== 'All') p.status       = filterOrderStatus;
    if (filterPaymentMethod && filterPaymentMethod !== 'All') p.paymentMethod = filterPaymentMethod;
    if (filterDateRange)                                   p.dateRange     = filterDateRange;
    if (filterCustomStart)                                 p.from          = filterCustomStart;
    if (filterCustomEnd)                                   p.to            = filterCustomEnd;
    if (filterSort && filterSort !== 'newest')             p.sort          = filterSort;
    if (filterMinAmount)                                   p.minAmount     = filterMinAmount;
    if (filterMaxAmount)                                   p.maxAmount     = filterMaxAmount;
    if (page > 1)                                          p.page          = String(page);
    setSearchParams(p, { replace: true });
  }, [searchCustomer, filterOrderStatus, filterPaymentMethod, filterDateRange, filterCustomStart,
      filterCustomEnd, filterSort, filterMinAmount, filterMaxAmount, page, setSearchParams]);

  // ── Build API params ───────────────────────────────────────────────────────
  const buildParams = useCallback((): GetOrdersParams => {
    const params: GetOrdersParams = { page, limit };
    const q = searchCustomer.trim() || undefined;
    if (q)                               params.search        = q;
    if (filterOrderStatus   !== 'All')   params.orderStatus   = filterOrderStatus;
    if (filterPaymentMethod !== 'All')   params.paymentMethod = filterPaymentMethod;
    if (filterSort)                      params.sort          = filterSort;
    if (filterMinAmount)                 params.minAmount     = Number(filterMinAmount);
    if (filterMaxAmount)                 params.maxAmount     = Number(filterMaxAmount);
    if (filterDateRange === 'Custom') {
      if (filterCustomStart) params.startDate = filterCustomStart;
      if (filterCustomEnd)   params.endDate   = filterCustomEnd;
    } else if (filterDateRange) {
      Object.assign(params, getDateRangeDates(filterDateRange));
    }
    return params;
  }, [page, limit, searchCustomer, filterOrderStatus, filterPaymentMethod, filterSort,
      filterMinAmount, filterMaxAmount, filterDateRange, filterCustomStart, filterCustomEnd]);

  // ── Core fetch ─────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (soft = false) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    soft ? setIsRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const res = await orderService.getOrders(buildParams());
      const allFetched = res.orders ?? [];
      // Exclude Pending Payment orders — they are not fulfillment orders
      const fulfillmentOrders = allFetched.filter(o => {
        const st = (o.orderStatus || '').toUpperCase();
        return st !== 'PENDING_PAYMENT' && st !== 'PENDING PAYMENT' && st !== 'PENDING';
      });
      setOrders(fulfillmentOrders);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? Math.max(1, Math.ceil((res.total ?? 0) / limit)));
      setDashboardStats(res.stats ?? null);
      syncUrl();
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
      const msg = err.response?.data?.message || err.message || 'Failed to fetch orders.';
      setError(msg);
      triggerToast(msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [buildParams, syncUrl]);

  // ── Debounced search ───────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); fetchOrders(false); }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchCustomer]);

  // ── Filter / page changes → full skeleton reload ───────────────────────────
  useEffect(() => {
    fetchOrders(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterOrderStatus, filterPaymentMethod, filterDateRange,
      filterCustomStart, filterCustomEnd, filterSort, filterMinAmount, filterMaxAmount, page]);

  // ── Apply / Reset ──────────────────────────────────────────────────────────
  const applyFilters = () => {
    setFilterOrderStatus(draftStatus);
    setFilterPaymentMethod(draftPayMethod); setFilterDateRange(draftDateRange);
    setFilterCustomStart(draftFrom);        setFilterCustomEnd(draftTo);
    setFilterSort(draftSort);               setFilterMinAmount(draftMin);
    setFilterMaxAmount(draftMax);           setPage(1);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setSearchCustomer('');
    setFilterOrderStatus('All');   setDraftStatus('All');
    setFilterPaymentMethod('All'); setDraftPayMethod('All');
    setFilterDateRange('');  setDraftDateRange('');
    setFilterCustomStart(''); setDraftFrom('');
    setFilterCustomEnd('');  setDraftTo('');
    setFilterSort('newest'); setDraftSort('newest');
    setFilterMinAmount('');  setDraftMin('');
    setFilterMaxAmount('');  setDraftMax('');
    setPage(1);              setShowFilters(false);
  };

  const activeFilterCount = [
    filterOrderStatus   !== 'All',
    filterPaymentMethod !== 'All',
    !!filterDateRange,
    !!filterMinAmount || !!filterMaxAmount,
    filterSort !== 'newest',
  ].filter(Boolean).length;

  const copyOrderId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); navigator.clipboard.writeText(id); triggerToast('Order ID copied!');
  };

  const handleTabClick = (tab: string) => {
    const val = tab === 'All' ? 'All' : tab;
    setFilterOrderStatus(val); setDraftStatus(val); setPage(1);
  };

  // ── Export filtered list to CSV ────────────────────────────────────────────
  const exportToCSV = () => {
    if (orders.length === 0) {
      triggerToast('No orders to export.');
      return;
    }
    const headers = ['Order ID', 'Customer Name', 'Email', 'Amount', 'Payment Method', 'Payment Status', 'Items Count', 'Created At', 'Order Status'];
    const rows = orders.map(o => [
      o.orderId,
      getCustomerName(o),
      getCustomerEmail(o),
      o.totalAmount,
      o.paymentMethod || '—',
      o.paymentStatus || 'Pending',
      o.items?.length ?? 0,
      o.createdAt ? new Date(o.createdAt).toLocaleString() : '—',
      getOrderStatus(o)
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('CSV Exported Successfully!');
  };

  // ── Dynamic KPI stats calculations (from currently loaded orders) ──────────
  const kpiCards: KpiCardProps[] = React.useMemo(() => {
    if (dashboardStats) {
      return [
        { label: 'TOTAL ORDERS',     subLabel: 'All Orders',       value: dashboardStats.totalOrders,    icon: <ShoppingCart className="w-3.5 h-3.5"/>, iconBg: 'bg-blue-50 text-blue-600' },
        { label: "TODAY'S ORDERS",   subLabel: 'Today',            value: dashboardStats.todaysOrders,   icon: <Calendar className="w-3.5 h-3.5"/>,     iconBg: 'bg-cyan-50 text-cyan-600' },
        { label: 'PROCESSING',       subLabel: 'In Progress',      value: dashboardStats.processing,     icon: <RefreshCw className="w-3.5 h-3.5"/>,    iconBg: 'bg-indigo-50 text-indigo-600' },
        { label: 'PACKED',           subLabel: 'Packed',           value: dashboardStats.packed,         icon: <Package className="w-3.5 h-3.5"/>,      iconBg: 'bg-cyan-50 text-cyan-600' },
        { label: 'SHIPPED',          subLabel: 'Dispatched',       value: dashboardStats.shipped,        icon: <Truck className="w-3.5 h-3.5"/>,        iconBg: 'bg-violet-50 text-violet-600' },
        { label: 'OUT FOR DELIVERY', subLabel: 'Out for Delivery', value: dashboardStats.outForDelivery, icon: <Truck className="w-3.5 h-3.5"/>,        iconBg: 'bg-amber-50 text-amber-600' },
        { label: 'DELIVERED',        subLabel: 'Completed',        value: dashboardStats.delivered,      icon: <CheckCircle className="w-3.5 h-3.5"/>,  iconBg: 'bg-emerald-50 text-emerald-600' },
        { label: 'CANCELLED',        subLabel: 'Cancelled',        value: dashboardStats.cancelled,      icon: <Ban className="w-3.5 h-3.5"/>,         iconBg: 'bg-red-50 text-red-500' },
        { label: 'REVENUE',          subLabel: 'All Time',         value: formatCurrency(dashboardStats.revenue), icon: <DollarSign className="w-3.5 h-3.5"/>, iconBg: 'bg-green-50 text-green-600' },
      ];
    }

    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => (o.createdAt ?? '').startsWith(today));
    
    // Revenue: Sum only PAID orders
    const paidOrders = orders.filter(o => o.paymentStatus?.toUpperCase() === 'PAID');
    const revenue = paidOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);

    const processingCount = orders.filter(o => {
      const st = (o.orderStatus || '').toUpperCase();
      return st === 'PROCESSING';
    }).length;

    const packedCount = orders.filter(o => {
      const st = (o.orderStatus || '').toUpperCase();
      return st === 'PACKED';
    }).length;

    const shippedCount = orders.filter(o => {
      const st = (o.orderStatus || '').toUpperCase();
      return st === 'SHIPPED';
    }).length;

    const outForDeliveryCount = orders.filter(o => {
      const st = (o.orderStatus || '').toUpperCase();
      return st === 'OUT_FOR_DELIVERY' || st === 'OUT FOR DELIVERY';
    }).length;

    const deliveredCount = orders.filter(o => {
      const st = (o.orderStatus || '').toUpperCase();
      return st === 'DELIVERED' || st === 'COMPLETED';
    }).length;

    const cancelledCount = orders.filter(o => {
      const st = (o.orderStatus || '').toUpperCase();
      return st === 'CANCELLED';
    }).length;

    return [
      { label: 'TOTAL ORDERS',     subLabel: 'All Orders',       value: orders.length,         icon: <ShoppingCart className="w-3.5 h-3.5"/>, iconBg: 'bg-blue-50 text-blue-600' },
      { label: "TODAY'S ORDERS",   subLabel: 'Today',            value: todayOrders.length,    icon: <Calendar className="w-3.5 h-3.5"/>,     iconBg: 'bg-cyan-50 text-cyan-600' },
      { label: 'PROCESSING',       subLabel: 'In Progress',      value: processingCount,       icon: <RefreshCw className="w-3.5 h-3.5"/>,    iconBg: 'bg-indigo-50 text-indigo-600' },
      { label: 'PACKED',           subLabel: 'Packed',           value: packedCount,           icon: <Package className="w-3.5 h-3.5"/>,      iconBg: 'bg-cyan-50 text-cyan-600' },
      { label: 'SHIPPED',          subLabel: 'Dispatched',       value: shippedCount,          icon: <Truck className="w-3.5 h-3.5"/>,        iconBg: 'bg-violet-50 text-violet-600' },
      { label: 'OUT FOR DELIVERY', subLabel: 'Out for Delivery', value: outForDeliveryCount,   icon: <Truck className="w-3.5 h-3.5"/>,        iconBg: 'bg-amber-50 text-amber-600' },
      { label: 'DELIVERED',        subLabel: 'Completed',        value: deliveredCount,        icon: <CheckCircle className="w-3.5 h-3.5"/>,  iconBg: 'bg-emerald-50 text-emerald-600' },
      { label: 'CANCELLED',        subLabel: 'Cancelled',        value: cancelledCount,        icon: <Ban className="w-3.5 h-3.5"/>,         iconBg: 'bg-red-50 text-red-500' },
      { label: 'REVENUE',          subLabel: 'All Time',         value: formatCurrency(revenue), icon: <DollarSign className="w-3.5 h-3.5"/>, iconBg: 'bg-green-50 text-green-600' },
    ];
  }, [orders, dashboardStats]);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-[100] flex items-center space-x-2 bg-slate-900 text-white text-[12px] font-bold px-4 py-3 rounded-xl shadow-xl border border-slate-800 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="border-b border-slate-100 pb-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-blue-600 tracking-wider uppercase">Sales Hub</div>
          <h1 className="text-[24px] font-extrabold text-slate-900 tracking-tight mt-0.5">Order Management</h1>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {loading ? 'Loading…' : `${total.toLocaleString()} total orders`} • Monitor, track and manage every order
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
          <button
            onClick={() => fetchOrders(true)}
            disabled={isRefreshing || loading}
            className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={exportToCSV}
            className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-[12px] font-bold hover:bg-slate-50 transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <OrdersKPISkeleton />
      ) : (
        <div 
          className="grid gap-3 transition-all duration-300 ease-in-out"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
        >
          {kpiCards.map((kpi, idx) => (
            <KpiCard key={idx} {...kpi} />
          ))}
        </div>
      )}

      {/* ── Search + Filter Bar (Compact 44px height layout) ────────────────── */}
      <div className="space-y-2.5">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2">
          {/* Universal search input */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchCustomer}
              onChange={e => setSearchCustomer(e.target.value)}
              placeholder="Search by Order ID, Customer Name, Email or Phone..."
              className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-600/10 focus:outline-none rounded-[10px] text-[13px] text-slate-700 placeholder-slate-400 font-medium transition-all"
            />
          </div>
          {/* Sort selection */}
          <OrderFilterDropdown
            label="Sort"
            selected={filterSort}
            options={SORT_OPTIONS.map(s => ({ value: s.value, label: s.label }))}
            isOpen={isSortDropOpen}
            setIsOpen={setIsSortDropOpen}
            onSelect={val => { setFilterSort(val); setDraftSort(val); setPage(1); }}
          />
          {/* Date range selection */}
          <OrderFilterDropdown
            label="Date"
            selected={filterDateRange}
            options={[{ value: '', label: 'All Time' }, ...DATE_RANGES.map(r => ({ value: r, label: r }))]}
            isOpen={isDateDropOpen}
            setIsOpen={setIsDateDropOpen}
            onSelect={val => { setFilterDateRange(val); setDraftDateRange(val); setPage(1); }}
          />
          {/* Filter toggle button */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`h-11 px-4 rounded-[10px] text-[13px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border flex-shrink-0 ${
              showFilters || activeFilterCount > 0
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className={`text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                showFilters ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
              }`}>
                {activeFilterCount}
              </span>
            )}
          </button>
          {/* Export CSV button */}
          <button 
            onClick={exportToCSV}
            className="h-11 px-4 rounded-[10px] border border-slate-200 bg-white text-slate-700 text-[13px] font-bold hover:bg-slate-50 transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4 animate-fadeIn">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Order Status */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Order Status</label>
                <OrderPanelFilterDropdown
                  label="Order Status"
                  selected={draftStatus}
                  options={ORDER_STATUSES.map(s => ({ value: s, label: s }))}
                  isOpen={isStatusDropOpen}
                  setIsOpen={setIsStatusDropOpen}
                  onSelect={setDraftStatus}
                />
              </div>
              {/* Payment Method */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Method</label>
                <OrderPanelFilterDropdown
                  label="Payment Method"
                  selected={draftPayMethod}
                  options={PAYMENT_METHODS.map(s => ({ value: s, label: s }))}
                  isOpen={isPayMethodDropOpen}
                  setIsOpen={setIsPayMethodDropOpen}
                  onSelect={setDraftPayMethod}
                />
              </div>
              {/* Min Amount */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Min Amount (₹)</label>
                <input type="number" value={draftMin} onChange={e => setDraftMin(e.target.value)}
                  placeholder="0"
                  className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-700 focus:outline-none focus:border-blue-400" />
              </div>
              {/* Max Amount */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Max Amount (₹)</label>
                <input type="number" value={draftMax} onChange={e => setDraftMax(e.target.value)}
                  placeholder="No limit"
                  className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-700 focus:outline-none focus:border-blue-400" />
              </div>
            </div>

            {/* Custom Range picker inputs */}
            {draftDateRange === 'Custom' && (
              <div className="flex flex-wrap items-end gap-3 pt-1 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">From</label>
                  <input type="date" value={draftFrom} onChange={e => setDraftFrom(e.target.value)}
                    className="h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-700 focus:outline-none focus:border-blue-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">To</label>
                  <input type="date" value={draftTo} onChange={e => setDraftTo(e.target.value)}
                    className="h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-700 focus:outline-none focus:border-blue-400" />
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 font-semibold">
                  {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                </span>
                <button onClick={resetFilters}
                  className="text-[12px] font-bold text-red-500 hover:text-red-700 cursor-pointer transition-colors">
                  Reset All
                </button>
              </div>
              <button onClick={applyFilters}
                className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-black rounded-xl shadow-md shadow-blue-600/20 cursor-pointer transition-all active:scale-95">
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Quick Tabs - Fulfillment states only */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { label: 'All',              value: 'All' },
            { label: 'Processing',       value: 'Processing' },
            { label: 'Packed',           value: 'Packed' },
            { label: 'Shipped',          value: 'Shipped' },
            { label: 'Out For Delivery', value: 'Out For Delivery' },
            { label: 'Delivered',        value: 'Delivered' },
            { label: 'Cancelled',        value: 'Cancelled' },
          ].map(tab => (
            <button
              key={tab.label}
              onClick={() => handleTabClick(tab.value)}
              className={`h-[40px] px-3.5 rounded-[10px] text-[13px] font-medium whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                filterOrderStatus === tab.value
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 border border-blue-600'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 bg-white border border-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Orders Table (Reduced padding, compact badge layouts, 56px heights) ── */}
      {loading ? (
        <OrdersTableSkeleton />
      ) : error ? (
        <div className="bg-white border border-red-100 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div className="text-[14px] font-black text-slate-800 mb-1">Failed to Load Orders</div>
          <p className="text-[11px] text-slate-500 font-medium mb-4">{error}</p>
          <button onClick={() => fetchOrders(false)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold rounded-xl cursor-pointer transition-all shadow-md shadow-blue-600/25">
            Retry
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden flex flex-col pt-0.5 relative">
          <style>{`@keyframes loadingBar{0%{left:-35%}100%{left:100%}}.animate-loadingBar{animation:loadingBar 1s linear infinite}`}</style>
          {isRefreshing && (
            <div className="w-full h-0.5 bg-blue-100 relative overflow-hidden z-10">
              <div className="absolute top-0 left-0 h-full bg-blue-600 animate-loadingBar w-1/3 rounded-full" />
            </div>
          )}

          {/* Table Header (13px Font) */}
          <div
            className="hidden xl:grid items-center border-b border-slate-100 px-5 py-3 bg-slate-50/30 text-[13px] font-semibold text-slate-400 uppercase tracking-wider"
            style={{ gridTemplateColumns: '18% 28% 14% 10% 14% 12% 4%' }}
          >
            <div>Order ID</div>
            <div>Customer</div>
            <div>Amount</div>
            <div>Items</div>
            <div>Created Date</div>
            <div>Order Status</div>
            <div />
          </div>

          {/* Table Rows */}
          <div className={`relative min-h-[180px] transition-opacity duration-200 ${isRefreshing ? 'opacity-40 pointer-events-none' : ''}`}>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-slate-200" />
                </div>
                <div>
                  <div className="text-[14px] font-black text-slate-700">No completed orders found.</div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    {activeFilterCount > 0 || searchCustomer
                      ? 'No results match your filters. Try adjusting them.'
                      : 'No orders have been placed yet.'}
                  </p>
                </div>
                {(activeFilterCount > 0 || searchCustomer) && (
                  <button onClick={resetFilters}
                    className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg cursor-pointer transition-all">
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="p-1.5 sm:p-2 space-y-0.5">
                {orders.map((order, rowIdx) => {
                  const displayId = order.displayId || order.orderId || '—';
                  const rowKey    = order.orderId  || `order-row-${rowIdx}`;
                  const customerName = getCustomerName(order);
                  const customerEmail = getCustomerEmail(order);
                  const customerPhone = order.shippingAddress?.phone || order.customerInfo?.phone || '';
                  
                  return (
                    <div
                      key={rowKey}
                      onClick={() => order.orderId && onSelectOrder(order.orderId)}
                      className="flex flex-col xl:grid items-start xl:items-center px-5 min-h-[56px] py-2 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md hover:shadow-slate-100/80 transition-all duration-200 cursor-pointer group bg-white gap-2 xl:gap-0"
                      style={{ gridTemplateColumns: '18% 28% 14% 10% 14% 12% 4%' }}
                    >
                      {/* Order ID */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-3 h-3" />
                        </div>
                        <button
                          onClick={e => order.orderId && copyOrderId(order.orderId, e)}
                          className="text-[11px] font-bold text-slate-700 font-mono hover:text-blue-600 transition-colors cursor-pointer text-left truncate max-w-[110px]"
                          title={displayId}
                        >
                          {displayId.length > 15 ? displayId.slice(0, 15) + '…' : displayId}
                        </button>
                      </div>

                      {/* Customer Info (Avatar Card stacked) */}
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center flex-shrink-0 text-[11.5px] font-black text-slate-500 tracking-wider">
                          {getAvatarInitials(customerName)}
                        </div>
                        <div className="min-w-0 leading-tight">
                          <div className="text-[13px] font-bold text-slate-800 truncate group-hover:text-blue-700 transition-colors">{customerName}</div>
                          <div className="text-[11px] text-slate-400 font-semibold truncate mt-0.5">{customerEmail}</div>
                          {customerPhone && (
                            <div className="text-[10px] text-slate-400 font-bold font-mono mt-0.5">{customerPhone}</div>
                          )}
                        </div>
                      </div>

                      {/* Amount + Items Count stacked */}
                      <div className="leading-tight">
                        <div className="text-[13px] font-black text-slate-950">{formatCurrency(order.totalAmount || 0)}</div>
                        <div className="text-[10.5px] text-slate-400 font-bold mt-0.5">
                          {order.items?.length ?? 0} Item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
                        </div>
                      </div>

                      {/* Items Details Summary */}
                      <div className="text-[12.5px] font-bold text-slate-655 leading-none">
                        {order.items?.length ?? 0} Item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
                      </div>

                      {/* Created Date */}
                      <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-semibold leading-none">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{formatDate(order.createdAt)}</span>
                      </div>

                      {/* Order Status */}
                      <div className="flex items-center">
                        <OrderStatusBadge status={getOrderStatus(order)} />
                      </div>

                   
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
              <span className="text-[11px] text-slate-400 font-semibold">
                Page {page} of {totalPages} • {total.toLocaleString()} orders
              </span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="h-7.5 w-7.5 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all">
                  <ChevronLeft className="w-3 h-3" />
                </button>
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let p = i + 1;
                  if (totalPages > 7) {
                    if (page <= 4) p = i + 1;
                    else if (page >= totalPages - 3) p = totalPages - 6 + i;
                    else p = page - 3 + i;
                  }
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`h-7.5 w-7.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                        page === p ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="h-7.5 w-7.5 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all">
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Order Detail Page
// ─────────────────────────────────────────────────────────────────────────────

interface OrderDetailPageProps {
  orderId: string;
  onBack: () => void;
  onOrderUpdated: () => void;
}

const OrderDetailPage: React.FC<OrderDetailPageProps> = ({ orderId, onBack, onOrderUpdated }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isErrorToast, setIsErrorToast] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const triggerToast = (msg: string, isError = false) => {
    setToastMsg(msg); setIsErrorToast(isError);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchOrder = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await orderService.getOrderById(orderId);
      setOrder(res);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const handleStatusUpdate = async () => {
    if (!pendingStatus || !order) return;
    setIsUpdatingStatus(true);
    try {
      await orderService.updateOrderStatus(order.orderId, pendingStatus);
      triggerToast(`Order status updated to "${pendingStatus}" successfully!`);
      setPendingStatus(null);
      await fetchOrder();
      onOrderUpdated();
    } catch (err: any) {
      triggerToast(err.response?.data?.message || err.message || 'Failed to update order status.', true);
      setPendingStatus(null);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(`${label} copied to clipboard!`);
  };

  const handlePrintSticker = () => {
    if (!order) return;
    const stickerHtml = `
      <html>
        <head>
          <title>Pack Sticker - ${order.orderId}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              @page { size: 100mm 150mm; margin: 0; }
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              padding: 20px;
              color: #000;
              width: 380px;
              margin: 0 auto;
            }
            .sticker-box {
              border: 3px dashed #000;
              padding: 15px;
              background: #fff;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .header h1 {
              font-size: 20px;
              margin: 0;
              font-weight: 900;
              letter-spacing: 1px;
            }
            .section {
              margin-bottom: 12px;
              border-bottom: 1px dashed #000;
              padding-bottom: 8px;
            }
            .section:last-child {
              border-bottom: none;
            }
            .title {
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .content {
              font-size: 12px;
              line-height: 1.4;
              font-weight: 600;
            }
            .grid {
              display: flex;
              justify-content: space-between;
            }
            .qr-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 15px;
            }
            .barcode {
              display: flex;
              justify-content: center;
              align-items: center;
              margin: 15px 0 10px 0;
            }
            .barcode-line {
              height: 40px;
              background-color: #000;
              margin: 0 1px;
            }
          </style>
        </head>
        <body>
          <div class="sticker-box">
            <div class="header">
              <h1>NATCART EXPEDITED</h1>
              <div style="font-size: 10px; margin-top: 4px; font-weight: bold;">PRIORITY SHIPPING LABEL</div>
            </div>
            
            <div class="section grid">
              <div>
                <div class="title">ORDER DATE</div>
                <div class="content">${new Date(order.createdAt).toLocaleDateString()}</div>
              </div>
              <div style="text-align: right;">
                <div class="title">ORDER ID</div>
                <div class="content">#${order.orderId.slice(0, 12).toUpperCase()}</div>
              </div>
            </div>

            <div class="section">
              <div class="title">SHIP TO (RECIPIENT)</div>
              <div class="content" style="font-size: 13px; font-weight: bold;">
                ${order.shippingAddress?.fullName || 'Customer'}<br/>
                ${order.shippingAddress?.address || '—'}<br/>
                ${order.shippingAddress?.city || '—'}, ${order.shippingAddress?.state || '—'} - ${order.shippingAddress?.pincode || '—'}<br/>
                Phone: ${order.shippingAddress?.phone || '—'}
              </div>
            </div>

            <div class="section">
              <div class="title">PACKAGE CONTENTS</div>
              <div class="content" style="font-size: 11px;">
                ${(order.items || []).map(item => `• ${item.quantity}x ${item.name}`).join('<br/>')}
              </div>
            </div>

            <div class="qr-container">
              <div>
                <div class="title">TRACKING REF</div>
                <div class="content" style="font-size: 10px;">TRK-${order.orderId.slice(0, 8).toUpperCase()}</div>
                <div style="font-size: 8px; margin-top: 4px; color: #444;">Scan to verify contents</div>
              </div>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent('https://orders.natcart.com/invoice/' + order.orderId)}" style="width: 70px; height: 70px;" />
            </div>

            <div class="barcode">
              ${Array.from({ length: 45 }).map(() => {
                const widths = [1, 2, 3, 4];
                const w = widths[Math.floor(Math.random() * widths.length)];
                return `<div class="barcode-line" style="width: ${w}px;"></div>`;
              }).join('')}
            </div>
            <div style="text-align: center; font-size: 9px; font-weight: bold; letter-spacing: 1px;">*${order.orderId.slice(0, 12).toUpperCase()}*</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank', 'width=450,height=650');
    if (printWindow) {
      printWindow.document.write(stickerHtml);
      printWindow.document.close();
    }
  };

  const handleDownloadInvoice = async () => {
    setIsDownloading(true);
    try {
      const blob = await orderService.downloadInvoice(orderId);
      
      if (blob.type === 'application/json') {
        const text = await blob.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Failed to download invoice.');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      triggerToast('Invoice downloaded successfully!');
    } catch (err: any) {
      console.error('Error downloading invoice:', err);
      let errorMsg = 'Failed to download invoice.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          errorMsg = parsed.message || errorMsg;
        } catch (_) {}
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      triggerToast(errorMsg, true);
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-10 animate-fadeIn">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-5 border-b border-slate-100 gap-4 animate-pulse">
          <div className="space-y-2.5">
            <div className="h-4 bg-slate-200 rounded w-32" />
            <div className="h-7 bg-slate-200 rounded w-52 mt-1.5" />
            <div className="h-3.5 bg-slate-200 rounded w-64 mt-1.5" />
          </div>
        </div>
        <OrderDetailsSkeleton />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6 pb-10">
        <button onClick={onBack} className="flex items-center space-x-2 text-[12px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Orders</span>
        </button>
        <div className="max-w-md mx-auto py-16 text-center space-y-5 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
          <div className="w-14 h-14 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[16px] font-black text-slate-800">Order Not Found</div>
            <p className="text-[12px] text-slate-500 font-medium mt-1">{error || 'The requested order could not be found.'}</p>
          </div>
          <button onClick={fetchOrder} className="px-5 py-2 bg-blue-600 text-white text-[12px] font-bold rounded-xl cursor-pointer hover:bg-blue-700 transition-all shadow-md shadow-blue-600/25">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentStatus    = getOrderStatus(order);
  const canCancelOrder   = !TERMINAL_STATUSES.includes(currentStatus)
    && currentStatus !== 'Packed' && currentStatus !== 'Shipped' && currentStatus !== 'Out For Delivery';
  const grandTotal       = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || order.totalAmount || 0;

  const customerEmail    = getCustomerEmail(order);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center space-x-2 text-white text-[12px] font-bold px-4 py-3 rounded-xl shadow-xl border animate-fadeIn ${
          isErrorToast ? 'bg-red-600 border-red-500 shadow-red-100' : 'bg-slate-900 border-slate-800 shadow-slate-200'
        }`}>
          {isErrorToast ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {pendingStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-[15px] font-black text-slate-900">Update Order Status?</h3>
                <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">This action cannot be reversed.</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl space-y-3 text-[12px] text-slate-600 font-semibold">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Order ID</span>
                <span className="font-black text-slate-800 font-mono text-[11px]">{order.displayId || order.orderId}</span>
              </div>
              <div className="flex items-center gap-2">
                <OrderStatusBadge status={currentStatus} compact />
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <OrderStatusBadge status={pendingStatus} compact />
              </div>
            </div>
            <div className="flex items-center space-x-3 justify-end">
              <button onClick={() => setPendingStatus(null)} disabled={isUpdatingStatus}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-[12px] font-bold text-slate-600 rounded-xl transition-all cursor-pointer disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleStatusUpdate} disabled={isUpdatingStatus}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold rounded-xl transition-all shadow-md shadow-blue-600/25 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center space-x-1.5">
                {isUpdatingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isUpdatingStatus ? 'Updating…' : 'Confirm Update'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between pb-5 border-b border-slate-100 gap-4">
        <div className="space-y-2">
          <button onClick={onBack} className="flex items-center space-x-2 text-[12px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Orders</span>
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-black text-slate-900 tracking-tight font-mono">{order.displayId || order.orderId}</h1>
            <OrderStatusBadge status={currentStatus} />
          </div>
          <p className="text-[12px] text-slate-400 font-semibold">
            Created {formatDatetime(order.createdAt)} • Updated {formatDatetime(order.updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap self-start">
          {canCancelOrder && (
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
                  setPendingStatus('Cancelled');
                }
              }}
              className="h-8 px-3 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-[11px] font-bold text-red-600 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5 text-red-500" />
              <span>Cancel Order</span>
            </button>
          )}
          <button onClick={() => copyToClipboard(order.orderId, 'Order ID')}
            className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 flex items-center space-x-1.5 transition-all cursor-pointer">
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Copy ID</span>
          </button>
          <button onClick={() => fetchOrder()}
            className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 cursor-pointer transition-all" title="Refresh Order">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDownloadInvoice}
            disabled={isDownloading}
            className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-60"
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{isDownloading ? 'Downloading…' : 'Download Invoice'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Row 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Amount',    value: formatCurrency(order.totalAmount), icon: <DollarSign className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Items Ordered',   value: `${order.items?.length ?? 0} item${(order.items?.length ?? 0) !== 1 ? 's' : ''}`, icon: <Package className="w-4 h-4" />, color: 'text-violet-600 bg-violet-50' },
          { label: 'Payment Status',  value: order.paymentStatus || '—', icon: <CreditCard className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Payment Method',  value: order.paymentMethod || '—', icon: <Wallet className="w-4 h-4" />, color: 'text-indigo-600 bg-indigo-50' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-[16px] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${kpi.color}`}>{kpi.icon}</div>
            </div>
            <div className="text-[16px] font-black text-slate-900 leading-tight">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Payment Recovery Alert Warning Banner (Full-Width) */}
      {order.paymentStatus === 'Pending' && order.paymentMethod !== 'COD' && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-slate-700 shadow-sm">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-[12.5px] font-black text-amber-800">Awaiting Online Payment</h4>
              <p className="text-[11px] text-amber-700/90 font-medium mt-0.5">
                This order is awaiting checkout payment. Fulfillments should start after payment is confirmed.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://natcart.com/checkout/pay/${order.orderId}`);
                triggerToast('Payment Link copied to clipboard!');
              }}
              className="h-8 px-3 rounded-lg border border-amber-250 hover:bg-amber-100/50 text-[11px] font-bold text-amber-800 flex items-center space-x-1 transition-all cursor-pointer bg-white"
            >
              <Copy className="w-3.5 h-3.5 text-amber-600" />
              <span>Copy Link</span>
            </button>
            <button
              onClick={() => {
                triggerToast(`Payment reminder resent to ${customerEmail || 'customer'}!`);
              }}
              className="h-8 px-3 rounded-lg border border-amber-255 hover:bg-amber-100/50 text-[11px] font-bold text-amber-800 flex items-center space-x-1 transition-all cursor-pointer bg-white"
            >
              <Mail className="w-3.5 h-3.5 text-amber-600" />
              <span>Resend Email</span>
            </button>
          </div>
        </div>
      )}

      {/* Row 2 - Top Horizontal Timeline & Bottom 3 Columns Grid */}
      <div className="space-y-6">
        
        {/* Order Progress Timeline (Full-Width Stepper at top) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_12px_-3px_rgba(148,163,184,0.08)]">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-100 mb-6">
            <Activity className="w-4 h-4 text-blue-600" />
            <h3 className="text-[14px] font-black text-slate-900">Order Progress</h3>
          </div>

          <div className="relative">
            {/* Horizontal connected progress bar line (visible only on md screens and up) */}
            <div className="absolute left-[35px] right-[35px] top-[13px] h-[2px] bg-slate-100 z-0 hidden md:block" />
            
            <div className="grid grid-cols-1 md:grid-cols-7 gap-6 md:gap-4 relative z-10">
              {STATUS_WORKFLOW.map((st, idx) => {
                const currentIdx  = STATUS_WORKFLOW.indexOf(currentStatus);
                const isCompleted = currentIdx !== -1 && idx < currentIdx;
                const isCurrent   = st === currentStatus;
                const isNext      = currentIdx !== -1 && idx === currentIdx + 1;
                
                let nodeStyles = '';
                let textStyles = '';
                let hintStyles = '';
                let hintText = 'Locked';
                let nodeInner = null;

                if (isCompleted) {
                  nodeStyles = 'bg-emerald-500 border-emerald-500 text-white';
                  textStyles = 'text-slate-400 font-semibold';
                  hintStyles = 'text-emerald-600 bg-emerald-50/60 border border-emerald-100/50';
                  hintText = 'Completed';
                  nodeInner = <CheckCircle className="w-3.5 h-3.5 text-white" />;
                } else if (isCurrent) {
                  nodeStyles = 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100';
                  textStyles = 'text-blue-600 font-black';
                  hintStyles = 'text-blue-700 bg-blue-50 border border-blue-100';
                  hintText = 'Active';
                  nodeInner = (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  );
                } else if (isNext) {
                  nodeStyles = 'bg-white border-2 border-blue-400 text-blue-650 hover:border-blue-600 cursor-pointer shadow-sm hover:bg-blue-50/30';
                  textStyles = 'text-slate-800 font-extrabold hover:text-blue-600 transition-colors cursor-pointer';
                  hintStyles = 'text-blue-600 bg-white border border-blue-200 cursor-pointer hover:bg-blue-50/50 hover:shadow-sm';
                  hintText = 'Update';
                  nodeInner = <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 animate-pulse" />;
                } else {
                  nodeStyles = 'bg-slate-50 border border-slate-200 text-slate-400';
                  textStyles = 'text-slate-400 font-medium';
                  hintStyles = 'text-slate-400 bg-slate-50 border border-slate-100';
                  hintText = 'Locked';
                  nodeInner = <span className="w-1.5 h-1.5 rounded-full bg-slate-350" />;
                }

                return (
                  <div 
                    key={st}
                    onClick={() => {
                      if (isNext) {
                        setPendingStatus(st);
                      }
                    }}
                    className="flex md:flex-col items-center md:text-center gap-3.5 select-none cursor-default"
                  >
                    {/* Node circle */}
                    <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center transition-all flex-shrink-0 z-10 ${nodeStyles}`}>
                      {nodeInner}
                    </div>
                    
                    {/* Step Text Label & Action Badge */}
                    <div className="flex-1 md:flex-initial min-w-0 flex md:flex-col items-center justify-between md:justify-start gap-1 md:gap-2 pt-0.5 w-full">
                      <span className={`text-[11.5px] uppercase tracking-wide truncate max-w-full block ${textStyles}`} title={st}>
                        {st}
                      </span>
                      <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded-full transition-all shrink-0 uppercase tracking-wider ${hintStyles}`}>
                        {hintText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3 Equal Columns Metadata Grid below timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. Customer Information */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(148,163,184,0.08)] h-full flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-100">
                <User className="w-4 h-4 text-blue-600" />
                <h3 className="text-[13.5px] font-black text-slate-900">Customer Information</h3>
              </div>
              
              <div className="flex items-center space-x-3.5 py-4 border-b border-slate-50">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[15px] font-black shadow-md border-2 border-white ring-4 ring-slate-50 flex-shrink-0">
                  {getCustomerName(order).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-extrabold text-slate-800 leading-tight truncate">{getCustomerName(order)}</div>
                  <div className="text-[10.5px] text-slate-400 font-semibold mt-0.5 truncate">{getCustomerEmail(order)}</div>
                </div>
              </div>

              <div className="space-y-1.5 pt-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-50 text-[12px] font-semibold">
                  <span className="text-slate-400">Email</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-700 font-bold max-w-[125px] truncate" title={getCustomerEmail(order)}>{getCustomerEmail(order)}</span>
                    <button 
                      onClick={() => copyToClipboard(getCustomerEmail(order), 'Email')} 
                      className="p-1 hover:bg-slate-50 border border-transparent hover:border-slate-150 rounded text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-50 text-[12px] font-semibold">
                  <span className="text-slate-400">Phone</span>
                  <span className="text-slate-700 font-bold">{order.shippingAddress?.phone || order.customerInfo?.phone || '—'}</span>
                </div>

                <div className="flex items-center justify-between py-2 text-[12px] font-semibold">
                  <span className="text-slate-400">User ID</span>
                  <div className="flex items-center space-x-1.5 font-mono text-[10px]">
                    <span className="text-slate-500 font-bold bg-slate-50/50 px-1.5 py-0.5 border border-slate-100 rounded max-w-[95px] truncate" title={order.userId}>{order.userId || '—'}</span>
                    {order.userId && (
                      <button 
                        onClick={() => copyToClipboard(order.userId || '', 'User ID')} 
                        className="p-1 hover:bg-slate-50 border border-transparent hover:border-slate-150 rounded text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Order Summary */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(148,163,184,0.08)] h-full flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-100">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <h3 className="text-[13.5px] font-black text-slate-900">Order Summary</h3>
              </div>
              
              <div className="space-y-1.5 pt-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-50 text-[12px] font-semibold">
                  <span className="text-slate-400">Order ID</span>
                  <div className="flex items-center space-x-1.5 font-mono text-[10px]">
                    <span className="text-blue-800 font-black bg-blue-50/60 px-1.5 py-0.5 border border-blue-100/50 rounded max-w-[125px] truncate" title={order.displayId || order.orderId}>{order.displayId || order.orderId}</span>
                    <button 
                      onClick={() => copyToClipboard(order.orderId, 'Order ID')} 
                      className="p-1 hover:bg-slate-50 border border-transparent hover:border-slate-150 rounded text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-50 text-[12px] font-semibold">
                  <span className="text-slate-400">Created</span>
                  <span className="text-slate-700 font-bold text-right">{formatDatetime(order.createdAt)}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-50 text-[12px] font-semibold">
                  <span className="text-slate-400">Updated</span>
                  <span className="text-slate-700 font-bold text-right">{formatDatetime(order.updatedAt)}</span>
                </div>

                <div className="flex items-center justify-between py-2 text-[12px] font-semibold">
                  <span className="text-slate-400">Order Status</span>
                  <OrderStatusBadge status={currentStatus} compact />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Shipping Address */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(148,163,184,0.08)] h-full flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-100">
                <MapPin className="w-4 h-4 text-blue-600" />
                <h3 className="text-[13.5px] font-black text-slate-900">Shipping Address</h3>
              </div>
              
              {order.shippingAddress?.address || order.shippingAddress?.fullName ? (
                <div className="space-y-1.5 pt-3">
                  <div className="flex items-center justify-between py-2 border-b border-slate-50 text-[12px] font-semibold">
                    <span className="text-slate-400">Recipient</span>
                    <span className="text-slate-700 font-bold text-right truncate max-w-[140px]">{order.shippingAddress?.fullName || '—'}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-50 text-[12px] font-semibold">
                    <span className="text-slate-400">Phone</span>
                    <span className="text-slate-700 font-bold">{order.shippingAddress?.phone || '—'}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-50 text-[12px] font-semibold">
                    <span className="text-slate-400">Location</span>
                    <span className="text-slate-700 font-bold text-right truncate max-w-[140px]" title={order.shippingAddress?.city && order.shippingAddress?.state ? `${order.shippingAddress.city}, ${order.shippingAddress.state}` : '—'}>
                      {order.shippingAddress?.city && order.shippingAddress?.state ? `${order.shippingAddress.city}, ${order.shippingAddress.state}` : '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-50 text-[12px] font-semibold">
                    <span className="text-slate-400">Pincode</span>
                    <span className="text-slate-700 font-bold">{order.shippingAddress?.pincode || '—'}</span>
                  </div>

                  {order.shippingAddress?.address && (
                    <div className="pt-2">
                      <span className="text-slate-400 text-[12px] font-semibold block mb-1">Street Address</span>
                      <p className="text-[11.5px] text-slate-600 font-semibold bg-slate-50/50 p-2 border border-slate-100 rounded-lg leading-relaxed max-h-[60px] overflow-y-auto" title={order.shippingAddress.address}>
                        {order.shippingAddress.address}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-350">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[12.5px] font-bold text-slate-600">No Shipping Address</div>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">This order does not require shipping.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Shipping / Package Packing Sticker Section */}
      <div className="bg-white border border-slate-100/80 rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(148,163,184,0.08)]">
        <div className="flex items-center space-x-2 pb-3.5 border-b border-slate-100">
          <Printer className="w-4 h-4 text-blue-600" />
          <h3 className="text-[13.5px] font-black text-slate-900">Package Packing Sticker</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-5">
          <div className="md:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2 text-left">
              <div className="text-[13.5px] font-extrabold text-slate-800">Print Shipping Label</div>
              <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed">
                Generate and print the shipping label to paste on the outer package box. The label contains delivery addresses, item quantities, tracking barcodes, and a scannable verification QR code.
              </p>
            </div>
            <button
              onClick={handlePrintSticker}
              className="h-10 px-5.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5 self-start"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Packing Sticker</span>
            </button>
          </div>

          <div className="md:col-span-7 flex justify-center">
            {/* Visual representation of the label */}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 bg-white max-w-sm w-full space-y-4 font-mono text-[11px] text-slate-700 shadow-sm relative overflow-hidden select-none">
              <div className="border-b-2 border-slate-955 pb-2 text-center">
                <div className="text-[13px] font-black text-slate-955 tracking-wider">NATCART EXPEDITED</div>
                <div className="text-[8px] font-extrabold text-slate-450 tracking-widest mt-0.5">PRIORITY SHIPPING LABEL</div>
              </div>

              <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                <div>
                  <div className="text-[8px] font-bold text-slate-400">ORDER DATE</div>
                  <div className="font-bold text-slate-800">{new Date(order.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-[8px] font-bold text-slate-400">ORDER ID</div>
                  <div className="font-bold text-slate-800">#{(order.displayId || order.orderId.slice(0, 12)).toUpperCase()}</div>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-200 pb-2 text-left font-mono">
                <div className="text-[8px] font-bold text-slate-400">SHIP TO (RECIPIENT)</div>
                <div className="font-bold text-slate-800 leading-normal mt-0.5">
                  <div className="text-[12px] font-black text-slate-900">{order.shippingAddress?.fullName || 'Customer'}</div>
                  <div>{order.shippingAddress?.address || '—'}</div>
                  <div>{order.shippingAddress?.city || '—'}, {order.shippingAddress?.state || '—'} - {order.shippingAddress?.pincode || '—'}</div>
                  <div>Phone: {order.shippingAddress?.phone || '—'}</div>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-200 pb-2 text-left font-mono">
                <div className="text-[8px] font-bold text-slate-400">PACKAGE CONTENTS</div>
                <div className="space-y-0.5 mt-1 font-semibold text-slate-600">
                  {(order.items || []).slice(0, 3).map((item, idx) => (
                    <div key={idx} className="truncate">• {item.quantity}x {item.name}</div>
                  ))}
                  {order.items && order.items.length > 3 && (
                    <div className="text-slate-455 italic font-medium">+ {order.items.length - 3} more item(s)</div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 text-left">
                <div>
                  <div className="text-[8px] font-bold text-slate-400">TRACKING REF</div>
                  <div className="font-black text-slate-900">TRK-{order.orderId.slice(0, 8).toUpperCase()}</div>
                  <div className="text-[7.5px] text-slate-400 mt-1">Scan for details</div>
                </div>
                <div className="w-[65px] h-[65px] bg-slate-50 border border-slate-100 flex items-center justify-center p-1 rounded-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent('https://orders.natcart.com/invoice/' + order.orderId)}`}
                    alt="Sticker QR"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="pt-2">
                {/* Visual barcode mockup */}
                <div className="flex items-center space-x-[1.5px] h-8 bg-white justify-center">
                  <div className="w-[1.5px] h-full bg-slate-955" />
                  <div className="w-[3px] h-full bg-slate-955" />
                  <div className="w-[1px] h-full bg-slate-955" />
                  <div className="w-[2px] h-full bg-slate-955" />
                  <div className="w-[1.5px] h-full bg-slate-955" />
                  <div className="w-[4px] h-full bg-slate-955" />
                  <div className="w-[1px] h-full bg-slate-955" />
                  <div className="w-[2.5px] h-full bg-slate-955" />
                  <div className="w-[1.5px] h-full bg-slate-955" />
                  <div className="w-[3px] h-full bg-slate-955" />
                  <div className="w-[1px] h-full bg-slate-955" />
                  <div className="w-[2px] h-full bg-slate-955" />
                  <div className="w-[1.5px] h-full bg-slate-955" />
                  <div className="w-[4px] h-full bg-slate-955" />
                  <div className="w-[1px] h-full bg-slate-955" />
                  <div className="w-[2.5px] h-full bg-slate-955" />
                </div>
                <div className="text-[7.5px] text-center font-bold tracking-widest text-slate-500 mt-1">*{order.orderId.slice(0, 12).toUpperCase()}*</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 - Ordered Products & Payments (Full Width) */}
      <div className="space-y-6">
        
        {/* Ordered Products */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50/30 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-blue-600" />
              <h3 className="text-[13.5px] font-black text-slate-900">Ordered Products</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="hidden sm:grid sm:grid-cols-12 items-center px-4 py-2 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/20">
            <div className="col-span-1">Image</div>
            <div className="col-span-4 pl-3">Product</div>
            <div className="col-span-2 text-center">Brand</div>
            <div className="col-span-1 text-center">Qty</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">Subtotal</div>
          </div>
          <div className="p-3 space-y-2">
            {(order.items || []).map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 items-center p-3 rounded-xl border border-slate-100 hover:bg-slate-50/30 transition-all gap-2">
                <div className="col-span-1">
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                    {(item.imageUrl || item.image) ? (
                      <SafeImage src={item.imageUrl || item.image || ''} alt={item.name} className="w-11 h-11 rounded-xl" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-slate-350" /></div>
                    )}
                  </div>
                </div>
                <div className="col-span-4 pl-2">
                  <div className="text-[12.5px] font-bold text-slate-800 leading-tight">{item.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.productId?.slice(0, 12)}</div>
                </div>
                <div className="col-span-2 text-center text-[11px] text-slate-600 font-semibold">{item.brand || '—'}</div>
                <div className="col-span-1 text-center text-[12px] font-bold text-slate-800">{item.quantity}</div>
                <div className="col-span-2 text-right text-[12px] font-semibold text-slate-600">{formatCurrency(item.price)}</div>
                <div className="col-span-2 text-right text-[13px] font-black text-slate-900">{formatCurrency(item.price * item.quantity)}</div>
              </div>
            ))}
            <div className="flex justify-end px-3 pt-2 border-t border-slate-100 mt-2">
              <div className="text-right space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grand Total</span>
                <span className="text-[20px] font-black text-blue-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coupon Details Section */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-100">
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <h3 className="text-[13.5px] font-black text-slate-900">Coupon Details</h3>
          </div>
          {order.couponCode ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[12px] font-semibold">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Coupon Code</span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider">{order.couponCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Campaign Name</span>
                  <span className="text-slate-800 font-bold">{order.coupon?.couponName || 'Discount Campaign'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Discount Type</span>
                  <span className="text-slate-800 font-bold capitalize">{String(order.coupon?.discountType || 'FIXED').toLowerCase()}</span>
                </div>
              </div>
              <div className="space-y-3 border-t sm:border-t-0 sm:border-l sm:pl-6 border-slate-100 pt-3 sm:pt-0">
                <div className="flex justify-between">
                  <span className="text-slate-400">Discount Value</span>
                  <span className="text-slate-800 font-bold">
                    {order.coupon?.discountType === 'PERCENTAGE' ? `${order.coupon?.discountValue}%` : formatCurrency(order.coupon?.discountValue || order.discountAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Before Discount</span>
                  <span className="text-slate-800 font-bold">{formatCurrency(order.subtotal || (order.totalAmount + (order.discountAmount || 0)))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Discount Amount</span>
                  <span className="text-red-650 font-bold">- {formatCurrency(order.discountAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2">
                  <span className="text-slate-400">Coupon Applied Status</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Applied</span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-5 text-slate-400 text-[12px] font-bold">
              No Coupon Applied
            </div>
          )}
        </div>

        {/* Payment Details */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-100">
            <Wallet className="w-4 h-4 text-blue-600" />
            <h3 className="text-[13.5px] font-black text-slate-900">Payment Information</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[12px] font-semibold">
            <div className="space-y-3">
              {[{ label: 'Payment Status', value: order.paymentStatus }, { label: 'Payment Method', value: order.paymentMethod }].map(row => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-slate-400">{row.label}</span>
                  <span className="text-slate-800 font-bold">{row.value || '—'}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3 border-t sm:border-t-0 sm:border-l sm:pl-6 border-slate-100 pt-3 sm:pt-0">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-slate-800">{formatCurrency(order.subtotal || order.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Shipping Charge</span>
                <span className="text-slate-800">FREE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tax</span>
                <span className="text-slate-800">₹0</span>
              </div>
              {order.discountAmount ? (
                <div className="flex justify-between text-red-655">
                  <span>Coupon Discount</span>
                  <span>- {formatCurrency(order.discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-slate-100 pt-2.5">
                <span className="text-slate-900 font-extrabold">Grand Total</span>
                <span className="text-[16px] font-black text-blue-600">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main AdminOrders Component (Router)
// ─────────────────────────────────────────────────────────────────────────────

const AdminOrders: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId?: string }>();
  const [listRefreshKey, setListRefreshKey] = useState(0);

  const handleSelectOrder = (id: string) => { navigate(`/admin/orders/${id}`); };
  const handleBack        = ()            => { navigate('/admin/orders'); };
  const handleOrderUpdated = ()           => { setListRefreshKey(k => k + 1); };

  return (
    <AdminLayout>
      <div className="p-5 sm:p-7">
        {orderId ? (
          <OrderDetailPage
            key={orderId}
            orderId={orderId}
            onBack={handleBack}
            onOrderUpdated={handleOrderUpdated}
          />
        ) : (
          <OrderListPage
            key={listRefreshKey}
            onSelectOrder={handleSelectOrder}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
