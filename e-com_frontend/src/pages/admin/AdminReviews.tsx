import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { AnimatedCounter } from '../../components/common/AnimatedCounter';
import { reviewService } from '../../services/review.service';
import type { Review } from '../../services/review.service';
import { productService } from '../../services/product.service';
import toast from 'react-hot-toast';
import { Trash2, MessageSquare, Star, Search, TrendingUp, AlertTriangle, ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/cn';

// --- Period Filter Options ---
const PERIOD_OPTIONS = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7days', label: 'Last 7 Days' },
  { key: 'last30days', label: 'Last 30 Days' },
];

// --- Rating Filter Options ---
const RATING_FILTER_OPTIONS = [
  { key: 'all', label: 'All Ratings' },
  { key: 'critical', label: 'Critical (1-2★)' },
  { key: 'positive', label: 'Positive (4-5★)' },
  { key: '5', label: '5 Stars Only' },
  { key: '4', label: '4 Stars Only' },
  { key: '3', label: '3 Stars Only' },
  { key: '2', label: '2 Stars Only' },
  { key: '1', label: '1 Star Only' },
];

// --- Premium Shimmer Skeleton Helpers ---
const ShimmerStyle: React.FC = () => (
  <style>{`
    @keyframes shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position: 600px 0; }
    }
    @keyframes loadingBar {
      0% { left: -35%; }
      100% { left: 100%; }
    }
    .ske-base {
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 1200px 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }
    .ske-r  { border-radius: 8px; }
    .ske-rp { border-radius: 9999px; }
    .animate-loadingBar {
      animation: loadingBar 1s linear infinite;
    }
  `}</style>
);

const Bone: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <div className={`ske-base ske-r ${className}`} style={style} />
);

const BoneCircle: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`ske-base ske-rp ${className}`} />
);

