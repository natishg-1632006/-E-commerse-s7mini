import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../store';
import { AdminLayout } from '../../layouts/AdminLayout';
import { DashboardSkeleton } from '../../components/admin/AdminSkeletons';
import { orderService } from '../../services/order.service';
import { productService } from '../../services/product.service';
import { inventoryService } from '../../services/inventory.service';
import {
  ShoppingCart,
  Wallet,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Package,
  Clock,
  XCircle,
  RefreshCw,
  ShoppingBag,
  User,
  Boxes,
} from 'lucide-react';

// --- Stat Card Component ---
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  iconBgColor: string;
  growth?: string;
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, iconBgColor, growth, highlight }) => {
  return (
    <div
      className={`relative h-[142px] rounded-[16px] bg-white border p-4 sm:p-5 flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
        highlight 
          ? 'border-red-300 bg-gradient-to-br from-red-50/20 to-white ring-1 ring-red-200' 
          : 'border-slate-100 bg-gradient-to-br from-slate-50/5 to-white'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col min-w-0">
          <span className="text-[11.5px] font-bold text-slate-400 uppercase tracking-wider truncate">
            {title}
          </span>
          <span className="text-[9.5px] text-slate-455 font-bold tracking-wide mt-0.5">
            {subtitle}
          </span>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBgColor}`}>
          {icon}
        </div>
      </div>
      
      <div className="flex items-end justify-between mt-1">
        <span className={`text-3xl font-black tracking-tight leading-none ${highlight ? 'text-red-650' : 'text-slate-800'}`}>
          {value}
        </span>
        {growth && (
          <span className="text-[11px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg flex items-center">
            {growth}
          </span>
        )}
      </div>
    </div>
  );
};

// --- Types for real data ---
interface DashboardOrder {
  id: string;
  displayId?: string;
  customer: string;
  amount: string;
  status: string;
  time: string;
  items: string;
  payment: string;
}

interface DashboardProduct {
  id: string;
  rank: string;
  name: string;
  category: string;
  rev: string;
  stock: number;
  img: string | null;
  price: number;
}

// --- Order Status Badge component ---
const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'Completed') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-650 border border-emerald-100 flex-shrink-0">
        <CheckCircle className="w-2.5 h-2.5" />
        <span>Completed</span>
      </span>
    );
  }
  if (status === 'Pending') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 flex-shrink-0">
        <Clock className="w-2.5 h-2.5" />
        <span>Pending</span>
      </span>
    );
  }
  if (status === 'Cancelled') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-500 border border-red-100 flex-shrink-0">
        <XCircle className="w-2.5 h-2.5" />
        <span>Cancelled</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 flex-shrink-0">
      <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" />
      <span>Processing</span>
    </span>
  );
};

// --- Product Stock Status Badge component ---
const ProductStockBadge: React.FC<{ stock: number }> = ({ stock }) => {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-500 border border-red-100 flex-shrink-0">
        Out of Stock
      </span>
    );
  }
  if (stock <= 10) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 flex-shrink-0">
        Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-650 border border-emerald-100 flex-shrink-0">
      In Stock
    </span>
  );
};

