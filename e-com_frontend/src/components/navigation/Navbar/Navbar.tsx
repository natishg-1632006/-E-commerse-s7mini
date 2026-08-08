import React, { useState, useRef, useEffect } from 'react';
import { Logo } from '../../common/Logo';
import { ShoppingCart, Menu, X, Heart, ChevronDown } from 'lucide-react';
import { UserMenu } from '../UserMenu';
import { MobileMenu } from '../MobileMenu';
import { Link } from 'react-router-dom';
import { useClickOutside } from '../../../hooks/useClickOutside';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../../store';
import { fetchCart } from '../../../store/cartSlice';
import { productService } from '../../../services/product.service';
import { inventoryService } from '../../../services/inventory.service';
import { getImageUrl } from '../../../utils/imageHelper';

const formatCategoryName = (name: string) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export interface NavbarProps {
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  showSidebarToggle = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMegamenuOpen, setIsMegamenuOpen] = useState(false);
  const megamenuRef = useRef<HTMLDivElement | null>(null);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const res = await productService.getCategories();
        const list = res.data || (Array.isArray(res) ? res : []);
        
        // Fetch all products to count/verify category products in stock
        let prodList: any[] = [];
        try {
          const prodRes = await productService.getProducts({ limit: 1000 });
          const rawProdList = prodRes.data || prodRes.products || (Array.isArray(prodRes) ? prodRes : []);
          
          const productIds = rawProdList.map((p: any) => p.productId || p.id).filter(Boolean);
          let stockMap: Record<string, number> = {};
          if (productIds.length > 0) {
            try {
              const stockRes = await inventoryService.checkStockBatch(productIds);
              const stockList = stockRes.data || stockRes || [];
              if (Array.isArray(stockList)) {
                stockList.forEach((s: any) => {
                  stockMap[s.productId] = s.exists ? s.availableStock : 10;
                });
              }
            } catch (err) {
              console.error('Error fetching batch stock in navbar:', err);
            }
          }

          prodList = rawProdList.map((p: any) => {
            const pId = p.productId || p.id;
            return {
              ...p,
              stock: stockMap[pId] !== undefined ? stockMap[pId] : 10
            };
          });
        } catch (prodErr) {
          console.error('Error fetching products for navbar category filter:', prodErr);
        }

        const activeCategories = list.filter((c: any) => {
          if ((c.status || 'ACTIVE').toUpperCase() !== 'ACTIVE') return false;
          
          // Verify category has at least 1 in-stock product
          return prodList.some((p: any) => {
            const isInCategory = p.categoryId === c.categoryId || p.categoryId === c.id || String(p.category || '').toLowerCase().trim() === String(c.name || '').toLowerCase().trim();
            const stock = p.stock !== undefined ? p.stock : 10;
            return isInCategory && stock > 0;
          });
        });

        setCategoriesList(activeCategories);
      } catch (err) {
        console.error('Error fetching navbar categories:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const { items } = useSelector((state: RootState) => state.cart);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const [shouldPop, setShouldPop] = useState(false);
  const prevItemsCount = useRef(totalItems);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (totalItems > prevItemsCount.current) {
      setShouldPop(true);
      const timer = setTimeout(() => setShouldPop(false), 300);
      return () => clearTimeout(timer);
    }
    prevItemsCount.current = totalItems;
  }, [totalItems]);

  useClickOutside(megamenuRef, () => setIsMegamenuOpen(false));

  return (
    <div className="sticky top-0 w-full flex flex-col items-stretch z-[1100]">
      <header className="w-full h-[64px] bg-white/85 backdrop-blur-md border-b border-slate-200/60 select-none">
        <div className="max-w-7xl h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 relative">
          {/* Left Side: Logo / Menu Toggle */}
          <div className="flex items-center space-x-5">
            {showSidebarToggle && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors rounded-xl cursor-pointer mr-1 hidden md:block"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <Logo size="sm" />

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-5.5 text-xs font-bold text-slate-655 mt-0.5">
              <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
              <button
                onClick={() => setIsMegamenuOpen(!isMegamenuOpen)}
                className="hover:text-blue-600 transition-colors flex items-center space-x-1 cursor-pointer focus:outline-none bg-transparent border-none font-bold text-xs"
              >
                <span>Categories</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-250 ${isMegamenuOpen ? 'transform rotate-180' : ''}`} />
              </button>
              <Link to="/?all=true" className="hover:text-blue-600 transition-colors">Products</Link>
              <Link to="/brands" className="hover:text-blue-600 transition-colors">Brands</Link>
            </nav>
          </div>



          {/* Right Side: Navigation Actions */}
          <div className="flex items-center space-x-3.5">
            {/* Favorites Icon */}
            <Link
              to="/wishlist"
              className="p-2 text-slate-500 hover:text-red-500 transition-colors rounded-xl relative hover:bg-slate-50 cursor-pointer flex items-center justify-center border-none bg-transparent"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Cart Widget */}
            <Link
              to="/cart"
              className="p-2 text-slate-500 hover:text-slate-800 transition-colors rounded-xl relative hover:bg-slate-50 cursor-pointer flex items-center justify-center border-none bg-transparent"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className={`absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9.5px] font-black transition-all duration-300 ${shouldPop ? 'scale-130 shadow-md bg-blue-700' : 'scale-100'}`}>
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User Profile Dropdown */}
            <UserMenu />

            {/* Mobile Navigation Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors rounded-xl lg:hidden cursor-pointer flex items-center justify-center border-none bg-transparent"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Categories Megamenu Dropdown */}
          {isMegamenuOpen && (
            <div
              ref={megamRef => { megamenuRef.current = megamRef; }}
              className="absolute top-[64px] left-4 lg:left-32 w-[calc(100vw-32px)] max-w-lg bg-white border border-slate-200/50 shadow-[0_24px_50px_rgba(15,23,42,0.06)] rounded-[24px] p-6 z-[1200] overflow-hidden"
            >
              {categoriesLoading ? (
                <div className="w-full py-8 flex flex-col space-y-4 animate-pulse">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-10 bg-slate-105 rounded-xl" />
                    <div className="h-10 bg-slate-105 rounded-xl" />
                    <div className="h-10 bg-slate-105 rounded-xl" />
                    <div className="h-10 bg-slate-105 rounded-xl" />
                  </div>
                </div>
              ) : categoriesList.length === 0 ? (
                <div className="w-full py-8 text-center text-slate-400 font-semibold text-xs select-none">
                  No active categories found
                </div>
              ) : (
                <div className="w-full grid grid-cols-2 gap-4">
                  {categoriesList.map((cat) => {
                    const catImage = getImageUrl(cat);
                    return (
                      <Link
                        key={cat.categoryId}
                        to={`/?category=${cat.categoryId}`}
                        onClick={() => setIsMegamenuOpen(false)}
                        className="flex items-center space-x-3.5 p-3 rounded-2xl border border-slate-100 hover:border-blue-150 hover:bg-blue-50/30 transition-all select-none group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100/80 overflow-hidden flex items-center justify-center flex-shrink-0">
                          <img src={catImage} alt={cat.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                        <div className="flex-grow min-w-0 text-left">
                          <h4 className="text-[12.5px] font-black text-slate-850 truncate leading-tight group-hover:text-blue-600 transition-colors">
                            {formatCategoryName(cat.name)}
                          </h4>
                          {cat.slug && (
                            <p className="text-[9.5px] font-bold text-slate-400 truncate mt-0.5">
                              {cat.slug}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </div>
  );
};

export default Navbar;
