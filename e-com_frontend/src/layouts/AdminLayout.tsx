import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Boxes,
  BarChart3,
  LogOut,
  Search,
  Settings,
  Bell,
  Menu,
  X,
  Tag,
  Ticket,
  MessageSquare,
  Tags,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { logout as logoutAction } from '../store/authSlice';
import { authService } from '../services/auth.service';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { key: 'orders', label: 'Orders', icon: ShoppingBag, path: '/admin/orders' },
  { key: 'customers', label: 'Customers', icon: Users, path: '/admin/customers' },
  { key: 'products', label: 'Products', icon: Package, path: '/admin/products' },
  { key: 'categories', label: 'Categories', icon: Tag, path: '/admin/categories' },
  { key: 'brands', label: 'Brands', icon: Tags, path: '/admin/brands' },
  { key: 'inventory', label: 'Inventory', icon: Boxes, path: '/admin/inventory' },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { key: 'coupons', label: 'Coupons', icon: Ticket, path: '/admin/coupons' },
  { key: 'reviews', label: 'Reviews', icon: MessageSquare, path: '/admin/reviews' },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { profile } = useSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    authService.logout();
    dispatch(logoutAction());
    navigate('/auth/login');
  };

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-[#F4F6FB] overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[220px] bg-white flex flex-col border-r border-slate-100 shadow-sm transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="px-6 pt-7 pb-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[20px] font-black text-slate-900 tracking-tight leading-none">NatCart</div>
              <div className="text-[9px] font-bold text-blue-600 tracking-[0.18em] uppercase mt-1">Enterprise Tier</div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-slate-50 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.key}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 group ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-[17px] h-[17px] flex-shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="px-3 pb-4 border-t border-slate-100 pt-3 space-y-0.5">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all w-full cursor-pointer"
          >
            <LogOut className="w-[17px] h-[17px] text-slate-400" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-[60px] bg-white border-b border-slate-100 flex items-center px-4 sm:px-6 gap-3 flex-shrink-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-50 text-slate-500"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-350" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search analytics, products or customers..."
              className="w-full h-9 pl-9 pr-4 bg-slate-50 border border-slate-200/60 rounded-xl text-[11.5px] text-slate-700 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>

          <div className="flex items-center space-x-1.5 ml-auto">
            {/* Notification */}
            <button className="w-9 h-9 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
            </button>

            {/* Settings */}
            <button className="w-9 h-9 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
              <Settings className="w-4 h-4" />
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-slate-200 mx-1.5" />

            {/* Admin Profile */}
            {(() => {
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
              const adminDisplayName = getAdminDisplayName();
              const initials = adminDisplayName.slice(0, 2).toUpperCase();

              return (
                <div className="flex items-center space-x-2.5">
                  <div className="text-right hidden sm:block">
                    <div className="text-[12px] font-bold text-slate-800 leading-none">{adminDisplayName}</div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Administrator</div>
                  </div>
                  <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-black flex-shrink-0 shadow-sm">
                    {initials}
                  </div>
                </div>
              );
            })()}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