const AdminDashboard: React.FC = () => {
  const { profile } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Real data state
  const [recentOrders, setRecentOrders] = useState<DashboardOrder[]>([]);
  const [topSelling, setTopSelling] = useState<DashboardProduct[]>([]);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayOrdersCount, setTodayOrdersCount] = useState(0);
  const [completedOrdersCount, setCompletedOrdersCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ordersRes, productsRes, inventoryRes] = await Promise.all([
          orderService.getOrders({ limit: 1000 }),
          productService.getProducts({ limit: 1000 }),
          inventoryService.getAllInventory(),
        ]);

        // ── Orders ──
        const allOrders = (ordersRes.orders || []).filter((o: any) => {
          const st = (o.orderStatus || '').toUpperCase();
          return st !== 'PENDING_PAYMENT' && st !== 'PENDING PAYMENT' && st !== 'PENDING';
        });
        const todayStr = new Date().toISOString().split('T')[0];

        const revenue = allOrders
          .filter(o => (o.createdAt || '').startsWith(todayStr) && String(o.paymentStatus || '').toUpperCase() === 'PAID')
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        const todayCount = allOrders.filter(o => (o.createdAt || '').startsWith(todayStr)).length;

        const completedCount = allOrders.filter(o =>
          ['Delivered', 'Completed'].includes(o.orderStatus || '')
        ).length;

        setTodayRevenue(revenue);
        setTodayOrdersCount(todayCount);
        setCompletedOrdersCount(completedCount);

        // Recent 5 orders
        const mapped: DashboardOrder[] = allOrders.slice(0, 5).map(o => ({
          id: o.orderId,
          displayId: o.displayId || o.orderId,
          customer: o.shippingAddress?.fullName || o.customerInfo?.fullName || 'Unknown',
          amount: `₹${(o.totalAmount || 0).toLocaleString('en-IN')}`,
          status: o.orderStatus || 'Pending Payment',
          time: o.createdAt
            ? new Date(o.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : '—',
          items: `${o.items?.length ?? 0} Item${(o.items?.length ?? 0) !== 1 ? 's' : ''}`,
          payment: o.paymentMethod || 'Online',
        }));
        setRecentOrders(mapped);

        // ── Products ──
        let allProducts: any[] = [];
        if (productsRes) {
          if (Array.isArray(productsRes)) {
            allProducts = productsRes;
          } else {
            allProducts = (productsRes as any).products || (productsRes as any).data || [];
          }
        }

        let inventoryList: any[] = [];
        if (inventoryRes) {
          if (Array.isArray(inventoryRes)) {
            inventoryList = inventoryRes;
          } else {
            inventoryList = inventoryRes.data || [];
          }
        }

        const oos = inventoryList.filter(inv => {
          const isOut = String(inv.status).trim().toLowerCase() === 'out of stock' || 
                        Number(inv.currentStock ?? inv.availableStock ?? 0) === 0;
          return isOut;
        }).length;
        setOutOfStockCount(oos);

        const medals = ['🥇', '🥈', '🥉', '4', '5'];
        const top: DashboardProduct[] = allProducts.slice(0, 5).map((p: any, idx: number) => {
          const invItem = inventoryList.find(inv => inv.productId === p.id || inv.productId === p.productId);
          const stockCount = invItem ? Number(invItem.currentStock ?? invItem.availableStock ?? 0) : 0;
          return {
            id: p.id || p.productId || '',
            rank: medals[idx] || String(idx + 1),
            name: p.name || 'Unknown Product',
            category: p.category || p.categoryName || 'Uncategorized',
            rev: `₹${(p.price || 0).toLocaleString('en-IN')}`,
            stock: stockCount,
            img: p.images?.[0]?.imageUrl || p.img || null,
            price: Number(p.price ?? 0),
          };
        });
        setTopSelling(top);

      } catch (err) {
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleTabChange = (tab: 'orders' | 'products') => {
    if (tab === activeTab) return;
    setIsRefreshing(true);
    setActiveTab(tab);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 300);
  };

  const getAdminDisplayName = () => {
    if (profile?.email) {
      const part = profile.email.split('@')[0];
      if (part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      }
    }
    if (profile?.fullName) {
      return profile.fullName;
    }
    return 'Admin';
  };

  const adminName = getAdminDisplayName();

  return (
    <AdminLayout>
      <div className="p-5 sm:p-7 space-y-6">
        {/* Welcome Header */}
        <div className="border-b border-slate-100 pb-5">
          <div className="text-[12px] font-bold text-blue-600 tracking-wider uppercase">Dashboard</div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Welcome back, {adminName}
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-0.5">
            Here's today's overview of your tech marketplace.
          </p>
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Compact statistics grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Revenue"
            value={`₹${todayRevenue.toLocaleString('en-IN')}`}
            subtitle="Based on paid orders today"
            icon={<Wallet className="w-[18px] h-[18px]" />}
            iconBgColor="bg-blue-50 text-blue-600"
          />
          <StatCard
            title="Today's Orders"
            value={todayOrdersCount}
            subtitle="All orders placed today"
            icon={<ShoppingCart className="w-[18px] h-[18px]" />}
            iconBgColor="bg-purple-50 text-purple-600"
          />
          <StatCard
            title="Completed Orders"
            value={completedOrdersCount}
            subtitle="Delivered + Completed"
            icon={<CheckCircle className="w-[18px] h-[18px]" />}
            iconBgColor="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            title="Out of Stock"
            value={outOfStockCount}
            subtitle="Needs Attention"
            icon={<AlertTriangle className="w-[18px] h-[18px]" />}
            iconBgColor="bg-red-50 text-red-500"
            highlight={outOfStockCount > 0}
          />
        </div>

        {/* Tabbed component container */}
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

          {/* Tab Selector Header */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-100 px-5 py-2 gap-3 bg-slate-50/20">
            {/* Tabs */}
            <div className="flex items-center space-x-6">
              <button
                onClick={() => handleTabChange('orders')}
                className={`py-2 text-[13.5px] font-bold relative transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'text-blue-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Recent Orders
                {activeTab === 'orders' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
              <button
                onClick={() => handleTabChange('products')}
                className={`py-2 text-[13.5px] font-bold relative transition-all cursor-pointer ${
                  activeTab === 'products'
                    ? 'text-blue-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Top Selling Products
                {activeTab === 'products' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            </div>
            
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">
              {activeTab === 'orders' ? 'Latest customer orders' : 'Best performing products'}
            </div>
          </div>

          <div className="p-3 sm:p-4 flex-1 min-h-[280px] relative">
            {isRefreshing && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] z-10 p-3 sm:p-4 space-y-1.5 pointer-events-none">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center px-3.5 py-2.5 rounded-xl border border-slate-50 gap-2.5 sm:gap-0 bg-white"
                  >
                    {/* Col 1 */}
                    <div className="col-span-4 flex items-center space-x-3 w-full">
                      <div className="w-8 h-8 rounded-lg bg-slate-200 animate-pulse flex-shrink-0" />
                      <div className="flex-grow space-y-1.5 min-w-0">
                        <div className="h-3.5 bg-slate-200 animate-pulse rounded w-1/2" />
                        <div className="h-2.5 bg-slate-200 animate-pulse rounded w-1/3" />
                      </div>
                    </div>
                    {/* Col 2 */}
                    <div className="col-span-2">
                      <div className="h-3.5 bg-slate-200 animate-pulse rounded w-16" />
                    </div>
                    {/* Col 3 */}
                    <div className="col-span-2">
                      <div className="h-3.5 bg-slate-200 animate-pulse rounded w-20" />
                    </div>
                    {/* Col 4 */}
                    <div className="col-span-2">
                      <div className="h-5 bg-slate-200 animate-pulse rounded-full w-16" />
                    </div>
                    {/* Col 5 */}
                    <div className="col-span-1">
                      <div className="h-3.5 bg-slate-200 animate-pulse rounded w-10" />
                    </div>
                    {/* Col 6 */}
                    <div className="col-span-1 flex justify-end">
                      <div className="h-4 w-4 bg-slate-200 animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={`space-y-1.5 transition-opacity duration-200 ${isRefreshing ? 'opacity-30 pointer-events-none' : ''}`}>
              {activeTab === 'orders' ? (
                <div className="space-y-1.5 animate-fadeIn">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                        className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center px-3.5 py-2.5 rounded-xl border border-slate-100 hover:border-blue-150 hover:bg-slate-50/40 hover:shadow-sm transition-all duration-200 cursor-pointer group gap-2.5 sm:gap-0"
                      >
                        {/* 1. Order details: col-span-4 */}
                        <div className="col-span-4 flex items-center space-x-3 min-w-0 w-full">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 text-left">
                            <div className="text-[12.5px] font-bold text-slate-800 leading-tight">
                              {order.displayId || order.id}
                            </div>
                            <div className="text-[10.5px] text-slate-400 font-semibold mt-0.5 leading-none flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-355 flex-shrink-0" />
                              <span>{order.customer}</span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Items: col-span-2 */}
                        <div className="col-span-2 flex items-center space-x-1.5 text-[11px] text-slate-450 font-bold sm:pl-2">
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          <span>{order.items}</span>
                        </div>

                        {/* 3. Amount: col-span-2 */}
                        <div className="col-span-2 flex items-center space-x-1.5 text-[12px] font-extrabold text-slate-800 sm:pl-2">
                          <Wallet className="w-3.5 h-3.5 text-slate-400" />
                          <span>{order.amount}</span>
                        </div>

                        {/* 4. Status: col-span-2 */}
                        <div className="col-span-2 flex items-center sm:pl-2">
                          <OrderStatusBadge status={order.status} />
                        </div>

                        {/* 5. Time: col-span-1 */}
                        <div className="col-span-1 flex items-center space-x-1 text-[10.5px] text-slate-400 font-semibold sm:pl-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{order.time}</span>
                        </div>

                        {/* 6. Action: col-span-1 */}
                        <div className="col-span-1 flex items-center justify-end w-full sm:w-auto">
                          <ChevronRight className="w-4 h-4 text-slate-350 group-hover:text-slate-655 transition-colors" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="text-4xl mb-2">📦</div>
                      <div className="text-[13px] font-bold text-slate-500">No recent orders available.</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Customer orders will show up here.</div>
                    </div>
                  )}

                  {/* View All Button */}
                  <div className="pt-3 flex justify-center border-t border-slate-50 mt-2">
                    <button
                      onClick={() => navigate('/admin/orders')}
                      className="px-5 h-8.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11.5px] font-bold text-slate-700 transition-all flex items-center space-x-1 shadow-sm cursor-pointer"
                    >
                      <span>View All Orders</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 animate-fadeIn">
                  {topSelling.map((product) => {
                    const isMedal = ['🥇', '🥈', '🥉'].includes(product.rank);
                    return (
                      <div
                        key={product.id || product.name}
                        onClick={() => navigate(`/admin/products/${product.id}`)}
                        className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center px-3.5 py-2.5 rounded-xl border border-slate-100 hover:border-blue-150 hover:bg-slate-50/40 hover:shadow-sm transition-all duration-200 cursor-pointer group gap-2.5 sm:gap-0"
                      >
                        {/* 1. Product details: col-span-4 */}
                        <div className="col-span-4 flex items-center space-x-3 min-w-0 w-full">
                          {/* Rank Badge */}
                          <div className="w-5.5 h-5 flex items-center justify-center flex-shrink-0 text-base font-bold text-slate-450">
                            {isMedal ? (
                              <span>{product.rank}</span>
                            ) : (
                              <span className="text-[9px] bg-slate-100 text-slate-500 w-4 h-4 rounded-full flex items-center justify-center font-black">
                                {product.rank}
                              </span>
                            )}
                          </div>

                          {/* Image */}
                          <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0 bg-slate-50">
                            {product.img ? (
                              <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                          </div>

                          {/* Name & Category */}
                          <div className="min-w-0 text-left">
                            <div className="text-[12.5px] font-bold text-slate-800 leading-tight truncate">
                              {product.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold mt-0.5 leading-none">
                              {product.category}
                            </div>
                          </div>
                        </div>

                        {/* 2. Price: col-span-2 */}
                        <div className="col-span-2 flex items-center space-x-1 text-[11px] text-slate-500 font-semibold sm:pl-2">
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-350" />
                          <span>{product.rev}</span>
                        </div>

                        {/* 3. Stock count: col-span-2 */}
                        <div className="col-span-2 flex items-center space-x-1 text-[12px] font-extrabold text-slate-800 sm:pl-2">
                          <Boxes className="w-3.5 h-3.5 text-slate-350" />
                          <span>{product.stock} in Stock</span>
                        </div>

                        {/* 4. Status indicator: col-span-2 */}
                        <div className="col-span-2 flex items-center sm:pl-2">
                          <ProductStockBadge stock={product.stock} />
                        </div>

                        {/* 5. In stock quantity tracker: col-span-1 */}
                        <div className="col-span-1 flex items-center space-x-1 text-[10.5px] text-slate-450 font-semibold sm:pl-1">
                          <Boxes className="w-3.5 h-3.5 text-slate-350" />
                          <span className="truncate">{product.stock} Stock</span>
                        </div>

                        {/* 6. Action Arrow: col-span-1 */}
                        <div className="col-span-1 flex items-center justify-end w-full sm:w-auto">
                          <ChevronRight className="w-4 h-4 text-slate-350 group-hover:text-slate-650 transition-colors" />
                        </div>
                      </div>
                    );
                  })}

                  {/* View All Button */}
                  <div className="pt-3 flex justify-center border-t border-slate-50 mt-2">
                    <button
                      onClick={() => navigate('/admin/products')}
                      className="px-5 h-8.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11.5px] font-bold text-slate-700 transition-all flex items-center space-x-1 shadow-sm cursor-pointer"
                    >
                      <span>View All Products</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
