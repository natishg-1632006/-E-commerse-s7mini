import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/ui/Card';
import { Checkbox } from '../components/ui/Checkbox';
import { Button } from '../components/ui/Button';
import { Rating } from '../components/ui/Rating';
import { Price } from '../components/ui/Price';
import { Search } from '../components/ui/Search';
import { Pagination } from '../components/ui/Pagination';
import { Drawer } from '../components/ui/Drawer';
import {
  ShoppingCart,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  Check,
  Sparkles,
  Truck,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useClickOutside } from '../hooks/useClickOutside';
import { cn } from '../lib/cn';
import { useDispatch, useSelector } from 'react-redux';
import { addToCartBackend } from '../store/cartSlice';
import type { RootState, AppDispatch } from '../store';

import heroBannerImg from '../assets/future_tech_banner.jpg';

import { productService } from '../services/product.service';
import { brandService } from '../services/brand.service';
import { reviewService } from '../services/review.service';
import { inventoryService } from '../services/inventory.service';
import { getImageUrl } from '../utils/imageHelper';

const formatCategoryName = (name: string) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const CategoryIcon: React.FC<{ name: string; isActive: boolean }> = ({ name, isActive }) => {
  const norm = name.toLowerCase();

  // 1. For You / Shopping Bag
  if (norm === 'all' || norm.includes('all') || norm.includes('for you')) {
    return (
      <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 8V7C6 4.79086 7.79086 3 10 3C12.2091 3 14 4.79086 14 7V8" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round"/>
        <rect x="4" y="8" width="12" height="12" rx="3" stroke="#1E293B" strokeWidth="1.8" fill={isActive ? "#EFF6FF" : "#F8FAFC"}/>
        <path d="M4 14C4 11.5 6 9.5 10 9.5C14 9.5 16 11.5 16 14" fill="#FACC15"/>
        <path d="M4 14C4 11.5 6 9.5 10 9.5C14 9.5 16 11.5 16 14" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    );
  }

  // 2. Computing / Laptop
  if (norm.includes('computing') || norm.includes('laptop') || norm.includes('computer')) {
    return (
      <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="5" width="16" height="11" rx="2" stroke="#1E293B" strokeWidth="1.8"/>
        <path d="M2 18H22" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M5 16L3 18" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M19 16L21 18" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M2 18H22L20 16H4L2 18Z" fill="#FACC15" stroke="#1E293B" strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
    );
  }

  // 3. Audio / Headphones
  if (norm.includes('audio') || norm.includes('headphone') || norm.includes('buds') || norm.includes('sound')) {
    return (
      <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 14C3 9.02944 7.02944 5 12 5C16.9706 5 21 9.02944 21 14" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round"/>
        <rect x="2" y="12" width="4" height="7" rx="2" fill="#FACC15" stroke="#1E293B" strokeWidth="1.8"/>
        <rect x="18" y="12" width="4" height="7" rx="2" fill="#FACC15" stroke="#1E293B" strokeWidth="1.8"/>
      </svg>
    );
  }

  // 4. Wearables / Smartwatch
  if (norm.includes('wear') || norm.includes('watch')) {
    return (
      <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="7" y="7" width="10" height="10" rx="3" stroke="#1E293B" strokeWidth="1.8"/>
        <path d="M9 7V3C9 2.5 9.5 2 10 2H14C14.5 2 15 2.5 15 3V7" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M9 17V21C9 21.5 9.5 22 10 22H14C14.5 22 15 21.5 15 21V17" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="12" cy="12" r="3" fill="#FACC15" stroke="#1E293B" strokeWidth="1.8"/>
      </svg>
    );
  }

  // 5. Mobiles / Smartphone
  if (norm.includes('mobile') || norm.includes('phone') || norm.includes('smartphone')) {
    return (
      <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="3" width="12" height="18" rx="3" stroke="#1E293B" strokeWidth="1.8"/>
        <rect x="8" y="16" width="8" height="3" rx="1" fill="#FACC15" stroke="#1E293B" strokeWidth="1.5"/>
        <line x1="11" y1="5" x2="13" y2="5" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    );
  }

  // 6. Fashion
  if (norm.includes('fashion') || norm.includes('cloth') || norm.includes('apparel')) {
    return (
      <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 3H15L21 7V10L18 11V21H6V11L3 10V7L9 3Z" stroke="#1E293B" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M6 17H18V21H6V17Z" fill="#FACC15" stroke="#1E293B" strokeWidth="1.8"/>
        <path d="M9 3C9 4.5 10 5.5 12 5.5C14 5.5 15 4.5 15 3" stroke="#1E293B" strokeWidth="1.8"/>
      </svg>
    );
  }

  // 7. Home
  if (norm.includes('home') || norm.includes('decor') || norm.includes('lamp')) {
    return (
      <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L3 9V21H21V9L12 2Z" stroke="#1E293B" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M12 2L3 9H21L12 2Z" fill="#FACC15" stroke="#1E293B" strokeWidth="1.8" strokeLinejoin="round"/>
        <rect x="10" y="14" width="4" height="7" stroke="#1E293B" strokeWidth="1.8"/>
      </svg>
    );
  }

  // 8. Appliances / TV
  if (norm.includes('appliance') || norm.includes('tv') || norm.includes('television')) {
    return (
      <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="18" height="12" rx="2" stroke="#1E293B" strokeWidth="1.8"/>
        <path d="M8 20H16" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M12 16V20" stroke="#1E293B" strokeWidth="1.8"/>
        <path d="M3 14H21V16H3V14Z" fill="#FACC15" stroke="#1E293B" strokeWidth="1.8"/>
      </svg>
    );
  }

  // 9. Toys
  if (norm.includes('toy') || norm.includes('baby')) {
    return (
      <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="13" r="6" stroke="#1E293B" strokeWidth="1.8"/>
        <circle cx="7" cy="6" r="3" stroke="#1E293B" strokeWidth="1.8"/>
        <circle cx="17" cy="6" r="3" stroke="#1E293B" strokeWidth="1.8"/>
        <circle cx="12" cy="13" r="3" fill="#FACC15" stroke="#1E293B" strokeWidth="1.8"/>
      </svg>
    );
  }

  // 10. Sports
  if (norm.includes('sports') || norm.includes('fitness') || norm.includes('gym')) {
    return (
      <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 18L18 6" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="18" cy="6" r="2.5" fill="#FACC15" stroke="#1E293B" strokeWidth="1.8"/>
        <rect x="4" y="16" width="4" height="4" rx="1" stroke="#1E293B" strokeWidth="1.8"/>
      </svg>
    );
  }

  // Fallback: Sparkles with yellow center
  return (
    <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L14.5 9.5L21 12L14.5 14.5L12 21L9.5 14.5L3 12L9.5 9.5L12 3Z" stroke="#1E293B" strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="2.5" fill="#FACC15" stroke="#1E293B" strokeWidth="1.8"/>
    </svg>
  );
};