// --- Compact Stat Card Component ---
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  iconBgColor: string;
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, iconBgColor, highlight }) => {
  return (
    <div
      className={`relative rounded-2xl bg-white border p-3.5 flex items-center justify-between shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
        highlight 
          ? 'border-red-300 bg-gradient-to-br from-red-50/20 to-white ring-1 ring-red-200' 
          : 'border-slate-100 bg-gradient-to-br from-slate-50/5 to-white'
      }`}
    >
      <div className="flex items-center space-x-3.5 min-w-0 text-left">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${iconBgColor}`}>
          {icon}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">
            {title}
          </span>
          <span className={`text-xl font-black tracking-tight mt-0.5 leading-none ${highlight ? 'text-red-650' : 'text-slate-800'}`}>
            <AnimatedCounter value={value} />
          </span>
          <span className="text-[9px] text-slate-455 font-bold tracking-wide mt-1 truncate">
            {subtitle}
          </span>
        </div>
      </div>
    </div>
  );
};

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dropdown filter states
  const [period, setPeriod] = useState('all');
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [ratingFilter, setRatingFilter] = useState('all');
  const [isRatingFilterOpen, setIsRatingFilterOpen] = useState(false);

  const fetchReviewsData = async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const [reviewsData, productsRes] = await Promise.all([
        reviewService.getAllReviews(),
        productService.getProducts({ limit: 1000 }),
      ]);
      
      setReviews(reviewsData);

      // Parse products list robustly
      let allProducts: any[] = [];
      if (productsRes) {
        if (Array.isArray(productsRes)) {
          allProducts = productsRes;
        } else {
          allProducts = productsRes.products || productsRes.data || [];
        }
      }

      console.log('AdminReviews - Loaded Reviews:', reviewsData);
      console.log('AdminReviews - Loaded Products:', allProducts);

      // Map product IDs to product names
      const productMap: Record<string, string> = {};
      allProducts.forEach((p: any) => {
        const id = p.productId || p.id;
        if (id) {
          productMap[id] = p.name;
        }
      });
      setProductNames(productMap);
      console.log('AdminReviews - Mapped Products:', productMap);

    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch reviews data.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReviewsData();
  }, []);

  // Close period and rating dropdowns on outside click
  useEffect(() => {
    if (!isPeriodOpen && !isRatingFilterOpen) return;
    const closeDropdowns = () => {
      setIsPeriodOpen(false);
      setIsRatingFilterOpen(false);
    };
    window.addEventListener('click', closeDropdowns);
    return () => window.removeEventListener('click', closeDropdowns);
  }, [isPeriodOpen, isRatingFilterOpen]);

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await reviewService.deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.reviewId !== reviewId));
      toast.success('Review deleted successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete review.');
    }
  };

  // Helper to check if review date matches active period filter
  const filterByPeriod = (createdAt: string, selectedPeriod: string): boolean => {
    if (selectedPeriod === 'all') return true;
    
    const reviewDate = new Date(createdAt);
    const now = new Date();
    
    // Set hours to 0 to compare full days
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    
    if (selectedPeriod === 'today') {
      return reviewDate >= startOfToday;
    }
    if (selectedPeriod === 'yesterday') {
      return reviewDate >= startOfYesterday && reviewDate < startOfToday;
    }
    if (selectedPeriod === 'last7days') {
      const sevenDaysAgo = new Date(startOfToday);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return reviewDate >= sevenDaysAgo;
    }
    if (selectedPeriod === 'last30days') {
      const thirtyDaysAgo = new Date(startOfToday);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return reviewDate >= thirtyDaysAgo;
    }
    return true;
  };

  // Helper to filter reviews by rating scores
  const filterByRating = (rating: number, filter: string): boolean => {
    if (filter === 'all') return true;
    if (filter === 'critical') return rating <= 2;
    if (filter === 'positive') return rating >= 4;
    return rating === Number(filter);
  };

  // Filter reviews based on search query AND period filter AND rating score filter
  const filteredReviews = reviews.filter((rev) => {
    // 1. Period Date Filter
    if (!filterByPeriod(rev.createdAt, period)) return false;

    // 2. Rating Score Filter
    if (!filterByRating(rev.rating, ratingFilter)) return false;

    // 3. Text Search Filter
    const query = searchQuery.toLowerCase();
    const productName = (productNames[rev.productId] || '').toLowerCase();
    return (
      rev.username.toLowerCase().includes(query) ||
      rev.comment.toLowerCase().includes(query) ||
      rev.productId.toLowerCase().includes(query) ||
      rev.reviewId.toLowerCase().includes(query) ||
      productName.includes(query)
    );
  });

  // Calculate statistics dynamically based on filtered reviews
  const totalReviewsCount = filteredReviews.length;
  const avgRating = totalReviewsCount > 0
    ? (filteredReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviewsCount).toFixed(1)
    : '0.0';
  const excellentReviewsCount = filteredReviews.filter((r) => r.rating >= 4).length;
  const criticalReviewsCount = filteredReviews.filter((r) => r.rating <= 2).length;

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 select-none text-left space-y-6">
        <ShimmerStyle />
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
          <div className="space-y-1">
            <div className="text-[12px] font-bold text-blue-600 tracking-wider uppercase">User Interactions</div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-655" />
              <span>Reviews</span>
            </h1>
            <p className="text-[12.5px] text-slate-555 font-medium mt-0.5">
              Manage and moderate customer product reviews
            </p>
          </div>
          <span className="text-[11.5px] font-black text-blue-655 bg-blue-50/50 border border-blue-100/50 px-3 py-1.5 rounded-full self-start sm:self-auto shadow-sm">
            {loading ? '...' : `${filteredReviews.length} ${filteredReviews.length === 1 ? 'Review' : 'Reviews'}`}
          </span>
        </div>

        {/* Stats Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            [...Array(4)].map((_, idx) => (
              <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3.5 flex-grow pr-4">
                  <BoneCircle className="w-9 h-9 flex-shrink-0" />
                  <div className="space-y-1 flex-grow">
                    <Bone className="h-3 w-16" />
                    <Bone className="h-4 w-20" />
                    <Bone className="h-2 w-24" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              <StatCard
                title="Total Reviews"
                subtitle="Based on active filters"
                value={totalReviewsCount}
                iconBgColor="bg-blue-50 text-blue-600"
                icon={<MessageSquare className="w-5 h-5" />}
              />
              <StatCard
                title="Average Rating"
                subtitle="Active filter average"
                value={`${avgRating} / 5.0`}
                iconBgColor="bg-amber-50 text-amber-500"
                icon={<Star className="w-5 h-5 fill-amber-500 text-amber-500" />}
              />
              <StatCard
                title="Excellent"
                subtitle="4-5★ reviews count"
                value={excellentReviewsCount}
                iconBgColor="bg-emerald-50 text-emerald-500"
                icon={<TrendingUp className="w-5 h-5" />}
              />
              <StatCard
                title="Critical"
                subtitle="1-2★ reviews count"
                value={criticalReviewsCount}
                iconBgColor="bg-red-50 text-red-500"
                icon={<AlertTriangle className="w-5 h-5" />}
                highlight={criticalReviewsCount > 0}
              />
            </>
          )}
        </div>

        {/* Search & Multiple Dropdowns Filtering Bar Panel */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reviews..."
              className="w-full h-9 pl-9 pr-4 bg-slate-50/50 hover:bg-slate-50/30 hover:border-slate-300 focus:bg-slate-50/50 border border-slate-200 rounded-xl text-[12px] text-slate-700 placeholder-slate-405 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Rating Filter Dropdown */}
            <div className="relative min-w-[150px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPeriodOpen(false);
                  setIsRatingFilterOpen(!isRatingFilterOpen);
                }}
                className="h-9 w-full px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-between space-x-2.5 shadow-sm hover:bg-slate-50 focus:outline-none bg-white cursor-pointer"
              >
                <span>{RATING_FILTER_OPTIONS.find(o => o.key === ratingFilter)?.label}</span>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", isRatingFilterOpen ? "rotate-180" : "")} />
              </button>
              {isRatingFilterOpen && (
                <div className="absolute top-10.5 left-0 right-0 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 mt-1 space-y-0.5 text-left max-h-[250px] overflow-y-auto scrollbar-thin">
                  {RATING_FILTER_OPTIONS.map(opt => (
                    <div
                      key={opt.key}
                      onClick={() => {
                        setRatingFilter(opt.key);
                        setIsRatingFilterOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer text-xs font-bold text-slate-700 transition-colors",
                        ratingFilter === opt.key ? "text-blue-655 bg-blue-50/30" : ""
                      )}
                    >
                      <span>{opt.label}</span>
                      {ratingFilter === opt.key && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Period Dropdown */}
            <div className="relative min-w-[150px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRatingFilterOpen(false);
                  setIsPeriodOpen(!isPeriodOpen);
                }}
                className="h-9 w-full px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-between space-x-2.5 shadow-sm hover:bg-slate-50 focus:outline-none bg-white cursor-pointer"
              >
                <span>{PERIOD_OPTIONS.find(o => o.key === period)?.label}</span>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", isPeriodOpen ? "rotate-180" : "")} />
              </button>
              {isPeriodOpen && (
                <div className="absolute top-10.5 left-0 right-0 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 mt-1 space-y-0.5 text-left">
                  {PERIOD_OPTIONS.map(opt => (
                    <div
                      key={opt.key}
                      onClick={() => {
                        setPeriod(opt.key);
                        setIsPeriodOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer text-xs font-bold text-slate-700 transition-colors",
                        period === opt.key ? "text-blue-655 bg-blue-50/30" : ""
                      )}
                    >
                      <span>{opt.label}</span>
                      {period === opt.key && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => fetchReviewsData(true)}
              className="h-9 px-4 border border-slate-200 text-slate-655 bg-white hover:bg-slate-50 rounded-xl text-[11.5px] font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Structured Grid Table */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col pt-1 relative">
          {isRefreshing && (
            <div className="w-full h-0.5 bg-blue-100 absolute top-0 left-0 overflow-hidden z-10">
              <div className="absolute top-0 left-0 h-full bg-blue-600 animate-loadingBar w-1/3 rounded-full" />
            </div>
          )}

          {/* Grid Headers */}
          <div className="hidden sm:grid sm:grid-cols-12 items-center border-b border-slate-100 px-5 py-3 bg-slate-50/20 text-[10px] font-black text-slate-400 uppercase tracking-wider">
            <div className="col-span-3">Product</div>
            <div className="col-span-2 pl-2">User</div>
            <div className="col-span-2 pl-2">Rating</div>
            <div className="col-span-3 pl-2">Comment</div>
            <div className="col-span-1.5 text-right pr-2">Date</div>
            <div className="col-span-0.5" />
          </div>

          <div className="relative p-3 sm:p-4 bg-white min-h-[250px] space-y-2">
            {loading ? (
              // Shimmer Skeletons matching Admin Page design
              [...Array(6)].map((_, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center p-3 rounded-xl border border-slate-50 gap-2.5 sm:gap-0 bg-white"
                >
                  <div className="col-span-3 space-y-1.5 pr-2">
                    <Bone className="h-3.5 w-4/5" />
                    <Bone className="h-2 w-1/3" />
                  </div>
                  <div className="col-span-2 sm:pl-2"><Bone className="h-3.5 w-16" /></div>
                  <div className="col-span-2 sm:pl-2 flex space-x-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Bone key={i} className="w-3.5 h-3.5 rounded-md" />
                    ))}
                  </div>
                  <div className="col-span-3 sm:pl-2"><Bone className="h-3.5 w-4/5" /></div>
                  <div className="col-span-1.5 text-right pr-2"><Bone className="h-3.5 w-16 ml-auto" /></div>
                  <div className="col-span-0.5 flex justify-end w-full">
                    <Bone className="h-4 w-4 rounded" />
                  </div>
                </div>
              ))
            ) : filteredReviews.length === 0 ? (
              <div className="text-center py-16 bg-white p-8">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <MessageSquare className="w-6 h-6 text-slate-350" />
                </div>
                <h3 className="text-xs font-black text-slate-800">No reviews found</h3>
                <p className="text-[11px] font-bold text-slate-455 mt-1 max-w-xs mx-auto">
                  There are no reviews matching your search criteria or filter ranges.
                </p>
              </div>
            ) : (
              filteredReviews.map((rev) => {
                const isUuid = /^[0-9a-fA-F-]{8,36}$/.test(rev.username || '');
                const cleanUsername = isUuid ? 'Verified Buyer' : rev.username;
                const productName = productNames[rev.productId] || 'Unknown Product';
                return (
                  <div
                    key={rev.reviewId}
                    className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center p-3.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all gap-2.5 sm:gap-0 bg-white"
                  >
                    {/* Col 1: Product */}
                    <div className="col-span-3 flex flex-col min-w-0 pr-2">
                      <span className="text-xs font-bold text-slate-800 truncate" title={productName}>
                        {productName}
                      </span>
                      <span className="font-mono text-[9px] text-slate-400 mt-0.5" title={rev.productId}>
                        {rev.productId}
                      </span>
                    </div>

                    {/* Col 2: User */}
                    <div className="col-span-2 sm:pl-2 text-xs font-bold text-slate-700">
                      {cleanUsername}
                    </div>

                    {/* Col 3: Rating */}
                    <div className="col-span-2 sm:pl-2 flex space-x-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "w-3.5 h-3.5",
                            star <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-205"
                          )}
                        />
                      ))}
                    </div>

                    {/* Col 4: Comment */}
                    <div className="col-span-3 sm:pl-2 text-slate-655 max-w-full truncate pr-2" title={rev.comment}>
                      {rev.comment}
                    </div>

                    {/* Col 5: Date */}
                    <div className="col-span-1.5 text-right pr-2 text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </div>

                    {/* Col 6: Actions */}
                    <div className="col-span-0.5 flex justify-end w-full">
                      <button
                        onClick={() => handleDelete(rev.reviewId)}
                        className="p-1.5 rounded-lg text-slate-455 hover:text-red-650 hover:bg-red-50/50 transition-colors cursor-pointer border-none bg-transparent active:scale-95"
                        title="Delete Review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
