import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import type { RootState, AppDispatch } from '../store';
import {
  removeCoupon,
  fetchCart,
  addToCartBackend,
  updateQuantityBackend,
  removeItemBackend,
  clearCartBackend,
} from '../store/cartSlice';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Price } from '../components/ui/Price';
import { Rating } from '../components/ui/Rating';

import {
  Plus,
  Minus,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Heart,
  Bookmark,
  Check,
  Trash2,
  ShoppingCart,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/cn';

import { productService } from '../services/product.service';
import { getImageUrl } from '../utils/imageHelper';

// Import local images
import emptyCartImg from '../assets/products/empty_shopping_cart.jpg';

export const Cart: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { items, discountAmount, status } = useSelector((state: RootState) => state.cart);
  const [isProcessing, setIsProcessing] = useState(false);

  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);

  // Load cart and catalog products from backend on mount
  useEffect(() => {
    dispatch(fetchCart());
    const loadCatalog = async () => {
      try {
        const res = await productService.getProducts({ limit: 100 });
        const prodData = res.data || res.products || (Array.isArray(res) ? res : []);
        setCatalogProducts(prodData || []);
      } catch (err) {
        console.error('Error loading catalog for cart recommendations:', err);
      }
    };
    loadCatalog();
  }, [dispatch]);

  const isLoading = status === 'loading' || isProcessing;

  // Handle Qty adjust
  const handleQuantityChange = async (id: string, currentQty: number, change: number, stock?: number) => {
    if (isLoading) return;
    const newQty = currentQty + change;
    if (newQty < 1) {
      handleRemove(id);
      return;
    }

    const maxStock = stock !== undefined ? stock : 10;
    if (newQty > maxStock) {
      toast.error(`Cannot exceed available stock of ${maxStock} units.`);
      return;
    }

    setIsProcessing(true);
    try {
      await dispatch(updateQuantityBackend({ productId: id, quantity: newQty })).unwrap();
      toast.success('Quantity updated');
    } catch (err: any) {
      toast.error(err || 'Failed to update quantity.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (isLoading) return;
    const ok = window.confirm('Are you sure you want to remove this item from your cart?');
    if (!ok) return;

    setIsProcessing(true);
    try {
      await dispatch(removeItemBackend(id)).unwrap();
      toast.success('Product removed from cart');
    } catch (err: any) {
      toast.error(err || 'Failed to remove product.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearCart = async () => {
    if (isLoading) return;
    const ok = window.confirm('Are you sure you want to clear your entire shopping cart?');
    if (!ok) return;

    setIsProcessing(true);
    try {
      await dispatch(clearCartBackend()).unwrap();
      toast.success('Cart cleared successfully');
    } catch (err: any) {
      toast.error(err || 'Failed to clear cart.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
    toast.success('Coupon removed');
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  // Helper helper to enrich the items with custom properties dynamically from backend data
  const enrichCartItem = (item: any) => {
    const image = getImageUrl(item);
    const ram = item.specifications?.ram || item.specifications?.RAM || item.ram || '';
    const storage = item.specifications?.storage || item.specifications?.Storage || item.storage || '';
    const specs = ram && storage ? `${ram} • ${storage}` : (ram || storage || 'Standard');
    const brand = item.brand?.toUpperCase() || 'ACCESSORIES';
    const listPrice = item.listPrice || (item.discount ? Math.round(item.price / (1 - item.discount / 100)) : item.price);
    const saleBadge = item.saleBadge || (item.discount ? `${item.discount}% OFF` : '');
    const stockStatus = item.stock !== undefined ? (item.stock > 0 ? 'In Stock' : 'Out of Stock') : 'In Stock';

    return {
      ...item,
      brand,
      specs,
      image,
      listPrice,
      saleBadge,
      stockStatus,
      deliveryStatus: 'Express Delivery by Tomorrow',
    };
  };

  // Pricing calculations (INR)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingThreshold = 50000; // Free shipping threshold in Rupees
  const isFreeShipping = subtotal >= shippingThreshold;
  const shipping = isFreeShipping ? 0 : subtotal > 0 ? 1500 : 0;
  const tax = subtotal * 0.018; // 1.8% tax matching the screenshot subtotal/tax ratio!
  const total = Math.max(0, subtotal - discountAmount + shipping + tax);

  // Accessories list (Frequently Bought Together) dynamically resolved from catalog database
  const accessories = useMemo(() => {
    if (catalogProducts.length === 0) return [];

    // Filter out products already in the cart
    const otherProducts = catalogProducts.filter(p => !items.some(item => item.id === (p.productId || p.id)));
    if (otherProducts.length === 0) return [];

    return otherProducts.slice(0, 3).map((prod) => {
      const image = getImageUrl(prod);
      const ram = prod.specifications?.ram || prod.specifications?.RAM || prod.ram || 'Standard';
      const storage = prod.specifications?.storage || prod.specifications?.Storage || prod.storage || 'Standard';
      const listPrice = prod.listPrice || (prod.discount ? Math.round(prod.price / (1 - prod.discount / 100)) : prod.price);
      const saleBadge = prod.saleBadge || (prod.discount ? `${prod.discount}% OFF` : '');

      return {
        id: prod.productId || prod.id,
        name: prod.name,
        brand: prod.brand || 'Accessories',
        price: prod.price,
        listPrice,
        saleBadge,
        image,
        rating: prod.rating || 5,
        reviews: prod.reviews || 45,
        ram,
        storage,
      };
    });
  }, [catalogProducts, items]);

  // Recommended products list for empty state dynamically resolved from catalog database
  const recommendations = useMemo(() => {
    if (catalogProducts.length === 0) return [];

    // Filter out products already in the cart
    const otherProducts = catalogProducts.filter(p => !items.some(item => item.id === (p.productId || p.id)));
    if (otherProducts.length === 0) return [];

    return otherProducts.slice(0, 5).map(prod => {
      const image = getImageUrl(prod);
      const ram = prod.specifications?.ram || prod.specifications?.RAM || prod.ram || 'Standard';
      const storage = prod.specifications?.storage || prod.specifications?.Storage || prod.storage || 'Standard';
      const listPrice = prod.listPrice || (prod.discount ? Math.round(prod.price / (1 - prod.discount / 100)) : prod.price);
      const saleBadge = prod.saleBadge || (prod.discount ? `${prod.discount}% OFF` : '');

      return {
        id: prod.productId || prod.id,
        name: prod.name,
        brand: prod.brand || 'Accessories',
        price: prod.price,
        listPrice,
        saleBadge,
        image,
        rating: prod.rating || 5,
        reviews: prod.reviews || 45,
        ram,
        storage,
      };
    });
  }, [catalogProducts, items]);

  const handleAddAccessory = (acc: typeof accessories[0]) => {
    dispatch(
      addToCartBackend({
        productId: acc.id,
        quantity: 1,
      })
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="w-full flex flex-col items-stretch space-y-6 select-none text-left animate-pulse">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center space-x-2">
            <div className="h-3 w-10 bg-slate-200 rounded" />
            <div className="h-3.5 w-3 bg-slate-300/50" />
            <div className="h-3 w-16 bg-slate-200 rounded" />
          </div>

          {/* Title Header */}
          <div className="border-b border-slate-100 pb-3">
            <div className="h-7 w-48 bg-slate-300 rounded" />
            <div className="h-3 w-64 bg-slate-200 rounded mt-2" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column - Cart Items */}
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-4">
                {/* 2 row items skeletons */}
                {Array.from({ length: 2 }).map((_, idx) => (
                  <div key={idx} className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shimmer-sweep">
                    <div className="flex items-center space-x-4">
                      {/* Image */}
                      <div className="w-16 h-16 bg-slate-200 rounded-2xl flex-shrink-0" />
                      {/* Details */}
                      <div className="space-y-2 text-left">
                        <div className="h-3.5 w-12 bg-slate-300 rounded" />
                        <div className="h-4.5 w-48 bg-slate-300 rounded" />
                        <div className="h-3 w-32 bg-slate-200 rounded" />
                      </div>
                    </div>
                    {/* Qty & Price */}
                    <div className="flex items-center justify-end space-x-8">
                      <div className="h-8 w-24 bg-slate-200 rounded-lg" />
                      <div className="h-5 w-20 bg-slate-300 rounded" />
                    </div>
                  </div>
                ))}
              </div>

              {/* FBT Accessories label */}
              <div className="space-y-4 pt-4">
                <div className="h-5 w-48 bg-slate-300 rounded" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="p-3.5 rounded-[28px] border border-slate-200/50 bg-white shadow-sm flex flex-col justify-between items-stretch shimmer-sweep">
                      <div className="relative w-full aspect-[4/3] rounded-[22px] bg-slate-200 overflow-hidden flex-shrink-0" />
                      <div className="space-y-2 mt-4 text-left">
                        <div className="h-3 w-12 bg-slate-300 rounded" />
                        <div className="h-4 w-28 bg-slate-300 rounded mt-1.5" />
                        <div className="border-t border-slate-100/80 my-3" />
                        <div className="flex items-center justify-between">
                          <div className="h-4 w-16 bg-slate-300 rounded" />
                          <div className="w-8 h-8 rounded-full bg-slate-200" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 space-y-5 shadow-sm shimmer-sweep">
                <div className="h-5 w-28 bg-slate-300 rounded" />
                <div className="border-b border-slate-100" />
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="h-3.5 w-16 bg-slate-200 rounded" />
                    <div className="h-3.5 w-20 bg-slate-300 rounded" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3.5 w-16 bg-slate-200 rounded" />
                    <div className="h-3.5 w-12 bg-slate-300 rounded" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3.5 w-16 bg-slate-200 rounded" />
                    <div className="h-3.5 w-16 bg-slate-300 rounded" />
                  </div>
                </div>

                <div className="border-b border-slate-100" />
                
                <div className="flex justify-between">
                  <div className="h-4.5 w-16 bg-slate-300 rounded" />
                  <div className="h-4.5 w-24 bg-slate-300 rounded" />
                </div>

                <div className="h-10 w-full bg-slate-200 rounded-xl" />
                <div className="h-12 w-full bg-slate-300 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full flex flex-col items-stretch space-y-6 select-none text-left">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-400">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-350" />
          <span className="text-slate-600">Cart</span>
        </div>

        {items.length > 0 ? (
          <>
            {/* Page Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Shopping Cart ({items.reduce((sum, item) => sum + item.quantity, 0)} Items)
              </h1>
              <button
                onClick={handleClearCart}
                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors flex items-center space-x-1 cursor-pointer bg-transparent border-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cart</span>
              </button>
            </div>

            {/* Main Cart Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Column: Cart items & Carousels */}
              <div className="lg:col-span-2 space-y-8">
                {/* Cart Items List */}
                <div className="space-y-4">
                  {items.map((item, index) => {
                    const enriched = enrichCartItem(item);
                    return (
                      <div
                        key={`${item.id}-${item.ram || ''}-${item.storage || ''}-${index}`}
                        className="p-4 sm:p-5 bg-white border border-slate-200/70 rounded-[24px] shadow-[0_4px_25px_rgba(15,23,42,0.01)] flex flex-col items-stretch gap-4 relative group"
                      >
                        {/* Upper Segment: Item Detail & Price */}
                        <div className="flex items-start justify-between gap-3 sm:gap-4 w-full">
                          {/* Image & Title Details */}
                          <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-slate-50/70 border border-slate-100/80 overflow-hidden flex items-center justify-center p-1.5 flex-shrink-0">
                              <img src={enriched.image} alt={enriched.name} className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-grow min-w-0 flex flex-col text-left">
                              <span className="text-[9px] sm:text-[10px] font-black text-blue-600 tracking-wider uppercase">
                                {enriched.brand}
                              </span>
                              <h3 className="text-[13px] sm:text-[14.5px] font-black text-slate-850 tracking-tight leading-tight mt-0.5 truncate">
                                {enriched.name}
                              </h3>
                              <p className="text-[10px] sm:text-[11px] font-bold text-slate-455 mt-1">
                                {enriched.specs}
                              </p>

                              {/* Availability Badges */}
                              <div className="flex items-center mt-2.5 text-[9.5px] sm:text-[10.5px] font-bold">
                                <span className="text-green-600 flex items-center space-x-1">
                                  <Check className="w-3.5 h-3.5 stroke-[3px] flex-shrink-0" />
                                  <span>{enriched.stockStatus}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Price Stack details (Right side top align) */}
                          <div className="flex flex-col items-end text-right flex-shrink-0">
                            <Price value={enriched.price * enriched.quantity} className="text-[14px] sm:text-base font-black text-slate-900" />
                            {enriched.listPrice && (
                              <div className="flex items-center space-x-1.5 mt-1">
                                <Price value={enriched.listPrice * enriched.quantity} className="text-[10px] sm:text-[11px] text-slate-400 line-through font-bold" />
                                <span className="text-[9px] sm:text-[10px] font-black text-red-500 bg-red-50 border border-red-100/50 rounded-lg px-1.5 py-0.5">
                                  {enriched.saleBadge}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Lower Segment: Quantity Changer & Actions */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 w-full mt-1.5">
                          {/* Quantity adjustments */}
                          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/50 rounded-xl px-2 py-0.5 shadow-sm">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity, -1, item.stock)}
                              className="w-5.5 h-5.5 flex items-center justify-center text-slate-550 hover:text-slate-900 active:scale-75 transition-all cursor-pointer font-bold"
                            >
                              <Minus className="w-3 h-3 stroke-[2.5px]" />
                            </button>
                            <span className="text-xs font-black text-slate-700 min-w-[16px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity, 1, item.stock)}
                              className="w-5.5 h-5.5 flex items-center justify-center text-slate-550 hover:text-slate-900 active:scale-75 transition-all cursor-pointer font-bold"
                            >
                              <Plus className="w-3 h-3 stroke-[2.5px]" />
                            </button>
                          </div>

                          {/* Action Items List */}
                          <div className="flex items-center space-x-3.5 text-xs font-bold text-slate-500">
                            <button
                              className="flex items-center space-x-1 hover:text-blue-650 transition-colors cursor-pointer"
                              title="Save for Later"
                            >
                              <Bookmark className="w-4 h-4 text-slate-400" />
                              <span className="hidden sm:inline">Save for Later</span>
                            </button>
                            <span className="text-slate-200">|</span>
                            <button
                              className="flex items-center space-x-1 hover:text-red-500 transition-colors cursor-pointer"
                              title="Add to Wishlist"
                            >
                              <Heart className="w-4 h-4 text-slate-400" />
                              <span className="hidden sm:inline">Wishlist</span>
                            </button>
                            <span className="text-slate-200">|</span>
                            <button
                              onClick={() => handleRemove(item.id)}
                              className="flex items-center space-x-1 hover:text-red-655 transition-colors cursor-pointer text-slate-500 hover:bg-transparent"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-400" />
                              <span className="text-red-655">Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Frequently Bought Together section (Desktop) */}
                <div className="space-y-4 pt-4 hidden lg:block">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                    <Sparkles className="w-4.5 h-4.5 text-blue-650" />
                    <h3 className="text-[13.5px] font-black text-slate-800 tracking-tight">
                      Frequently Bought Together
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                    {accessories.map((acc) => (
                      <div
                        key={acc.id}
                        onClick={() => navigate(`/product/${acc.id}`)}
                        className="p-3.5 rounded-[28px] border border-slate-200/50 bg-white/95 shadow-[0_8px_30px_rgba(15,23,42,0.02)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.06)] hover:-translate-y-1 transition-all duration-350 flex flex-col justify-between items-stretch overflow-hidden group cursor-pointer"
                      >
                        {/* Thumbnail image */}
                        <div className="relative w-full aspect-[4/3] rounded-[22px] bg-slate-50/70 p-2 sm:p-2.5 overflow-hidden flex items-center justify-center flex-shrink-0">
                          <img
                            src={acc.image}
                            alt={acc.name}
                            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>

                        {/* Content Container */}
                        <div className="flex flex-col flex-grow justify-between text-left mt-3">
                          <div className="space-y-1 mb-2">
                            <span className="text-[10px] font-black text-blue-655 tracking-wider uppercase">{acc.brand}</span>
                            <h4 className="text-[13.5px] font-extrabold text-slate-800 tracking-tight leading-tight mt-1 truncate w-full">
                              {acc.name}
                            </h4>
                            <div className="flex items-center space-x-1 pt-1">
                              <Rating value={acc.rating} readOnly size="sm" />
                              <span className="text-[10.5px] text-slate-800 font-bold ml-1.5">({acc.reviews})</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <span className="text-[9.5px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-[5px]">
                                {acc.ram.includes('RAM') || acc.ram.includes('GB') ? (acc.ram.includes('RAM') ? acc.ram : `${acc.ram} RAM`) : `${acc.ram} RAM`}
                              </span>
                              <span className="text-[9.5px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-[5px]">
                                {acc.storage.includes('SSD') ? acc.storage : `${acc.storage} SSD`}
                              </span>
                            </div>
                          </div>

                          <div className="border-t border-slate-100/80 my-3" />

                          <div className="flex items-center justify-between flex-shrink-0">
                            <div className="flex flex-col text-left">
                              <Price value={acc.price} className="text-[14.5px] font-black text-slate-900 leading-none" />
                              {acc.listPrice && (
                                <Price value={acc.listPrice} className="text-[10.5px] text-slate-400 line-through font-bold mt-1" />
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddAccessory(acc);
                              }}
                              className="w-9 h-9 rounded-full bg-blue-50/70 hover:bg-blue-600 text-slate-800 hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm"
                              aria-label={`Add ${acc.name} to cart`}
                            >
                              <ShoppingCart className="w-4 h-4 stroke-[2.2px]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Order Summary details - Sticky on desktop */}
              <aside className="col-span-1 lg:sticky lg:top-20 lg:self-start space-y-5">
                <Card variant="simple" className="p-6 border-slate-200 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.01)] text-left">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100 mb-5">
                    Order Summary
                  </h3>

                  {/* Summary Rows */}
                  <div className="space-y-3.5 text-xs font-semibold text-slate-550 mb-5">
                    <div className="flex justify-between">
                      <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                      <Price value={subtotal} className="text-slate-850" />
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-2.5 py-1.5">
                        <div className="flex items-center space-x-1">
                          <span>Cart Discount</span>
                          <button
                            onClick={handleRemoveCoupon}
                            className="text-red-500 hover:text-red-700 font-bold text-[10px] ml-1 cursor-pointer"
                            title="Remove coupon"
                          >
                            (Remove)
                          </button>
                        </div>
                        <span>-<Price value={discountAmount} /></span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className={cn(shipping === 0 ? "text-green-600 font-bold" : "text-slate-800")}>
                        {shipping === 0 ? 'FREE' : <Price value={shipping} />}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Tax (Estimated)</span>
                      <Price value={tax} className="text-slate-800" />
                    </div>

                    <div className="flex justify-between text-sm font-black text-slate-900 pt-3.5 border-t border-slate-100">
                      <span>Total</span>
                      <Price value={total} className="text-blue-600 text-base" />
                    </div>
                  </div>



                  {/* Checkout CTA */}
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full h-12 rounded-full text-[11px] font-black shadow-lg shadow-blue-500/10 flex items-center justify-center cursor-pointer active:scale-98 bg-blue-600 hover:bg-blue-700 text-white transition-all uppercase tracking-widest"
                    onClick={handleCheckout}
                  >
                    <span className="tracking-[0.2em] translate-x-[0.1em]">CHECKOUT</span>
                  </Button>
                </Card>

                {/* Secure checkout info */}
                <Card variant="simple" className="p-4 border-slate-200 bg-white rounded-2xl shadow-sm text-left flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 flex-shrink-0">
                    <ShieldCheck className="w-4.5 h-4.5 text-slate-500" />
                  </div>
                  <div className="flex-grow text-[9.5px] leading-relaxed text-slate-450 font-bold">
                    <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider mb-0.5">Secure Payment Guarantee</h4>
                    <span>Your transaction is encrypted and protected by NatCart Secure Systems. We accept major credit cards, PayPal, and digital wallets.</span>
                  </div>
                </Card>

                {/* Need help support links */}
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 font-bold">
                    Need help? <Link to="#" className="text-blue-650 hover:underline">Chat with Support</Link>
                  </span>
                </div>
              </aside>
            </div>

            {/* Frequently Bought Together section (Mobile only) */}
            <div className="space-y-4 pt-4 block lg:hidden mt-8">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                <Sparkles className="w-4.5 h-4.5 text-blue-600" />
                <h3 className="text-[13.5px] font-black text-slate-800 tracking-tight">
                  Frequently Bought Together
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                {accessories.map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => navigate(`/product/${acc.id}`)}
                    className="p-3.5 rounded-[28px] border border-slate-200/50 bg-white/95 shadow-[0_8px_30px_rgba(15,23,42,0.02)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.06)] hover:-translate-y-1 transition-all duration-350 flex flex-col justify-between items-stretch overflow-hidden group cursor-pointer"
                  >
                    {/* Thumbnail image */}
                    <div className="relative w-full aspect-[4/3] rounded-[22px] bg-slate-50/30 overflow-hidden flex items-center justify-center flex-shrink-0">
                      <img
                        src={acc.image}
                        alt={acc.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                      />
                    </div>

                    {/* Content Container */}
                    <div className="flex flex-col flex-grow justify-between text-left mt-3">
                      <div className="space-y-1 mb-2">
                        <span className="text-[10px] font-black text-blue-655 tracking-wider uppercase">{acc.brand}</span>
                        <h4 className="text-[13.5px] font-extrabold text-slate-800 tracking-tight leading-tight mt-1 truncate w-full">
                          {acc.name}
                        </h4>
                        <div className="flex items-center space-x-1 pt-1">
                          <Rating value={acc.rating} readOnly size="sm" />
                          <span className="text-[10.5px] text-slate-800 font-bold ml-1.5">({acc.reviews})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[9.5px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-[5px]">
                            {acc.ram.includes('RAM') || acc.ram.includes('GB') ? (acc.ram.includes('RAM') ? acc.ram : `${acc.ram} RAM`) : `${acc.ram} RAM`}
                          </span>
                          <span className="text-[9.5px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-[5px]">
                            {acc.storage.includes('SSD') ? acc.storage : `${acc.storage} SSD`}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-slate-100/80 my-3" />

                      <div className="flex items-center justify-between flex-shrink-0">
                        <div className="flex flex-col text-left">
                          <Price value={acc.price} className="text-[14.5px] font-black text-slate-900 leading-none" />
                          {acc.listPrice && (
                            <Price value={acc.listPrice} className="text-[10.5px] text-slate-400 line-through font-bold mt-1" />
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddAccessory(acc);
                          }}
                          className="w-9 h-9 rounded-full bg-blue-50/70 hover:bg-blue-600 text-slate-800 hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm"
                          aria-label={`Add ${acc.name} to cart`}
                        >
                          <ShoppingCart className="w-4 h-4 stroke-[2.2px]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Empty Cart State */
          <div className="w-full py-16 flex flex-col items-center justify-center text-center space-y-12">
            {/* Center Shopping Cart graphic */}
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                {/* Visual tooltip bubble */}
                <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[9px] font-extrabold rounded-full px-2.5 py-0.5 flex items-center space-x-1 whitespace-nowrap shadow-sm">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Smart Cart</span>
                </div>

                {/* White Container card with realistic metallic shopping cart */}
                <div className="w-36 h-36 rounded-3xl bg-white border border-slate-200/70 flex items-center justify-center shadow-lg relative overflow-hidden group p-4">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <img src={emptyCartImg} alt="Shopping Cart" className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-350" />
                </div>
              </div>

              <div className="space-y-2 max-w-sm mt-3">
                <h2 className="text-xl font-black text-slate-850 tracking-tight">Your Cart is Empty</h2>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Looks like you haven't added anything yet. Explore our latest technology products and find the perfect upgrade for your digital workflow.
                </p>
              </div>

              <div className="flex items-center space-x-2.5 sm:space-x-3.5 pt-2.5">
                <Button
                  variant="primary"
                  size="md"
                  className="rounded-xl text-xs font-black px-5 sm:px-6 cursor-pointer active:scale-95 flex items-center whitespace-nowrap"
                  onClick={() => navigate('/')}
                >
                  <span>Start Shopping</span>
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="rounded-xl text-xs font-black px-5 sm:px-6 cursor-pointer border-slate-250 active:scale-95 bg-white text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                  onClick={() => navigate('/')}
                >
                  Explore Categories
                </Button>
              </div>
            </div>

            {/* Recommended for You carousel below */}
            <div className="w-full space-y-6 pt-12 border-t border-slate-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2 text-left">
                  <Sparkles className="w-4.5 h-4.5 text-blue-650" />
                  <h3 className="text-sm font-black text-slate-850 tracking-tight">
                    Recommended for You
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
                {recommendations.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => navigate(`/product/${prod.id}`)}
                    className="p-3.5 rounded-[28px] border border-slate-200/50 bg-white/95 shadow-[0_8px_30px_rgba(15,23,42,0.02)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.06)] hover:-translate-y-1 transition-all duration-350 flex flex-col justify-between items-stretch overflow-hidden group cursor-pointer"
                  >
                    {/* Thumbnail image */}
                    <div className="relative w-full aspect-[4/3] rounded-[22px] bg-slate-50/70 p-2 sm:p-2.5 overflow-hidden flex items-center justify-center flex-shrink-0">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                      {prod.saleBadge && (
                        <div className="absolute top-3 left-3 bg-white border border-red-500/80 text-red-550 font-black text-[9.5px] tracking-wide uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                          {prod.saleBadge}
                        </div>
                      )}
                    </div>

                    {/* Content Container */}
                    <div className="flex flex-col flex-grow justify-between text-left mt-3">
                      <div className="space-y-1 mb-2">
                        <span className="text-[10px] font-black text-blue-655 tracking-wider uppercase">{prod.brand}</span>
                        <h4 className="text-[13.5px] font-extrabold text-slate-800 tracking-tight leading-tight mt-1 truncate w-full">
                          {prod.name}
                        </h4>
                        <div className="flex items-center space-x-1 pt-1">
                          <Rating value={prod.rating} readOnly size="sm" />
                          <span className="text-[10.5px] text-slate-800 font-bold ml-1.5">({prod.reviews})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[9.5px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-[5px]">
                            {prod.ram.includes('RAM') || prod.ram.includes('GB') ? (prod.ram.includes('RAM') ? prod.ram : `${prod.ram} RAM`) : `${prod.ram} RAM`}
                          </span>
                          <span className="text-[9.5px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-[5px]">
                            {prod.storage.includes('SSD') ? prod.storage : `${prod.storage} SSD`}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-slate-100/80 my-3" />

                      <div className="flex items-center justify-between flex-shrink-0">
                        <div className="flex flex-col text-left">
                          <Price value={prod.price} className="text-[14.5px] font-black text-slate-900 leading-none" />
                          {prod.listPrice && (
                            <Price value={prod.listPrice} className="text-[10.5px] text-slate-400 line-through font-bold mt-1" />
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(
                              addToCartBackend({
                                productId: prod.id,
                                quantity: 1,
                              })
                            );
                          }}
                          className="w-9 h-9 rounded-full bg-blue-50/70 hover:bg-blue-600 text-slate-800 hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm"
                        >
                          <ShoppingCart className="w-4 h-4 stroke-[2.2px]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Cart;