const SkeletonProductCard: React.FC = () => {
  return (
    <div className="p-3.5 rounded-[28px] border border-slate-200/50 bg-white/95 shadow-[0_8px_30px_rgba(15,23,42,0.02)] flex flex-col justify-between items-stretch overflow-hidden shimmer-sweep select-none">
      <div className="relative w-full aspect-[4/3] rounded-[22px] bg-slate-200 overflow-hidden flex-shrink-0" />
      <div className="flex flex-col flex-grow justify-between text-left mt-4">
        <div className="space-y-2 mb-2">
          <div className="h-3 w-12 bg-slate-300 rounded" />
          <div className="h-4 w-3/4 bg-slate-300 rounded mt-1.5" />
          <div className="flex items-center space-x-1.5 pt-1">
            <div className="h-3.5 w-16 bg-slate-200 rounded" />
            <div className="h-3.5 w-6 bg-slate-200 rounded" />
          </div>
          <div className="flex space-x-1.5 pt-1">
            <div className="h-4.5 w-10 bg-slate-200 rounded-[5px]" />
            <div className="h-4.5 w-10 bg-slate-200 rounded-[5px]" />
          </div>
        </div>
        <div className="border-t border-slate-100/80 my-3" />
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex flex-col space-y-1">
            <div className="h-4 w-16 bg-slate-300 rounded" />
            <div className="h-3 w-10 bg-slate-200 overflow-hidden" />
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-300" />
        </div>
      </div>
    </div>
  );
};



