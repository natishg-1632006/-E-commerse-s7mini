import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Settings, User, LogOut, ArrowRight, X, Boxes, Tag } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { logout as logoutAction } from '../../../store/authSlice';
import { authService } from '../../../services/auth.service';

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, profile } = useSelector((state: RootState) => state.auth);

  const menuLinks = [
    { to: '/', label: 'Home Page' },
    { to: '/?all=true', label: 'Shop All Products', icon: Boxes },
    { to: '/brands', label: 'Explore Brands', icon: Tag },
    { to: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/orders', label: 'My Orders', icon: ShoppingBag },
    { to: '/profile', label: 'My Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    authService.logout();
    dispatch(logoutAction());
    onClose();
    navigate('/auth/login');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1200] md:hidden flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm"
          />

          {/* Menu Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed top-0 bottom-0 right-0 w-[280px] bg-white shadow-xl flex flex-col justify-between py-6 px-5 border-l border-slate-100 z-10"
          >
            {/* Upper Section */}
            <div className="flex flex-col space-y-6">
              {/* Close Button */}
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all rounded-xl cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Card snippet */}
              {isAuthenticated && profile && (
                <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-150 flex items-center justify-center font-bold text-blue-700 text-sm">
                    {profile.fullName ? profile.fullName.substring(0, 2).toUpperCase() : 'US'}
                  </div>
                  <div className="flex flex-col items-start truncate text-left">
                    <span className="text-xs font-bold text-slate-800 truncate w-40">{profile.fullName || 'User Profile'}</span>
                    <span className="text-[10px] text-slate-450 font-semibold truncate w-40">{profile.email}</span>
                  </div>
                </div>
              )}

              {/* Links */}
              <nav className="flex flex-col space-y-1 text-left">
                {menuLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={onClose}
                    className="flex items-center space-x-3.5 py-3 px-3 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors text-xs font-bold"
                  >
                    {link.icon && <link.icon className="w-4.5 h-4.5 text-slate-400" />}
                    <span>{link.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Logout/Login Button */}
            <div className="pt-6 border-t border-slate-100">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full py-3 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-650 transition-colors rounded-xl text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <Link
                  to="/auth/login"
                  onClick={onClose}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
