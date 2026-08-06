import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { addToCartBackend } from '../store/cartSlice';
import { MainLayout } from '../layouts/MainLayout';
import { Price } from '../components/ui/Price';
import { Rating } from '../components/ui/Rating';
import { Badge } from '../components/ui/Badge';
import {
  ChevronRight,
  Sparkles,
  Heart,
  ShoppingCart,
  Calendar,
  Check,
  MessageSquare,
  ThumbsUp,
  Cpu,
  Monitor,
  Battery,
  Layers,
  AlertTriangle,
  Star,
  Edit,
  Trash2,
} from 'lucide-react';
import { cn } from '../lib/cn';
import toast from 'react-hot-toast';

import macbookImg from '../assets/products/macbook.jpg';
import guideImg from '../assets/products/guide.jpg';

import { productService } from '../services/product.service';
import { wishlistService } from '../services/wishlist.service';
import { reviewService } from '../services/review.service';
import { orderService } from '../services/order.service';
import { inventoryService } from '../services/inventory.service';
import { getImageUrl } from '../utils/imageHelper';

const decodeJwtSub = (token: string): string | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload).sub || null;
  } catch (e) {
    return null;
  }
};

const formatCategoryName = (name: string) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [productData, setProductData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isEligibleForReview, setIsEligibleForReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [isUpdatingReview, setIsUpdatingReview] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);

  const averageRating = useMemo(() => {
    if (productReviews.length === 0) return 5.0;
    const sum = productReviews.reduce((acc, rev) => acc + rev.rating, 0);
    return Number((sum / productReviews.length).toFixed(1));
  }, [productReviews]);

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

  // Retrieve current items from cart to count existing quantity in cart
  const cartItem = useSelector((state: RootState) =>
    state.cart.items.find(
      (item) => item.id === (productData?.productId || productData?.id)
    )
  );
  const currentCartQty = cartItem ? cartItem.quantity : 0;
  const { profile } = useSelector((state: RootState) => state.auth);

  // Load product details from backend on id transitions
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const res = await productService.getProductById(id);
        const prod = res.data || res;
        
        // Fetch product stock from inventory service
        let actualStock = 10;
        try {
          const stockRes = await inventoryService.checkStock(id);
          const stockData = stockRes.data || stockRes;
          if (stockData.exists) {
            actualStock = stockData.availableStock;
          }
        } catch (stockErr) {
          console.error('Error fetching stock for product detail page:', stockErr);
        }
        
        prod.stock = actualStock;
        setProductData(prod);
        setActiveImageIdx(0);

        // Fetch reviews
        const reviewsData = await reviewService.getProductReviews(id);
        setProductReviews(reviewsData);

        // Decode token to check wishlist/eligibility
        const token = localStorage.getItem('natcart_access_token') || localStorage.getItem('natcart_token');
        if (token) {
          const userId = decodeJwtSub(token);
          if (userId) {
            setCurrentUserId(userId);
            // Check wishlist status
            const wishlisted = await wishlistService.getWishlist(userId);
            setIsWishlisted(wishlisted.includes(id));

            // Check order service eligibility
            const userOrders = await orderService.getOrdersByUser(userId);
            const hasCompletedOrder = userOrders.some((order) => {
              const isDeliveredOrCompleted =
                order.orderStatus === 'Delivered' ||
                order.orderStatus === 'Completed' ||
                order.orderStatus === 'DELIVERED' ||
                order.orderStatus === 'COMPLETED';
              if (!isDeliveredOrCompleted) return false;
              return order.items.some((item) => item.productId === id);
            });
            setIsEligibleForReview(hasCompletedOrder);
          }
        }

        // Fetch catalog products for bundle recommendations
        try {
          const catRes = await productService.getProducts({ limit: 100 });
          const catData = catRes.data || catRes.products || (Array.isArray(catRes) ? catRes : []);
          
          const productIds = catData.map((p: any) => p.productId || p.id).filter(Boolean);
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
              console.error('Error fetching batch stock in detail recommendations:', err);
            }
          }

          const productsWithStock = catData.map((p: any) => {
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
          setCatalogProducts(inStockList);

          // Fetch all reviews for bundle item rating calculations
          const reviews = await reviewService.getAllReviews();
          setAllReviews(reviews);
        } catch (catErr) {
          console.error('Error fetching catalog recommendations:', catErr);
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        toast.error('Failed to load product detail logs.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProductDetails();
  }, [id]);

  const handleAddToCartAction = async () => {
    if (!productData || isAdding) return;

    const stock = productData.stock !== undefined ? productData.stock : 10;
    if (stock === 0) {
      toast.error('This product is out of stock.');
      return;
    }

    if (currentCartQty + 1 > stock) {
      toast.error(`Cannot add more items. Only ${stock} units are in stock.`);
      return;
    }

    setIsAdding(true);
    try {
      await dispatch(
        addToCartBackend({
          productId: productData.productId || productData.id,
          quantity: 1,
        })
      ).unwrap();
      toast.success(`${productData.name} added to cart!`);
    } catch (err: any) {
      toast.error(err || 'Failed to add to cart.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNowAction = async () => {
    if (!productData || isAdding) return;
    const stock = productData.stock !== undefined ? productData.stock : 10;
    if (stock === 0) {
      toast.error('This product is out of stock.');
      return;
    }
    if (currentCartQty + 1 > stock) {
      toast.error(`Cannot add more items. Only ${stock} units are in stock.`);
      return;
    }

    setIsAdding(true);
    try {
      await dispatch(
        addToCartBackend({
          productId: productData.productId || productData.id,
          quantity: 1,
        })
      ).unwrap();
      toast.success(`${productData.name} added to cart!`);
      navigate('/cart');
    } catch (err: any) {
      toast.error(err || 'Failed to add to cart.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!id) return;
    const token = localStorage.getItem('natcart_access_token') || localStorage.getItem('natcart_token');
    if (!token) {
      toast.error('Please login to wishlist items.');
      navigate('/login');
      return;
    }

    try {
      if (isWishlisted) {
        await wishlistService.removeFromWishlist(id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistService.addToWishlist(id);
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch (err) {
      toast.error('Failed to update wishlist.');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || isSubmittingReview) return;
    if (!reviewComment.trim()) {
      toast.error('Please enter a comment.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const displayName = profile?.fullName || profile?.email || 'Verified Buyer';
      const newReview = await reviewService.submitReview(id, reviewRating, reviewComment, displayName);
      setProductReviews((prev) => [newReview, ...prev]);
      setReviewComment('');
      setShowReviewForm(false);
      toast.success('Review submitted successfully!');
    } catch (err: any) {
      const backendMsg = err.response?.data?.message || err.message;
      toast.error(backendMsg || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      await reviewService.deleteReview(reviewId);
      setProductReviews((prev) => prev.filter((r) => (r.reviewId || r.id) !== reviewId));
      toast.success('Review deleted successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete review.');
    }
  };

  const handleStartEdit = (rev: any) => {
    setEditingReviewId(rev.reviewId || rev.id);
    setEditRating(rev.rating);
    setEditComment(rev.comment);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditRating(5);
    setEditComment('');
  };

  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReviewId || isUpdatingReview) return;
    if (!editComment.trim()) {
      toast.error('Please enter a comment.');
      return;
    }
    setIsUpdatingReview(true);
    try {
      const updatedReview = await reviewService.updateReview(editingReviewId, editRating, editComment);
      setProductReviews((prev) =>
        prev.map((r) => ((r.reviewId || r.id) === editingReviewId ? updatedReview : r))
      );
      handleCancelEdit();
      toast.success('Review updated successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update review.');
    } finally {
      setIsUpdatingReview(false);
    }
  };

  const getProductImage = (prod: any) => {
    return getImageUrl(prod);
  };

  const getThumbnails = (prod: any) => {
    if (prod.images && Array.isArray(prod.images) && prod.images.length > 0) {
      return prod.images.map((img: any) => getImageUrl(img));
    }
    const fallback = getProductImage(prod);
    return [fallback, guideImg, macbookImg];
  };

  const currentPrice = productData?.price || 0;
  const currentListPrice = productData?.price ? productData.price * 1.15 : null; // Simulated list price
  const emiCost = Math.round(currentPrice / 24);

  // Accessories bundle (Frequently bought together) dynamically resolved from catalog database
  const bundleItems = useMemo(() => {
    if (catalogProducts.length === 0) return [];

    // Filter out current product
    const otherProducts = catalogProducts.filter(p => (p.productId || p.id) !== id);
    if (otherProducts.length === 0) return [];

    return otherProducts.slice(0, 4).map((prod) => {
      const image = getImageUrl(prod);
      const ram = prod.specifications?.ram || prod.specifications?.RAM || prod.ram || 'Standard';
      const storage = prod.specifications?.storage || prod.specifications?.Storage || prod.storage || 'Standard';
      const listPrice = prod.listPrice || (prod.discount ? Math.round(prod.price / (1 - prod.discount / 100)) : prod.price);

      return {
        id: prod.productId || prod.id,
        name: prod.name,
        brand: prod.brand || 'Accessories',
        price: prod.price,
        listPrice,
        image,
        specs: ram && storage ? `${ram} • ${storage}` : (ram || storage || 'Standard'),
        category: prod.category || 'Accessories',
        discount: prod.discount || 0,
        stock: prod.stock !== undefined ? prod.stock : 10,
        originalProduct: prod
      };
    });
  }, [catalogProducts, id]);

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



  if (isLoading) {
    return (
      <MainLayout>
        <div className="w-full flex flex-col items-stretch space-y-6 select-none text-left shimmer-sweep">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-10 bg-slate-200 rounded" />
            <div className="h-3.5 w-3 bg-slate-300/50" />
            <div className="h-3 w-12 bg-slate-200 rounded" />
            <div className="h-3.5 w-3 bg-slate-300/50" />
            <div className="h-3 w-28 bg-slate-200 rounded" />
          </div>
          <div className="bg-white rounded-[24px] border border-slate-200/60 p-6 md:p-8 shadow-[0_4px_30px_rgba(15,23,42,0.01)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 flex flex-col space-y-4">
              <div className="w-full aspect-square md:aspect-[4/3] rounded-3xl bg-slate-200" />
              <div className="flex justify-center space-x-2.5">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="w-16 h-16 rounded-2xl bg-slate-200" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="space-y-3">
                <div className="h-4 w-16 bg-slate-300 rounded" />
                <div className="h-7 w-3/4 bg-slate-300 rounded mt-2" />
                <div className="h-4 w-28 bg-slate-200 rounded mt-2" />
              </div>
              <div className="p-4.5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                <div className="h-6 w-32 bg-slate-300 rounded" />
                <div className="h-3 w-40 bg-slate-200 rounded" />
              </div>
              <div className="flex space-x-3 pb-2">
                <div className="h-8 w-20 bg-slate-200 rounded-lg" />
                <div className="h-8 w-20 bg-slate-200 rounded-lg" />
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <div className="h-12 flex-grow bg-slate-300 rounded-full" />
                <div className="h-12 flex-grow bg-slate-200 rounded-full" />
                <div className="w-12 h-12 rounded-full bg-slate-200" />
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!productData) {
    return (
      <MainLayout>
        <div className="py-24 text-center">
          <h2 className="text-lg font-black text-slate-800">Product Not Found</h2>
          <p className="text-xs text-slate-500 mt-2">The requested technology item does not exist or has been archived.</p>
          <Link to="/" className="text-xs font-black text-blue-600 hover:underline mt-4 block">Back to Marketplace</Link>
        </div>
      </MainLayout>
    );
  }

  const thumbnails = getThumbnails(productData);

  return (
    <MainLayout>
      <div className="w-full flex flex-col items-stretch space-y-6 select-none text-left">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-400">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-350" />
          <Link to={`/?category=${productData.categoryId || ''}`} className="hover:text-blue-600 transition-colors">
            {formatCategoryName(productData.categoryName || productData.category || 'Products')}
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-350" />
          <span className="text-slate-800">{productData.name}</span>
        </div>

        {/* Hero Showcase Card */}
        <div className="bg-white rounded-[24px] border border-slate-200/60 p-6 md:p-8 shadow-[0_4px_30px_rgba(15,23,42,0.01)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Thumbnails and Stage Image */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div className="relative w-full aspect-square md:aspect-[4/3] rounded-3xl bg-slate-50/50 overflow-hidden border border-slate-100/70 flex items-center justify-center group">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full bg-gradient-to-tr from-blue-500/12 to-indigo-500/6 blur-3xl group-hover:scale-110 transition-transform duration-700" />
              <img
                src={thumbnails[activeImageIdx]}
                alt={productData.name}
                className="w-full h-full object-contain p-6 relative z-10 transition-transform duration-500 group-hover:scale-103"
              />
            </div>

            {/* Gallery Thumbnails List */}
            <div className="flex flex-wrap gap-2.5 justify-center">
              {thumbnails.map((thumb: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={cn(
                    "w-16 h-16 rounded-2xl border-2 overflow-hidden bg-slate-50/50 transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center p-1.5",
                    activeImageIdx === idx ? "border-blue-650 shadow" : "border-slate-100 hover:border-slate-250"
                  )}
                >
                  <img src={thumb} alt="thumbnail" className="w-full h-full object-contain rounded-lg" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Customizer */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-blue-650 tracking-widest uppercase">{productData.brand}</span>
                <div className="bg-blue-50/60 border border-blue-100/50 rounded-full px-3 py-1 flex items-center space-x-1.5">
                  <Rating value={Math.round(averageRating)} readOnly size="sm" />
                  <span className="text-[10px] text-blue-700 font-black mt-0.5">
                    {averageRating.toFixed(1)} ({productReviews.length} {productReviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-855 tracking-tight leading-none mt-1">
                {productData.name}
              </h1>
              <div className="flex flex-col space-y-1.5 pt-1.5">
                <div className="flex items-center space-x-2.5">
                  <Badge variant={productData.stock === 0 ? 'danger' : 'success'} size="sm" className="font-bold rounded-lg px-2 shadow-sm">
                    {productData.stock === 0 ? 'Out of Stock' : 'In Stock'}
                  </Badge>
                  <span className="text-[10.5px] font-bold text-slate-455">Ships within 24 hours</span>
                </div>
                {productData.stock !== undefined && productData.stock > 0 && productData.stock < 5 && (
                  <p className="text-[10.5px] font-extrabold text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 mt-1 max-w-fit flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>Low Stock: Only {productData.stock} units left!</span>
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-550 leading-relaxed font-sans mt-2">
              {productData.description}
            </p>

            <div className="p-4.5 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-baseline space-x-3">
                  <Price value={currentPrice} className="text-xl md:text-2xl font-black text-slate-900" />
                  {currentListPrice && (
                    <Price value={currentListPrice} className="text-xs text-slate-400 line-through font-bold" />
                  )}
                </div>
                <div className="flex items-center space-x-2 text-[10px] font-black text-slate-450 tracking-wide uppercase">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>As low as <Price value={emiCost} className="text-[10px] text-slate-700" />/mo with EMI. <span className="text-blue-600 cursor-pointer hover:underline">Learn More</span></span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                className="flex-grow bg-slate-900 hover:bg-slate-800 text-white rounded-full font-black text-[11px] uppercase tracking-widest h-12 shadow cursor-pointer active:scale-98 transition-all flex items-center justify-center border-none disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleAddToCartAction}
                disabled={productData.stock === 0 || isAdding}
              >
                {isAdding ? 'Adding...' : productData.stock === 0 ? 'Out Of Stock' : 'Add to Cart'}
              </button>
              
              <button
                className="flex-grow border-2 border-slate-900 text-slate-900 bg-white hover:bg-slate-50 rounded-full font-black text-[11px] uppercase tracking-widest h-12 cursor-pointer active:scale-98 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleBuyNowAction}
                disabled={productData.stock === 0 || isAdding}
              >
                {productData.stock === 0 ? 'Out of Stock' : 'Buy Now'}
              </button>

              <button
                onClick={handleToggleWishlist}
                className={cn(
                  "w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-sm bg-white",
                  isWishlisted
                    ? "border-red-200 text-red-500 fill-red-500 hover:text-red-600"
                    : "border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200"
                )}
              >
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="bg-white rounded-[24px] border border-slate-200/60 p-6 md:p-8 shadow-[0_4px_30px_rgba(15,23,42,0.01)] space-y-6">
          <div className="pb-3.5 border-b border-slate-100 text-left">
            <h2 className="text-base font-black text-slate-855 tracking-tight">Technical Specifications</h2>
            <p className="text-[11px] text-slate-455 font-bold mt-0.5">Hardware specifications and details for {productData.name}.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            {productData.specifications && Object.keys(productData.specifications).length > 0 ? (
              Object.entries(productData.specifications).map(([key, val]) => (
                <div key={key} className="p-4.5 bg-slate-50/40 rounded-2xl border border-slate-100/70 flex items-start space-x-3 text-left">
                  <Layers className="w-5.5 h-5.5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-850 tracking-tight capitalize">{key}</h4>
                    <p className="text-slate-500 font-semibold leading-relaxed">{String(val)}</p>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="p-4.5 bg-slate-50/40 rounded-2xl border border-slate-100/70 flex items-start space-x-3 text-left">
                  <Cpu className="w-5.5 h-5.5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-850 tracking-tight">Processor</h4>
                    <p className="text-slate-500 font-semibold leading-relaxed">High-performance processor optimized for workload speeds.</p>
                  </div>
                </div>
                <div className="p-4.5 bg-slate-50/40 rounded-2xl border border-slate-100/70 flex items-start space-x-3 text-left">
                  <Monitor className="w-5.5 h-5.5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-850 tracking-tight">Display</h4>
                    <p className="text-slate-500 font-semibold leading-relaxed">Super-vibrant Retina color accuracy calibration.</p>
                  </div>
                </div>
                <div className="p-4.5 bg-slate-50/40 rounded-2xl border border-slate-100/70 flex items-start space-x-3 text-left">
                  <Battery className="w-5.5 h-5.5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-850 tracking-tight">Battery</h4>
                    <p className="text-slate-500 font-semibold leading-relaxed">Fast charging support and all-day usage limits.</p>
                  </div>
                </div>
              </>
            )}
          </div>
              {/* Customer Reviews Section */}
        <div className="bg-white rounded-[24px] border border-slate-200/60 p-6 md:p-8 shadow-[0_4px_30px_rgba(15,23,42,0.01)] space-y-6">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="space-y-1 text-left">
              <h2 className="text-base font-black text-slate-850 tracking-tight">Customer Reviews</h2>
              <p className="text-[11px] text-slate-455 font-bold">Verified feedback from our tech community.</p>
            </div>
            {isEligibleForReview && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="h-[34px] px-4 border border-blue-150 hover:bg-blue-50/30 text-blue-650 text-xs font-black rounded-full flex items-center space-x-1.5 cursor-pointer active:scale-95 transition-all bg-white"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Write a Review</span>
              </button>
            )}
          </div>

          {/* Add Review Form */}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4 animate-fadeIn text-left">
              <h4 className="text-xs font-black text-slate-800">Write your feedback</h4>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-slate-455">Rating:</span>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="text-amber-400 hover:scale-110 transition-transform bg-transparent border-none p-0.5 cursor-pointer"
                    >
                      <Star
                        className={cn(
                          "w-5 h-5",
                          star <= reviewRating ? "fill-amber-400 text-amber-400" : "text-slate-350"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-455 uppercase">Your Review</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  className="w-full min-h-[80px] p-3 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none font-sans"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="h-9 px-5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50"
              >
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}

          {productReviews.length === 0 ? (
            <p className="text-xs text-slate-455 font-bold text-center py-6">
              No reviews yet. {isEligibleForReview ? 'Be the first to review this product!' : 'Purchase this product to leave a review.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {productReviews.map((rev) => {
                const isUuid = /^[0-9a-fA-F-]{8,36}$/.test(rev.username || '');
                let displayUsername = rev.username || 'Verified Buyer';
                if (currentUserId && rev.userId === currentUserId) {
                  displayUsername = profile?.fullName || profile?.email || 'You';
                } else if (isUuid) {
                  displayUsername = 'Verified Buyer';
                }

                const initials = displayUsername
                  ? displayUsername.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                  : 'U';
                const isEditing = editingReviewId === (rev.reviewId || rev.id);

                return (
                  <div key={rev.reviewId || rev.id} className="p-5 rounded-2xl border border-slate-150/70 bg-white hover:border-slate-350 hover:shadow-sm transition-all duration-300 text-left space-y-3.5 flex flex-col justify-between">
                    {isEditing ? (
                      <form onSubmit={handleUpdateReview} className="space-y-3 text-left w-full">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-black text-slate-455">Rating:</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                type="button"
                                key={star}
                                onClick={() => setEditRating(star)}
                                className="text-amber-400 hover:scale-110 transition-transform bg-transparent border-none p-0.5 cursor-pointer"
                              >
                                <Star
                                  className={cn(
                                    "w-4 h-4",
                                    star <= editRating ? "fill-amber-400 text-amber-400" : "text-slate-350"
                                  )}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <textarea
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          className="w-full min-h-[60px] p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none font-sans"
                          required
                        />
                        <div className="flex items-center space-x-2">
                          <button
                            type="submit"
                            disabled={isUpdatingReview}
                            className="h-8 px-4 bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-black uppercase tracking-wider rounded-lg cursor-pointer disabled:opacity-50"
                          >
                            {isUpdatingReview ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="h-8 px-4 border border-slate-200 text-slate-550 hover:bg-slate-50 text-[9px] font-black uppercase tracking-wider rounded-lg cursor-pointer bg-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-xs font-black">
                                {initials}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="text-xs font-black text-slate-800 truncate max-w-[120px]">{displayUsername}</h4>
                                  {currentUserId && rev.userId === currentUserId && (
                                    <span className="bg-blue-100 text-blue-800 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">You</span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-1 mt-0.5">
                                  <Check className="w-3 h-3 text-emerald-600 stroke-[3.5px]" />
                                  <span className="text-[9px] text-emerald-655 font-bold">Verified Buyer</span>
                                </div>
                              </div>
                            </div>
                            <Rating value={rev.rating} readOnly size="sm" />
                          </div>
                          <p className="text-xs text-slate-550 leading-relaxed font-sans italic">{rev.comment}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-400">
                          {currentUserId && rev.userId === currentUserId ? (
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handleStartEdit(rev)}
                                className="flex items-center space-x-1 hover:text-blue-650 transition-colors cursor-pointer border-none bg-transparent"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteReview(rev.reviewId || rev.id)}
                                className="flex items-center space-x-1 hover:text-red-655 transition-colors cursor-pointer border-none bg-transparent"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          ) : (
                            <button className="flex items-center space-x-1.5 hover:text-slate-700 transition-colors active:scale-90 cursor-pointer border-none bg-transparent">
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>Helpful</span>
                            </button>
                          )}
                          <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>        {/* Frequently Bought Together */}
        {bundleItems.length > 0 && (
          <div className="bg-white rounded-[24px] border border-slate-200/60 p-6 md:p-8 shadow-[0_4px_30px_rgba(15,23,42,0.01)] space-y-6">
            <div className="flex items-center space-x-2 pb-3.5 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-855 tracking-tight">Frequently Bought Together</h2>
              <div className="bg-blue-50 text-blue-700 border border-blue-100/50 rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-wide flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Recommendation</span>
              </div>
            </div>

            <div className="grid gap-4 lg:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
              {bundleItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/product/${item.id}`)}
                  className="p-3.5 rounded-[28px] border border-slate-200/50 bg-white/95 shadow-[0_8px_30px_rgba(15,23,42,0.02)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.06)] hover:-translate-y-1 transition-all duration-350 flex flex-col justify-between items-stretch overflow-hidden group cursor-pointer"
                >
                  <div className="relative w-full aspect-[4/3] rounded-[22px] bg-slate-50/30 overflow-hidden flex items-center justify-center flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                    />
                  </div>
                  <div className="flex flex-col flex-grow justify-between text-left mt-3">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-blue-655 tracking-wider uppercase">{item.brand}</span>
                      <h4 className="text-[13.5px] font-extrabold text-slate-800 tracking-tight leading-tight mt-1 truncate w-full">
                        {item.name}
                      </h4>
                      <div className="flex items-center space-x-1 pt-1">
                        <Rating value={reviewsStats[item.id] ? Math.round(reviewsStats[item.id].avgRating) : 5} readOnly size="sm" />
                        <span className="text-[10.5px] text-slate-800 font-bold ml-1.5">
                          ({reviewsStats[item.id] ? reviewsStats[item.id].count : 0})
                        </span>
                      </div>

                      {/* Price Section below the name */}
                      <div className="flex items-center flex-wrap gap-1.5">
                        <Price value={item.price} className="text-[15px] font-black text-slate-900 leading-none" />
                        {item.listPrice && item.listPrice > item.price && (
                          <>
                            <Price value={item.listPrice} className="text-[11px] text-slate-400 line-through font-semibold leading-none ml-1" />
                            <span className="px-1.5 py-0.5 rounded-[5px] bg-emerald-50 text-[9px] font-extrabold text-emerald-600 border border-emerald-100/50 uppercase tracking-wider leading-none">
                              {Math.round(((item.listPrice - item.price) / item.listPrice) * 100)}% OFF
                            </span>
                          </>
                        )}
                      </div>

                      {/* Category Tag under the price */}
                      {item.category && (
                        <div className="flex pt-1">
                          <span className="text-[9px] font-bold text-blue-700 bg-blue-50/60 px-2 py-0.5 rounded-[5px] border border-blue-100/40 uppercase tracking-wider">
                            {item.category}
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
                            handleAddToCart(item);
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
                            handleBuyNow(item);
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
        )}
      </div>
    </MainLayout>
  );
};

export default ProductDetail;