export const Marketplace: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  const { items: cartItems } = useSelector((state: RootState) => state.cart);

  // Dynamic products and categories list
  const [rawProducts, setRawProducts] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
  const [reviewsStats, setReviewsStats] = useState<Record<string, { sum: number; count: number; avgRating: number }>>({});

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRam, setSelectedRam] = useState<string[]>([]);
  const [selectedStorage, setSelectedStorage] = useState<string[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>({});

  const handleSpecChange = (key: string, value: string) => {
    setSelectedSpecs((prev) => {
      const current = prev[key] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      const newSpecs = { ...prev, [key]: updated };
      if (newSpecs[key].length === 0) {
        delete newSpecs[key];
      }
      return newSpecs;
    });
    setCurrentPage(1);
  };

  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const [showShopGrid, setShowShopGrid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);

  // Price filter states
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(400000);
  const [dbBrands, setDbBrands] = useState<string[]>([]);

  // Responsive Drawer state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Custom sort dropdown state
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(sortRef, () => setIsSortOpen(false));

  // Debounced search logic (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Categories on component mount
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
              console.error('Error fetching batch stock in categories:', err);
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
          console.error('Error fetching products for category filter:', prodErr);
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
        console.error('Error fetching categories:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);


  // Sync URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const brand = params.get('brand');
    const search = params.get('search');
    const category = params.get('category');
    const all = params.get('all');

    if (brand || search || category || all) {
      if (brand) setSelectedBrands([brand]);
      else setSelectedBrands([]);

      if (search) setSearchQuery(search);
      else setSearchQuery('');

      if (category) setSelectedCategory(category);
      else setSelectedCategory(null);

      setSelectedRam([]);
      setSelectedStorage([]);
      setMinPrice(0);
      setMaxPrice(400000);
      setShowShopGrid(true);
    } else {
      setShowShopGrid(false);
      setSelectedBrands([]);
      setSelectedCategory(null);
      setSelectedRam([]);
      setSelectedStorage([]);
      setMinPrice(0);
      setMaxPrice(400000);
      setSearchQuery('');
    }
  }, [location]);

  // Load backend products reactively based on search (category is filtered locally due to Dynamo DB schema mismatch)
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const params: any = {
          limit: 100, // Fetch all products matching current search query to filter locally
        };

        if (debouncedSearch) params.search = debouncedSearch;

        const res = await productService.getProducts(params);
        const list = res.data || res.products || (Array.isArray(res) ? res : []);
        
        // Use batch check stock
        const productIds = list.map((p: any) => p.productId || p.id).filter(Boolean);
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
            console.error('Error fetching batch stock in fetchProducts:', err);
          }
        }

        const productsWithStock = list.map((p: any) => {
          const pId = p.productId || p.id;
          return {
            ...p,
            stock: stockMap[pId] !== undefined ? stockMap[pId] : 10
          };
        });

        const inStockList = productsWithStock.filter((p: any) => {
          const stock = p.stock !== undefined ? p.stock : 10;
          return stock > 0;
        });
        setRawProducts(inStockList);
        setCurrentPage(1);
      } catch (err) {
        console.error('Error fetching catalog products:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (showShopGrid) {
      fetchProducts();
    }
  }, [showShopGrid, debouncedSearch]);

  // Locally filtered products by category only (used for sidebar filter options)
  const categoryProducts = useMemo(() => {
    let result = [...rawProducts];
    if (selectedCategory) {
      const lowerSelected = selectedCategory.toLowerCase();
      result = result.filter((p) => {
        const pCat = p.categoryName || p.category || '';
        return (
          p.categoryId === selectedCategory ||
          pCat.toLowerCase() === lowerSelected
        );
      });
    }
    return result;
  }, [rawProducts, selectedCategory]);

  // Extract dynamic filter checkboxes based on category products
  const availableBrands = useMemo(() => {
    const brands = categoryProducts.map((p) => p.brand).filter(Boolean);
    return Array.from(new Set(brands)).sort() as string[];
  }, [categoryProducts]);

  const availableRam = useMemo(() => {
    const rams = categoryProducts.map((p) => p.specifications?.ram || p.specifications?.RAM).filter(Boolean);
    return Array.from(new Set(rams)).sort() as string[];
  }, [categoryProducts]);

  const availableStorage = useMemo(() => {
    const storages = categoryProducts.map((p) => p.specifications?.storage || p.specifications?.Storage).filter(Boolean);
    return Array.from(new Set(storages)).sort() as string[];
  }, [categoryProducts]);

  const dynamicSpecOptions = useMemo(() => {
    const specsMap: Record<string, Set<string>> = {};
    categoryProducts.forEach((p) => {
      if (p.specifications && typeof p.specifications === 'object') {
        Object.entries(p.specifications).forEach(([key, value]) => {
          if (!value || typeof value !== 'string') return;
          const normKey = key.trim().toLowerCase();
          // Skip RAM and Storage since they have dedicated filters
          if (normKey === 'ram' || normKey === 'storage') return;
          // Filter out description keys (like Ports, Battery, Security) by checking length
          if (value.length > 25) return;
          
          const originalKey = key.trim();
          if (!specsMap[originalKey]) {
            specsMap[originalKey] = new Set<string>();
          }
          specsMap[originalKey].add(value.trim());
        });
      }
    });

    const result: Record<string, string[]> = {};
    Object.entries(specsMap).forEach(([key, valueSet]) => {
      const values = Array.from(valueSet).sort();
      // Keep keys that have at least 2 unique values and at most 8 unique values
      if (values.length >= 2 && values.length <= 8) {
        result[key] = values;
      }
    });
    return result;
  }, [categoryProducts]);

  const priceLimits = useMemo(() => {
    if (categoryProducts.length === 0) {
      return { min: 0, max: 400000 };
    }
    const prices = categoryProducts.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return {
      min,
      max: max === min ? min + 1000 : max,
    };
  }, [categoryProducts]);

  useEffect(() => {
    setMinPrice(priceLimits.min);
    setMaxPrice(priceLimits.max);
  }, [priceLimits]);

  // Filter and sort products locally
  const filteredProducts = useMemo(() => {
    let result = [...categoryProducts];

    // Brand filter
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }

    // RAM filter
    if (selectedRam.length > 0) {
      result = result.filter((p) => {
        const rVal = p.specifications?.ram || p.specifications?.RAM || '';
        return selectedRam.includes(rVal);
      });
    }

    // Storage filter
    if (selectedStorage.length > 0) {
      result = result.filter((p) => {
        const sVal = p.specifications?.storage || p.specifications?.Storage || '';
        return selectedStorage.includes(sVal);
      });
    }

    // Dynamic specifications filter
    if (Object.keys(selectedSpecs).length > 0) {
      Object.entries(selectedSpecs).forEach(([key, selectedValues]) => {
        if (selectedValues && selectedValues.length > 0) {
          result = result.filter((p) => {
            const specVal = p.specifications?.[key];
            return specVal && selectedValues.includes(specVal.trim());
          });
        }
      });
    }

    // Price range filter
    result = result.filter((p) => p.price >= minPrice && p.price <= maxPrice);

    // Sorting
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [categoryProducts, selectedBrands, selectedRam, selectedStorage, selectedSpecs, minPrice, maxPrice, sortBy]);

  // Paginate local list
  const productsList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Load reviews stats for products currently on page
  useEffect(() => {
    if (productsList.length > 0) {
      const fetchReviewsForProducts = async () => {
        try {
          const promises = productsList.map(async (p) => {
            const pId = p.productId || p.id;
            try {
              const res = await reviewService.getProductReviews(pId);
              const reviews = Array.isArray(res) ? res : (res as any).data || [];
              return { productId: pId, reviews };
            } catch {
              return { productId: pId, reviews: [] };
            }
          });
          const results = await Promise.all(promises);

          const stats: Record<string, { sum: number; count: number; avgRating: number }> = {};
          results.forEach(({ productId, reviews }) => {
            let sum = 0;
            const count = reviews.length;
            reviews.forEach((r: any) => {
              sum += r.rating || 0;
            });
            stats[productId] = {
              sum,
              count,
              avgRating: count > 0 ? Number((sum / count).toFixed(1)) : 5.0,
            };
          });
          setReviewsStats(stats);
        } catch (err) {
          console.error('Error fetching reviews stats:', err);
        }
      };
      fetchReviewsForProducts();
    }
  }, [productsList]);

  // Sync results metadata
  useEffect(() => {
    setTotalResults(filteredProducts.length);
    setTotalPages(Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage)));
  }, [filteredProducts, itemsPerPage]);

  // Fetch trending products for landing page
  useEffect(() => {
    const fetchTrending = async () => {
      setTrendingLoading(true);
      try {
        const res = await productService.getProducts({ limit: 100 });
        const list = res.data || res.products || (Array.isArray(res) ? res : []);
        
        const productIds = list.map((p: any) => p.productId || p.id).filter(Boolean);
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
            console.error('Error fetching batch stock in fetchTrending:', err);
          }
        }

        const inStockTrending = list.map((p: any) => {
          const pId = p.productId || p.id;
          return {
            ...p,
            stock: stockMap[pId] !== undefined ? stockMap[pId] : 10
          };
        }).filter((p: any) => p.stock > 0).slice(0, 5);

        setTrendingProducts(inStockTrending);
      } catch (err) {
        console.error('Error loading trending products:', err);
      } finally {
        setTrendingLoading(false);
      }
    };
    if (!showShopGrid) {
      fetchTrending();
    }
  }, [showShopGrid]);

  // Fetch brands for ticker on mount
  useEffect(() => {
    const fetchBrands = async () => {
      setBrandsLoading(true);
      try {
        const list = await brandService.getAllBrands();
        if (list && list.length > 0) {
          setDbBrands(list.map(b => b.name));
        }
      } catch (err) {
        console.error('Error fetching brands for ticker:', err);
      } finally {
        setBrandsLoading(false);
      }
    };
    fetchBrands();
  }, []);

  const handleBrandChange = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
    setCurrentPage(1);
  };

  const handleRamChange = (ram: string) => {
    setSelectedRam((prev) =>
      prev.includes(ram) ? prev.filter((r) => r !== ram) : [...prev, ram]
    );
    setCurrentPage(1);
  };

  const handleStorageChange = (storage: string) => {
    setSelectedStorage((prev) =>
      prev.includes(storage) ? prev.filter((s) => s !== storage) : [...prev, storage]
    );
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    setSelectedBrands([]);
    setSelectedCategory(null);
    setSelectedRam([]);
    setSelectedStorage([]);
    setSelectedSpecs({});
    setMinPrice(priceLimits.min);
    setMaxPrice(priceLimits.max);
    setSearchQuery('');
    toast.success('All filters cleared!');
  };

  const handleAddToCart = async (product: any) => {
    const pId = product.productId || product.id;
    const cartItem = cartItems.find((item: any) => item.id === pId);
    const currentCartQty = cartItem ? cartItem.quantity : 0;
    const stock = product.stock !== undefined ? product.stock : 10;

    if (stock === 0) {
      toast.error('This product is out of stock.');
      return;
    }

    if (currentCartQty + 1 > stock) {
      toast.error(`Cannot add more items. Only ${stock} units are in stock.`);
      return;
    }

    try {
      await dispatch(
        addToCartBackend({
          productId: pId,
          quantity: 1,
        })
      ).unwrap();
      toast.success(`${product.name} added to cart!`);
    } catch (err: any) {
      toast.error(err || 'Failed to add to cart.');
    }
  };

  const handleBuyNow = async (product: any) => {
    const pId = product.productId || product.id;
    const cartItem = cartItems.find((item: any) => item.id === pId);
    const currentCartQty = cartItem ? cartItem.quantity : 0;
    const stock = product.stock !== undefined ? product.stock : 10;

    if (stock === 0) {
      toast.error('This product is out of stock.');
      return;
    }

    if (currentCartQty + 1 > stock) {
      navigate('/cart');
      return;
    }

    try {
      await dispatch(
        addToCartBackend({
          productId: pId,
          quantity: 1,
        })
      ).unwrap();
      navigate('/cart');
    } catch (err: any) {
      navigate('/cart');
    }
  };

  const getProductImage = (product: any) => {
    return getImageUrl(product);
  };


  const sortOptions = [
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
  ];

  const pageSizeOptions = [4, 8, 12, 16];

  const hasActiveFilters =
    selectedBrands.length > 0 ||
    selectedCategory !== null ||
    selectedRam.length > 0 ||
    selectedStorage.length > 0 ||
    Object.keys(selectedSpecs).length > 0 ||
    searchQuery !== '' ||
    minPrice > priceLimits.min ||
    maxPrice < priceLimits.max;

  const renderFilterSkeleton = () => (
    <div className="flex flex-col items-stretch space-y-6 animate-pulse text-left w-full">
      {/* Brand Skeleton */}
      <div className="space-y-3 w-full">
        <div className="h-3 w-16 bg-slate-200 rounded-md" />
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-slate-200 rounded" />
            <div className="h-3.5 w-24 bg-slate-100 rounded" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-slate-200 rounded" />
            <div className="h-3.5 w-16 bg-slate-100 rounded" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-slate-200 rounded" />
            <div className="h-3.5 w-20 bg-slate-100 rounded" />
          </div>
        </div>
      </div>

      {/* Price Range Skeleton */}
      <div className="space-y-3 w-full">
        <div className="h-3 w-20 bg-slate-200 rounded-md" />
        <div className="flex space-x-2 w-full">
          <div className="h-8 bg-slate-100 rounded-lg flex-1" />
          <div className="h-8 bg-slate-100 rounded-lg flex-1" />
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full w-full mt-2" />
      </div>

      {/* Specifications Skeleton */}
      <div className="space-y-3 w-full">
        <div className="h-3 w-24 bg-slate-200 rounded-md" />
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-slate-200 rounded" />
            <div className="h-3.5 w-28 bg-slate-100 rounded" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-slate-200 rounded" />
            <div className="h-3.5 w-20 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className="flex flex-col items-stretch space-y-5.5">
      {/* Categories filter hidden (using top navbar categories instead) */}

      {/* Brand Filters */}
      <div className="flex flex-col items-start space-y-2.5">
        <span className="text-[11px] font-bold text-slate-800 tracking-tight">Brand</span>
        {availableBrands.length > 0 ? (
          availableBrands.map((br) => (
            <Checkbox
              key={br}
              id={`brand-${br.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
              checked={selectedBrands.includes(br)}
              onChange={() => handleBrandChange(br)}
              label={br}
            />
          ))
        ) : (
          <span className="text-[10.5px] font-medium text-slate-400 pl-1 italic">No brands available</span>
        )}
      </div>

      {/* Price Range Slider Filter */}
      <div className="flex flex-col items-stretch space-y-2.5 w-full">
        <span className="text-[11px] font-bold text-slate-800 tracking-tight">Price Range</span>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 h-[34px]">
            <input
              type="number"
              min={priceLimits.min}
              max={priceLimits.max}
              value={minPrice}
              onChange={(e) => setMinPrice(Math.max(priceLimits.min, Number(e.target.value)))}
              placeholder="Min"
              className="w-full h-full text-[11px] font-semibold border border-slate-300 rounded-[10px] px-2.5 text-slate-700 outline-none focus:border-blue-600 transition-colors bg-slate-50/50"
            />
          </div>
          <span className="text-slate-400 text-xs font-bold">-</span>
          <div className="relative flex-1 h-[34px]">
            <input
              type="number"
              min={priceLimits.min}
              max={priceLimits.max}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Math.min(priceLimits.max, Number(e.target.value)))}
              placeholder="Max"
              className="w-full h-full text-[11px] font-semibold border border-slate-300 rounded-[10px] px-2.5 text-slate-700 outline-none focus:border-blue-600 transition-colors bg-slate-50/50"
            />
          </div>
        </div>

        <div className="pt-2 flex flex-col space-y-2">
          <div className="relative w-full h-5 select-none">
            <div className="absolute top-2 left-0 right-0 h-1 bg-slate-200 rounded-lg"></div>
            <div
              className="absolute top-2 h-1 bg-blue-600 rounded-lg"
              style={{
                left: `${((minPrice - priceLimits.min) / (priceLimits.max - priceLimits.min || 1)) * 100}%`,
                right: `${100 - ((maxPrice - priceLimits.min) / (priceLimits.max - priceLimits.min || 1)) * 100}%`,
              }}
            ></div>
            <input
              type="range"
              min={priceLimits.min}
              max={priceLimits.max}
              value={minPrice}
              onChange={(e) => {
                const val = Math.min(Number(e.target.value), maxPrice - 50);
                setMinPrice(val);
              }}
              className="absolute top-0 left-0 w-full h-5 appearance-none bg-transparent pointer-events-none cursor-pointer outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
              style={{ zIndex: minPrice > (priceLimits.min + priceLimits.max) / 2 ? 5 : 4 }}
            />
            <input
              type="range"
              min={priceLimits.min}
              max={priceLimits.max}
              value={maxPrice}
              onChange={(e) => {
                const val = Math.max(Number(e.target.value), minPrice + 50);
                setMaxPrice(val);
              }}
              className="absolute top-0 left-0 w-full h-5 appearance-none bg-transparent pointer-events-none cursor-pointer outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
            />
          </div>
          <div className="flex justify-between text-[9.5px] text-slate-455 font-bold pt-0.5">
            <span className="flex items-center">Min:&nbsp;<Price value={minPrice} /></span>
            <span className="flex items-center">Max:&nbsp;<Price value={maxPrice} /></span>
          </div>
        </div>
      </div>

      {/* Memory RAM Specifications */}
      {availableRam.length > 0 && (
        <div className="flex flex-col items-start space-y-2.5">
          <span className="text-[11px] font-bold text-slate-800 tracking-tight">Memory (RAM)</span>
          {availableRam.map((ram) => (
            <Checkbox
              key={ram}
              id={`ram-${ram.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
              checked={selectedRam.includes(ram)}
              onChange={() => handleRamChange(ram)}
              label={ram}
            />
          ))}
        </div>
      )}

      {/* Storage Specifications */}
      {availableStorage.length > 0 && (
        <div className="flex flex-col items-start space-y-2.5">
          <span className="text-[11px] font-bold text-slate-800 tracking-tight">Storage Space</span>
          {availableStorage.map((st) => (
            <Checkbox
              key={st}
              id={`storage-${st.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
              checked={selectedStorage.includes(st)}
              onChange={() => handleStorageChange(st)}
              label={st}
            />
          ))}
        </div>
      )}

      {/* Dynamic Specifications */}
      {Object.entries(dynamicSpecOptions).map(([specKey, options]) => (
        <div key={specKey} className="flex flex-col items-start space-y-2.5">
          <span className="text-[11px] font-bold text-slate-800 tracking-tight">{specKey}</span>
          {options.map((option) => {
            const uniqueId = `spec-${specKey.toLowerCase().replace(/[^a-z0-9]/g, '')}-${option.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
            const isChecked = selectedSpecs[specKey]?.includes(option) || false;
            return (
              <Checkbox
                key={option}
                id={uniqueId}
                checked={isChecked}
                onChange={() => handleSpecChange(specKey, option)}
                label={option}
              />
            );
          })}
        </div>
      ))}
    </div>
  );

  const renderHomeLanding = !showShopGrid && !hasActiveFilters;

  // Scroll to top on landing transition
  useEffect(() => {
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto',
      });
      document.body.scrollTop = 0;
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
    } catch (e) {
      window.scrollTo(0, 0);
    }
  }, [renderHomeLanding]);

  if (renderHomeLanding) {
    return (
      <MainLayout>
        <div className="w-full flex flex-col items-stretch space-y-12 select-none">
          {/* Horizontal Category Scroll Bar (Flipkart Style) */}
          <div className="w-full bg-white border-b border-slate-100/70 py-1.5 select-none sticky top-16 z-40 -mt-8 mb-4 shadow-sm/5">
            <div className="flex items-center overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] gap-2 sm:gap-4 md:gap-0 px-4 justify-start md:justify-center w-full">
              {categoriesLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="flex flex-col items-center space-y-1 flex-shrink-0 md:flex-shrink-0 w-[80px] sm:w-[95px] md:w-[16.6%] md:max-w-[16.6%] animate-pulse">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/30" />
                    <div className="h-2 w-8 bg-slate-200 rounded" />
                  </div>
                ))
              ) : (
                <>
                  {/* Categories from backend */}
                  {categoriesList.map((cat) => {
                    const isSelected = selectedCategory === cat.name;
                    const imgUrl = getImageUrl(cat);
                    return (
                      <button
                        key={cat.categoryId || cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          setShowShopGrid(true);
                        }}
                        className="flex flex-col items-center space-y-1 group cursor-pointer focus:outline-none flex-shrink-0 md:flex-shrink-0 w-[80px] sm:w-[95px] md:w-[16.6%] md:max-w-[16.6%] border-none bg-transparent"
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 border overflow-hidden",
                          isSelected
                            ? "bg-blue-50/60 border-blue-200/50 shadow-[0_4px_12px_rgba(37,99,235,0.05)] scale-105"
                            : "bg-slate-50/40 border-slate-100/50 group-hover:border-slate-350 group-hover:bg-slate-50"
                        )}>
                          {imgUrl ? (
                            <img src={imgUrl} alt={cat.name} className="w-full h-full object-cover" />
                          ) : (
                            <CategoryIcon name={cat.name} isActive={isSelected} />
                          )}
                        </div>
                        <div className="flex flex-col items-center">
                          <span className={cn(
                            "text-[9.5px] tracking-tight transition-colors font-bold",
                            isSelected ? "text-slate-900" : "text-slate-500 group-hover:text-slate-800"
                          )}>
                            {formatCategoryName(cat.name)}
                          </span>
                          <div className={cn(
                            "h-[2px] w-5 rounded-full mt-0.5 transition-all duration-300",
                            isSelected ? "bg-blue-600" : "bg-transparent"
                          )} />
                        </div>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Hero Banner Section */}
          <section className="bg-slate-50/50 rounded-[32px] border border-slate-200/50 p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 text-left">
            <div className="flex-1 space-y-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight tracking-tight max-w-lg">
                Discover the <span className="text-blue-600 italic">Future</span> of Technology
              </h1>
              <p className="text-xs sm:text-sm text-slate-550 font-semibold leading-relaxed max-w-md hidden sm:block">
                Explore premium gadgets, laptops, gaming gear, and smart devices powered by innovation. Curated by experts, delivered by intelligence.
              </p>
              <p className="text-xs text-slate-550 font-semibold leading-relaxed max-w-sm block sm:hidden">
                Curated AI-driven recommendations for enthusiasts and professionals alike.
              </p>
              <div className="flex items-center space-x-3.5 pt-2">
                <button
                  onClick={() => setShowShopGrid(true)}
                  className="h-11 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow hover:shadow-lg active:scale-95 transition-all cursor-pointer border-none"
                >
                  View Products
                </button>
                <button
                  onClick={() => navigate('/brands')}
                  className="h-11 px-6 rounded-full border border-slate-200 bg-white text-slate-800 text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  View Brands
                </button>
              </div>
            </div>
            <div className="flex-1 w-full max-w-xl lg:max-w-none">
              <img
                src={heroBannerImg}
                alt="Discover the Future of Technology"
                className="w-full aspect-[16/9] object-cover rounded-3xl border border-slate-200 shadow-sm"
              />
            </div>
          </section>



          {/* Brands logo ticker */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes marquee-ltr {
              0% { transform: translateX(-50%); }
              100% { transform: translateX(0%); }
            }
            .animate-marquee-ltr {
              display: inline-flex;
              animation: marquee-ltr 28s linear infinite;
            }
          `}} />
          
          {brandsLoading ? (
            <section className="py-4 border-t border-b border-slate-100/70 select-none overflow-hidden">
              <div className="flex items-center justify-around w-full max-w-7xl mx-auto px-4 gap-6 animate-pulse">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="h-3 w-16 bg-slate-200 rounded-full" />
                ))}
              </div>
            </section>
          ) : dbBrands.length > 0 ? (
            <section className="py-3.5 border-t border-b border-slate-100/70 select-none overflow-hidden w-full relative bg-slate-50/10">
              <div className="w-full overflow-hidden whitespace-nowrap relative flex">
                <div className="animate-marquee-ltr space-x-16 sm:space-x-24 pr-16 sm:pr-24 flex-shrink-0">
                  {/* First iteration */}
                  {dbBrands.map((b, idx) => (
                    <span key={`b1-${b}-${idx}`} className="text-slate-350 tracking-[0.25em] font-black uppercase text-[10px] sm:text-[11.5px] hover:text-blue-500/60 transition-colors duration-300">
                      {b}
                    </span>
                  ))}
                  {/* Duplicate for seamless loop */}
                  {dbBrands.map((b, idx) => (
                    <span key={`b2-${b}-${idx}`} className="text-slate-350 tracking-[0.25em] font-black uppercase text-[10px] sm:text-[11.5px] hover:text-blue-500/60 transition-colors duration-300">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {/* Trending Today */}
          <section className="space-y-5 text-left">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Trending Today</h2>
            
            {/* Mobile View: Row Cards */}
            <div className="grid grid-cols-1 gap-3.5 block sm:hidden">
              {trendingLoading ? (
                Array.from({ length: 2 }).map((_, idx) => (
                  <div
                    key={`skeleton-mobile-${idx}`}
                    className="bg-white border border-slate-200/60 rounded-3xl p-3.5 flex items-center justify-between shadow-sm shimmer-sweep text-left"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="w-18 h-18 bg-slate-100 rounded-2xl flex-shrink-0" />
                      <div className="space-y-1 text-left">
                        <div className="h-3 w-10 bg-slate-200/60 rounded" />
                        <div className="h-4 w-28 bg-slate-200/60 rounded mt-1.5" />
                        <div className="h-3.5 w-16 bg-slate-100 rounded mt-1.5" />
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-slate-200/60 flex-shrink-0" />
                  </div>
                ))
              ) : (
                trendingProducts.slice(0, 2).map((item) => {
                  const imgUrl = getProductImage(item);
                  return (
                    <div
                      key={item.productId || item.id}
                      onClick={() => navigate(`/product/${item.productId || item.id}`)}
                      className="bg-white border border-slate-200/60 rounded-3xl p-3.5 flex items-center justify-between shadow-sm hover:shadow transition-all cursor-pointer"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="w-18 h-18 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center p-1.5 flex-shrink-0">
                          <img src={imgUrl} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0 text-left">
                          <span className="text-[9px] font-black text-blue-650 tracking-wider uppercase">{item.brand}</span>
                          <h4 className="text-[11.5px] font-extrabold text-slate-855 truncate mt-0.5">{item.name}</h4>
                          <div className="flex items-baseline space-x-2 mt-1">
                            <Price value={item.price} className="text-xs font-black text-blue-600" />
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                        className="w-9 h-9 rounded-full bg-blue-50/70 hover:bg-blue-600 text-slate-800 hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm flex-shrink-0"
                      >
                        <ShoppingCart className="w-4 h-4 stroke-[2.2px]" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop View: Featured Products cards (5-in-a-row) */}
            <div className="hidden sm:grid gap-4 lg:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
              {trendingLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <SkeletonProductCard key={`skeleton-trending-${idx}`} />
                ))
              ) : (
                trendingProducts.map((prod) => {
                  const imgUrl = getProductImage(prod);
                  return (
                    <div
                      key={prod.productId || prod.id}
                      onClick={() => navigate(`/product/${prod.productId || prod.id}`)}
                      className="group relative bg-white border border-slate-200/60 rounded-[30px] p-4 flex flex-col justify-between hover:shadow-[0_24px_50px_rgba(15,23,42,0.04)] hover:-translate-y-1 transition-all duration-350 select-none text-left cursor-pointer"
                    >
                      <div className="relative aspect-[4/3] w-full rounded-[22px] overflow-hidden bg-slate-50/70 p-2 sm:p-2.5 flex items-center justify-center mb-4">
                        <img
                          src={imgUrl}
                          alt={prod.name}
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex flex-col flex-grow justify-between text-left">
                        <div className="space-y-1.5">
                          <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest leading-none block">{prod.brand}</span>
                          <h3 className="text-[13.5px] font-black text-slate-905 tracking-tight leading-snug mt-1 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[36px]">
                            {prod.name}
                          </h3>
                          
                          {/* Price Section below the name */}
                          <div className="flex items-center flex-wrap gap-1.5">
                            <Price value={prod.discount && prod.discount > 0 ? Math.round(prod.price * (1 - prod.discount / 100)) : prod.price} className="text-[15px] font-black text-slate-900 leading-none" />
                            {prod.discount && prod.discount > 0 && (
                              <>
                                <Price value={prod.price} className="text-[11px] text-slate-400 line-through font-semibold leading-none ml-1" />
                                <span className="px-1.5 py-0.5 rounded-[5px] bg-emerald-50 text-[9px] font-extrabold text-emerald-600 border border-emerald-100/50 uppercase tracking-wider leading-none">
                                  {prod.discount}% OFF
                                </span>
                              </>
                            )}
                          </div>

                          {/* Category Tag under the price */}
                          {prod.category && (
                            <div className="flex pt-1">
                              <span className="px-2 py-0.5 rounded bg-blue-50/60 text-[9px] font-bold text-blue-700 border border-blue-100/40 uppercase tracking-wider">
                                {prod.category}
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
                                handleAddToCart(prod);
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
                                handleBuyNow(prod);
                              }}
                              className="h-8 flex-grow rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm border-none"
                            >
                              Buy Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Features cards */}
          <section className="bg-slate-50/20 rounded-[32px] border border-slate-100 p-6 sm:p-10 text-center space-y-8">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">The NatCart Edge</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {[
                {
                  title: 'AI-Powered Insights',
                  desc: 'Personalized tech recommendations tailored to your unique workflow.',
                  icon: Sparkles,
                },
                {
                  title: 'Certified Authenticity',
                  desc: 'Every product is verified and covered by our premium global warranty.',
                  icon: Check,
                },
                {
                  title: 'Rapid Delivery',
                  desc: 'Free worldwide shipping on all orders over $150 with real-time tracking.',
                  icon: Truck,
                },
              ].map((feat, idx) => {
                const IconComponent = feat.icon;
                return (
                  <div key={idx} className="bg-white border border-slate-200/60 rounded-3xl p-5 flex items-start space-x-4 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-5 h-5 stroke-[2.2px]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-900 tracking-tight uppercase">{feat.title}</h4>
                      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>


        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full flex flex-col items-stretch space-y-8 select-none">
        


        {/* Mobile/Tablet Filter & Search row */}
        <div className="flex lg:hidden items-center justify-between gap-3 mb-2 sticky top-16 z-30 bg-slate-50/95 backdrop-blur-sm py-2">
          <div className="flex-grow">
            <Search value={searchQuery} onChange={setSearchQuery} placeholder="Search hardware..." />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-[42px] px-3 sm:px-4 font-bold flex items-center justify-center sm:space-x-1.5 rounded-xl border-slate-200 cursor-pointer active:scale-95 bg-white text-slate-700 hover:bg-slate-50 transition-all"
            onClick={() => setIsFilterDrawerOpen(true)}
            aria-label="Toggle Filters"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
        </div>

        {/* Content catalog Layout */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-8 items-start -mt-8">
          {/* Left Column Filters Sticky Sidebar */}
          <aside className="hidden lg:block lg:sticky lg:top-16 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto col-span-1 select-none">
            <Card variant="simple" className="p-6 border-slate-200 text-left bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearAll}
                    className="text-[10px] font-bold text-blue-655 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
              {isLoading ? renderFilterSkeleton() : renderFilters()}
            </Card>
          </aside>

          {/* Right Column: Catalog Products Grid */}
          <section className="col-span-1 lg:col-span-3 flex flex-col space-y-6">
            {/* Horizontal Category Scroll Bar (Flipkart Style) */}
            <div className="w-full bg-white border border-slate-200/60 rounded-[20px] py-2 px-3 select-none shadow-[0_4px_20px_rgba(15,23,42,0.015)]">
              <div className="flex items-center overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] gap-2 sm:gap-4 md:gap-0 px-1 justify-start md:justify-center w-full">
                {categoriesLoading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="flex flex-col items-center space-y-1 flex-shrink-0 md:flex-shrink-0 w-[80px] sm:w-[95px] md:w-[16.6%] md:max-w-[16.6%] animate-pulse">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/30" />
                      <div className="h-2 w-8 bg-slate-200 rounded" />
                    </div>
                  ))
                ) : (
                  <>
                    {/* Categories from backend */}
                    {categoriesList.map((cat) => {
                      const isSelected = selectedCategory === cat.name;
                      const imgUrl = getImageUrl(cat);
                      return (
                        <button
                          key={cat.categoryId || cat.id}
                          onClick={() => {
                            setSelectedCategory(cat.name);
                            setShowShopGrid(true);
                          }}
                          className="flex flex-col items-center space-y-1 group cursor-pointer focus:outline-none flex-shrink-0 md:flex-shrink-0 w-[80px] sm:w-[95px] md:w-[16.6%] md:max-w-[16.6%] border-none bg-transparent"
                        >
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 border overflow-hidden",
                            isSelected
                              ? "bg-blue-50/60 border-blue-200/50 shadow-[0_4px_12px_rgba(37,99,235,0.05)] scale-105"
                              : "bg-slate-50/40 border-slate-100/50 group-hover:border-slate-350 group-hover:bg-slate-50"
                          )}>
                            {imgUrl ? (
                              <img src={imgUrl} alt={cat.name} className="w-full h-full object-cover" />
                            ) : (
                              <CategoryIcon name={cat.name} isActive={isSelected} />
                            )}
                          </div>
                          <div className="flex flex-col items-center">
                            <span className={cn(
                              "text-[9.5px] tracking-tight transition-colors font-bold",
                              isSelected ? "text-slate-900" : "text-slate-500 group-hover:text-slate-800"
                            )}>
                              {formatCategoryName(cat.name)}
                            </span>
                            <div className={cn(
                              "h-[2px] w-5 rounded-full mt-0.5 transition-all duration-300",
                              isSelected ? "bg-blue-600" : "bg-transparent"
                            )} />
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="text-left flex items-center space-x-2">
                <span className="text-sm font-bold text-slate-900 tracking-tight">Technology Catalog</span>
                <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5 shadow-sm">
                  {totalResults} Results
                </span>
              </div>

              {/* Sort controls */}
              <div className="flex items-center space-x-3">
                <div className="relative inline-block text-left" ref={sortRef}>
                  <button
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="h-[34px] px-2.5 sm:px-3.5 bg-blue-50/50 hover:bg-blue-50 text-blue-700 border border-blue-100 rounded-[12px] text-xs font-black transition-all flex items-center justify-center sm:space-x-1.5 cursor-pointer select-none active:scale-95"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span className="hidden sm:inline">{sortOptions.find((opt) => opt.value === sortBy)?.label}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-blue-500 hidden sm:inline" />
                  </button>
                  {isSortOpen && (
                    <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200/50 shadow-[0_12px_30px_rgba(15,23,42,0.06)] rounded-[14px] overflow-hidden py-1 z-[1000]">
                      {sortOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setSortBy(opt.value);
                            setIsSortOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-650 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span>{opt.label}</span>
                          {sortBy === opt.value && <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3px]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
              {isLoading ? (
                Array.from({ length: itemsPerPage }).map((_, idx) => (
                  <SkeletonProductCard key={`skeleton-catalog-${idx}`} />
                ))
              ) : (
                productsList.map((prod) => {
                  const imgUrl = getProductImage(prod);
                  return (
                    <div
                      key={prod.productId || prod.id}
                      onClick={() => navigate(`/product/${prod.productId || prod.id}`)}
                      className="p-3.5 rounded-[28px] border border-slate-200/50 bg-white/95 shadow-[0_8px_30px_rgba(15,23,42,0.02)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.06)] hover:-translate-y-1 transition-all duration-350 flex flex-col justify-between items-stretch overflow-hidden group cursor-pointer"
                    >
                      <div className="relative w-full aspect-[4/3] rounded-[22px] bg-slate-50/70 p-2 sm:p-2.5 overflow-hidden flex items-center justify-center flex-shrink-0">
                        <img
                          src={imgUrl}
                          alt={prod.name}
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex flex-col flex-grow justify-between text-left mt-3">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-blue-655 tracking-wider uppercase">{prod.brand}</span>
                          <h4 className="text-[13.5px] font-extrabold text-slate-800 tracking-tight leading-tight mt-1 truncate w-full">
                            {prod.name}
                          </h4>
                          <div className="flex items-center space-x-1 pt-1">
                            <Rating value={reviewsStats[prod.productId || prod.id] ? Math.round(reviewsStats[prod.productId || prod.id].avgRating) : 5} readOnly size="sm" />
                            <span className="text-[10.5px] text-slate-800 font-bold ml-1.5 flex-shrink-0">
                              ({reviewsStats[prod.productId || prod.id] ? reviewsStats[prod.productId || prod.id].count : 0})
                            </span>
                          </div>
                          
                          {/* Price Section below the name */}
                          <div className="flex items-center flex-wrap gap-1.5">
                            <Price value={prod.discount && prod.discount > 0 ? Math.round(prod.price * (1 - prod.discount / 100)) : prod.price} className="text-[15px] font-black text-slate-900 leading-none" />
                            {prod.discount && prod.discount > 0 && (
                              <>
                                <Price value={prod.price} className="text-[11px] text-slate-400 line-through font-semibold leading-none ml-1" />
                                <span className="px-1.5 py-0.5 rounded-[5px] bg-emerald-50 text-[9px] font-extrabold text-emerald-600 border border-emerald-100/50 uppercase tracking-wider leading-none">
                                  {prod.discount}% OFF
                                </span>
                              </>
                            )}
                          </div>

                          {/* Category Tag under the price */}
                          {prod.category && (
                            <div className="flex pt-1">
                              <span className="text-[9px] font-bold text-blue-700 bg-blue-50/60 px-2 py-0.5 rounded-[5px] border border-blue-100/40 uppercase tracking-wider">
                                {prod.category}
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
                                handleAddToCart(prod);
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
                                handleBuyNow(prod);
                              }}
                              className="h-8 flex-grow rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm border-none"
                            >
                              Buy Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {!isLoading && productsList.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
                  <ShoppingBag className="w-12 h-12 text-slate-200 mb-2" />
                  <p className="text-sm font-semibold text-slate-400">No products found matching filters.</p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 w-full select-none">
              <span className="text-[11px] font-bold text-slate-450">
                Page {currentPage} of {totalPages} ({totalResults} items found)
              </span>
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
              <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-450">
                <span>Show:</span>
                {pageSizeOptions.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setItemsPerPage(size);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-[8px] transition-colors cursor-pointer",
                      itemsPerPage === size
                        ? "bg-slate-200 text-slate-800"
                        : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <Drawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filters"
        position="left"
      >
        <div className="p-5 text-left flex flex-col h-full overflow-y-auto select-none">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  handleClearAll();
                  setIsFilterDrawerOpen(false);
                }}
                className="text-[10px] font-bold text-blue-655 hover:text-blue-800 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>
          {isLoading ? renderFilterSkeleton() : renderFilters()}
          <Button
            variant="primary"
            size="sm"
            className="w-full mt-8 text-xs h-[40px] rounded-xl"
            onClick={() => setIsFilterDrawerOpen(false)}
          >
            Apply & Close
          </Button>
        </div>
      </Drawer>
    </MainLayout>
  );
};

export default Marketplace;
