import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { MainLayout } from '../layouts/MainLayout';
import { Price } from '../components/ui/Price';
import { addToCartBackend } from '../store/cartSlice';
import toast from 'react-hot-toast';
import { wishlistService } from '../services/wishlist.service';
import { productService } from '../services/product.service';
import { getImageUrl } from '../utils/imageHelper';
import { Trash2, ShoppingCart, Heart, ArrowRight } from 'lucide-react';

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

export const Wishlist: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const [wishlistProductIds, setWishlistProductIds] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWishlistAndProducts = async () => {
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

      // Fetch wishlist product IDs
      const wishlistedIds = await wishlistService.getWishlist(userId);
      setWishlistProductIds(wishlistedIds);

      // Fetch catalog products
      const res = await productService.getProducts({ limit: 100 });
      const prodData = res.data || res.products || (Array.isArray(res) ? res : []);
      setProducts(prodData || []);
    } catch (err: any) {
      console.error('Error fetching wishlist products:', err);
      toast.error('Failed to load wishlist.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlistAndProducts();
  }, [navigate]);

  const handleRemove = async (productId: string) => {
    try {
      const updated = await wishlistService.removeFromWishlist(productId);
      setWishlistProductIds(updated);
      toast.success('Removed from wishlist');
    } catch (err) {
      toast.error('Failed to remove item.');
    }
  };

  const handleAddToCart = async (product: any) => {
    try {
      await dispatch(addToCartBackend({ productId: product.productId || product.id, quantity: 1 })).unwrap();
      toast.success(`${product.name} added to cart!`);
    } catch (err: any) {
      toast.error(err || 'Failed to add item to cart.');
    }
  };

  const handleBuyNow = async (product: any) => {
    try {
      await dispatch(
        addToCartBackend({
          productId: product.productId || product.id,
          quantity: 1,
        })
      ).unwrap();
      navigate('/cart');
    } catch (err: any) {
      navigate('/cart');
    }
  };

  // Filter products in wishlist
  const wishlistedItems = products.filter((p) => wishlistProductIds.includes(p.productId || p.id));

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 min-h-[60vh]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <Heart className="w-5.5 h-5.5 text-red-500 fill-red-500" />
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">My Wishlist</h1>
          </div>
          <span className="text-xs font-bold text-slate-450 bg-slate-100/80 px-3 py-1.5 rounded-full">
            {wishlistedItems.length} {wishlistedItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : wishlistedItems.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200/60 rounded-[32px] p-8 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Heart className="w-8 h-8 text-slate-350" />
            </div>
            <h3 className="text-sm font-black text-slate-800">Your wishlist is empty</h3>
            <p className="text-xs font-bold text-slate-450 mt-1 max-w-xs mx-auto leading-relaxed">
              Explore our catalog and add your favorite items to save them for later!
            </p>
            <Link to="/">
              <button className="mt-6 h-10 px-6 rounded-full bg-blue-650 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition-colors inline-flex items-center space-x-1.5 cursor-pointer shadow">
                <span>Start Shopping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
            {wishlistedItems.map((product) => {
              const imgUrl = getImageUrl(product);
              return (
                <div
                  key={product.productId || product.id}
                  onClick={() => navigate(`/product/${product.productId || product.id}`)}
                  className="group relative bg-white border border-slate-200/60 rounded-[30px] p-4 flex flex-col justify-between hover:shadow-[0_24px_50px_rgba(15,23,42,0.04)] hover:-translate-y-1 transition-all duration-350 select-none text-left cursor-pointer"
                >
                  <div className="relative aspect-[4/3] w-full rounded-[22px] overflow-hidden bg-slate-50/70 p-2 sm:p-2.5 flex items-center justify-center mb-4">
                    <img
                      src={imgUrl}
                      alt={product.name}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(product.productId || product.id);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer border-none z-10"
                      title="Remove from Wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col flex-grow justify-between text-left">
                    <div className="space-y-1.5">
                      <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest leading-none block">
                        {product.brand || 'Premium'}
                      </span>
                      <h3 className="text-[13.5px] font-black text-slate-905 tracking-tight leading-snug mt-1 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[36px]">
                        {product.name}
                      </h3>
                      
                      {/* Price Section below the name */}
                      <div className="flex items-center flex-wrap gap-1.5">
                        <Price value={product.discount && product.discount > 0 ? Math.round(product.price * (1 - product.discount / 100)) : product.price} className="text-[15px] font-black text-slate-900 leading-none" />
                        {product.discount && product.discount > 0 && (
                          <>
                            <Price value={product.price} className="text-[11px] text-slate-400 line-through font-semibold leading-none ml-1" />
                            <span className="px-1.5 py-0.5 rounded-[5px] bg-emerald-50 text-[9px] font-extrabold text-emerald-600 border border-emerald-100/50 uppercase tracking-wider leading-none">
                              {product.discount}% OFF
                            </span>
                          </>
                        )}
                      </div>

                      {/* Category Tag under the price */}
                      {product.category && (
                        <div className="flex pt-1">
                          <span className="px-2 py-0.5 rounded bg-blue-50/60 text-[9px] font-bold text-blue-700 border border-blue-100/40 uppercase tracking-wider">
                            {product.category}
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
                            handleAddToCart(product);
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
                            handleBuyNow(product);
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
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
