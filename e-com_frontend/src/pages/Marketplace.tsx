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
  Laptop,
  Headphones,
  Watch,
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
import { getImageUrl } from '../utils/imageHelper';

const formatCategoryName = (name: string) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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
  const [allReviews, setAllReviews] = useState<any[]>([]);

  // Calculate average rating and review count per product
  const reviewsStats = useMemo(() => {
    const stats: Record<string, { sum: number; count: number; avgRating: number }> = {};
    allReviews.forEach((rev) => {
      const pId = rev.productId;
      if (!pId) return;
      if (!stats[pId]) {
        stats[pId] = { sum: 0, count: 0, avgRating: 5.0 };
      }
      stats[pId].sum += rev.rating || 0;
      stats[pId].count += 1;
    });

    Object.keys(stats).forEach((pId) => {
      const s = stats[pId];
      if (s.count > 0) {
        s.avgRating = Number((s.sum / s.count).toFixed(1));
      }
    });
    return stats;
  }, [allReviews]);

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRam, setSelectedRam] = useState<string[]>([]);
  const [selectedStorage, setSelectedStorage] = useState<string[]>([]);
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
        setCategoriesList(list.filter((c: any) => (c.status || 'ACTIVE').toUpperCase() === 'ACTIVE'));
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Load all reviews on component mount
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviews = await reviewService.getAllReviews();
        setAllReviews(reviews);
      } catch (err) {
        console.error('Error fetching all reviews:', err);
      }
    };
    fetchReviews();
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
        setRawProducts(list);
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
  }, [categoryProducts, selectedBrands, selectedRam, selectedStorage, minPrice, maxPrice, sortBy]);

  // Paginate local list
  const productsList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

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
        const res = await productService.getProducts({ limit: 5 });
        const list = res.data || res.products || (Array.isArray(res) ? res : []);
        setTrendingProducts(list);
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
      try {
        const list = await brandService.getAllBrands();
        if (list && list.length > 0) {
          setDbBrands(list.map(b => b.name));
        }
      } catch (err) {
        console.error('Error fetching brands for ticker:', err);
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
    setMinPrice(0);
    setMaxPrice(400000);
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

  const getProductImage = (product: any) => {
    return getImageUrl(product);
  };

  const getCategoryIcon = (name: string) => {
    const norm = name.toLowerCase();
    if (norm.includes('computing') || norm.includes('laptop') || norm.includes('pc') || norm.includes('computer')) {
      return Laptop;
    }
    if (norm.includes('audio') || norm.includes('headphone') || norm.includes('sound') || norm.includes('speaker')) {
      return Headphones;
    }
    if (norm.includes('wear') || norm.includes('watch') || norm.includes('smartwatch')) {
      return Watch;
    }
    return Sparkles;
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
    searchQuery !== '' ||
    minPrice > 0 ||
    maxPrice < 400000;

  const renderFilters = () => (
    <div className="flex flex-col items-stretch space-y-5.5">
      {/* Category List Filters */}
      <div className="flex flex-col items-start space-y-2.5">
        <span className="text-[11px] font-bold text-slate-800 tracking-tight">Category</span>
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "text-[11.5px] font-bold py-0.5 transition-colors cursor-pointer text-left pl-1",
            !selectedCategory ? "text-blue-600" : "text-slate-550 hover:text-slate-800"
          )}
        >
          All Categories
        </button>
        {categoriesList.map((cat) => (
          <button
            key={cat.categoryId || cat.id}
            onClick={() => setSelectedCategory(cat.name)}
            className={cn(
              "text-[11.5px] font-semibold py-0.5 transition-colors cursor-pointer text-left pl-1 flex items-center space-x-1.5",
              selectedCategory === cat.name ? "text-blue-600 font-extrabold" : "text-slate-550 hover:text-slate-800"
            )}
          >
            <span>{formatCategoryName(cat.name)}</span>
          </button>
        ))}
      </div>

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
              min="0"
              max="400000"
              value={minPrice}
              onChange={(e) => setMinPrice(Math.max(0, Number(e.target.value)))}
              placeholder="Min"
              className="w-full h-full text-[11px] font-semibold border border-slate-300 rounded-[10px] px-2.5 text-slate-700 outline-none focus:border-blue-600 transition-colors bg-slate-50/50"
            />
          </div>
          <span className="text-slate-400 text-xs font-bold">-</span>
          <div className="relative flex-1 h-[34px]">
            <input
              type="number"
              min="0"
              max="400000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Math.min(400000, Number(e.target.value)))}
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
                left: `${(minPrice / 400000) * 100}%`,
                right: `${100 - (maxPrice / 400000) * 100}%`,
              }}
            ></div>
            <input
              type="range"
              min="0"
              max="400000"
              value={minPrice}
              onChange={(e) => {
                const val = Math.min(Number(e.target.value), maxPrice - 50);
                setMinPrice(val);
              }}
              className="absolute top-0 left-0 w-full h-5 appearance-none bg-transparent pointer-events-none cursor-pointer outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
              style={{ zIndex: minPrice > 200000 ? 5 : 4 }}
            />
            <input
              type="range"
              min="0"
              max="400000"
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
      <div className="flex flex-col items-start space-y-2.5">
        <span className="text-[11px] font-bold text-slate-800 tracking-tight">Memory (RAM)</span>
        {availableRam.length > 0 ? (
          availableRam.map((ram) => (
            <Checkbox
              key={ram}
              id={`ram-${ram.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
              checked={selectedRam.includes(ram)}
              onChange={() => handleRamChange(ram)}
              label={ram}
            />
          ))
        ) : (
          <span className="text-[10.5px] font-medium text-slate-400 pl-1 italic">No RAM options available</span>
        )}
      </div>

      {/* Storage Specifications */}
      <div className="flex flex-col items-start space-y-2.5">
        <span className="text-[11px] font-bold text-slate-800 tracking-tight">Storage Space</span>
        {availableStorage.length > 0 ? (
          availableStorage.map((st) => (
            <Checkbox
              key={st}
              id={`storage-${st.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
              checked={selectedStorage.includes(st)}
              onChange={() => handleStorageChange(st)}
              label={st}
            />
          ))
        ) : (
          <span className="text-[10.5px] font-medium text-slate-400 pl-1 italic">No storage options available</span>
        )}
      </div>
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

          {/* Shop Categories Circles */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  <span className="hidden sm:inline">Shop by Category</span>
                  <span className="inline sm:hidden">Shop Categories</span>
                </h2>
                <p className="text-xs text-slate-400 font-bold mt-0.5 hidden sm:block">
                  Find exactly what you're looking for in our specialized collections.
                </p>
              </div>
              <button
                onClick={() => setShowShopGrid(true)}
                className="text-xs font-black text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer bg-transparent border-none"
              >
                <span>View all</span>
                <span>&rarr;</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3.5 sm:gap-6">
              {categoriesLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="p-4 sm:p-6 bg-white border border-slate-200/60 rounded-[24px] sm:rounded-[32px] flex flex-col items-center justify-center space-y-3 shimmer-sweep">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-200 animate-pulse" />
                    <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
                  </div>
                ))
              ) : (
                categoriesList.slice(0, 3).map((cat) => {
                  const IconComponent = getCategoryIcon(cat.name);
                  const imgUrl = getImageUrl(cat);
                  return (
                    <button
                      key={cat.categoryId || cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setShowShopGrid(true);
                      }}
                      className="p-4 sm:p-6 bg-white border border-slate-200/60 rounded-[24px] sm:rounded-[32px] flex flex-col items-center justify-center space-y-3 hover:border-blue-300 hover:shadow-md transition-all active:scale-98 cursor-pointer select-none"
                    >
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 flex-shrink-0 overflow-hidden">
                        {imgUrl ? (
                          <img src={imgUrl} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <IconComponent className="w-5.5 h-5.5 sm:w-7 sm:h-7 text-slate-800" />
                        )}
                      </div>
                      <span className="text-[11px] sm:text-xs font-black text-slate-800 tracking-tight leading-tight">
                        {cat.name}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Brands logo ticker */}
          <section className="py-2 border-t border-b border-slate-100 flex flex-wrap items-center justify-around gap-y-4 gap-x-6 text-[10px] sm:text-[11px] font-black text-slate-350 tracking-[0.2em] uppercase select-none">
            {dbBrands.length > 0 ? (
              dbBrands.map((b) => <span key={b}>{b}</span>)
            ) : (
              <>
                <span>Techcore</span>
                <span>Quantum</span>
                <span>Nexus</span>
                <span>Aether</span>
                <span>Zenith</span>
                <span>Omega</span>
              </>
            )}
          </section>

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
            <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
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
                        <div className="space-y-1">
                          <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest leading-none block">{prod.brand}</span>
                          <h3 className="text-[13.5px] font-black text-slate-905 tracking-tight leading-snug mt-1 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[36px]">
                            {prod.name}
                          </h3>
                          <div className="flex items-center space-x-1 mt-1.5 flex-wrap gap-y-1">
                            <span className="px-2 py-0.5 rounded bg-slate-50 text-[9px] font-bold text-slate-455 border border-slate-100/80">
                              {prod.specifications?.ram || prod.specifications?.RAM || 'Standard'}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-50 text-[9px] font-bold text-slate-455 border border-slate-100/80">
                              {prod.specifications?.storage || prod.specifications?.Storage || 'Standard'}
                            </span>
                          </div>
                        </div>
                        <div className="border-t border-slate-100/80 my-3" />
                        <div className="flex items-center justify-between flex-shrink-0">
                          <div className="flex flex-col text-left">
                            <Price value={prod.price} className="text-[14.5px] font-black text-slate-900 leading-none" />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(prod);
                            }}
                            className="w-9 h-9 rounded-full bg-blue-50/70 hover:bg-blue-600 text-slate-800 hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm"
                          >
                            <ShoppingCart className="w-4 h-4 stroke-[2.2px]" />
                          </button>
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
        <div className="flex lg:hidden items-center justify-between gap-3 mb-2">
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
        <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left Column Filters Sticky Sidebar */}
          <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto col-span-1 select-none">
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
              {renderFilters()}
            </Card>
          </aside>

          {/* Right Column: Catalog Products Grid */}
          <section className="col-span-1 lg:col-span-3 flex flex-col space-y-6">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
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
                        <div className="space-y-1 mb-2">
                          <span className="text-[10px] font-black text-blue-650 tracking-wider uppercase">{prod.brand}</span>
                          <h4 className="text-[13.5px] font-extrabold text-slate-800 tracking-tight leading-tight mt-1 truncate w-full">
                            {prod.name}
                          </h4>
                          <div className="flex items-center space-x-1 pt-1">
                            <Rating value={reviewsStats[prod.productId || prod.id] ? Math.round(reviewsStats[prod.productId || prod.id].avgRating) : 5} readOnly size="sm" />
                            <span className="text-[10.5px] text-slate-800 font-bold ml-1.5">
                              ({reviewsStats[prod.productId || prod.id] ? reviewsStats[prod.productId || prod.id].count : 0})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="text-[9.5px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-[5px]">
                              {prod.specifications?.ram || prod.specifications?.RAM || 'Standard'}
                            </span>
                            <span className="text-[9.5px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-[5px]">
                              {prod.specifications?.storage || prod.specifications?.Storage || 'Standard'}
                            </span>
                          </div>
                        </div>
                        <div className="border-t border-slate-100/80 my-3" />
                        <div className="flex items-center justify-between flex-shrink-0">
                          <div className="flex flex-col text-left">
                            <Price value={prod.price} className="text-[14.5px] font-black text-slate-900 leading-none" />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(prod);
                            }}
                            className="w-9 h-9 rounded-full bg-blue-50/70 hover:bg-blue-600 text-slate-800 hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm"
                          >
                            <ShoppingCart className="w-4 h-4 stroke-[2.2px]" />
                          </button>
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
          {renderFilters()}
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
