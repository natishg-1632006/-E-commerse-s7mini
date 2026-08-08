import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import type { RootState, AppDispatch } from '../store';
import { clearCart } from '../store/cartSlice';
import { MainLayout } from '../layouts/MainLayout';
import { Button } from '../components/ui/Button';
import { Price } from '../components/ui/Price';
import {
  MapPin,
  Truck,
  CreditCard,
  Lock,
  ShieldCheck,
  Check,
  ChevronRight,
  Smartphone,
  Building2,
  AlertCircle,
  Tag,
  CheckCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/cn';
import toast from 'react-hot-toast';
import { addressService } from '../services/address.service';
import { paymentService } from '../services/payment.service';
import { orderService } from '../services/order.service';
import { couponService } from '../services/coupon.service';
import { productService } from '../services/product.service';
import { getImageUrl } from '../utils/imageHelper';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const Checkout: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { items, discountAmount } = useSelector((state: RootState) => state.cart);
  const { profile } = useSelector((state: RootState) => state.auth);

  // Calculations at the top to be in scope for hooks and state
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 0; // Standard shipping is free

  // Stepper state: 2 = Checkout (Shipping/Delivery), 3 = Payment, 4 = Confirmation
  const [activeStep, setActiveStep] = useState(2);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentPending, setPaymentPending] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const [searchParams] = useSearchParams();
  const queryOrderId = searchParams.get('orderId');

  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [orderSubtotal, setOrderSubtotal] = useState<number | null>(null);
  const [orderTotal, setOrderTotal] = useState<number | null>(null);

  const displayItems = orderItems.length > 0 ? orderItems : items;
  const displaySubtotal = orderSubtotal !== null ? orderSubtotal : subtotal;
  const displayTax = 0; // Tax removed

  // Shipping form fields
  const [fullName, setFullName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');

  // Trigger simulated loading skeleton state on stepper changes (except step 2 which fetches from API)
  useEffect(() => {
    if (activeStep !== 2) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeStep]);

  // Load profile address from backend
  useEffect(() => {
    const loadAddress = async () => {
      setIsLoading(true);
      try {
        const addr = await addressService.getAddress();
        if (addr) {
          if (addr.fullName) setFullName(addr.fullName);
          if (addr.phone) setMobileNumber(addr.phone);
          const parts = (addr.address || '').split(', ');
          if (parts.length > 0) setAddressLine1(parts[0]);
          if (parts.length > 1) setAddressLine2(parts.slice(1).join(', '));
          if (addr.city) setCity(addr.city);
          if (addr.state) setStateName(addr.state);
          if (addr.pincode) setPincode(addr.pincode);
        }
      } catch (err) {
        console.error('Error fetching address from profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAddress();
    if (profile) {
      if (profile.fullName) setFullName(profile.fullName);
      if (profile.email) setEmailAddress(profile.email);
      if (profile.phone) setMobileNumber(profile.phone);
    }
  }, [profile]);

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Payment Method: 'card' | 'upi' | 'netbank' | 'cod'
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbank' | 'cod'>('card');

  // Card fields
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Random order details generated on payment completion
  const [orderId, setOrderId] = useState('');
  const [displayId, setDisplayId] = useState('');

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [cartProducts, setCartProducts] = useState<any[]>([]);

  const couponApplied = !!appliedCoupon;

  // Fetch product catalogs to retrieve category IDs for cart items
  useEffect(() => {
    const loadCartProducts = async () => {
      if (items.length === 0) return;
      try {
        const productIds = items.map(it => it.id);
        const res = await productService.getProductsByIds(productIds);
        const list = res.data || res || [];
        setCartProducts(list);
      } catch (err) {
        console.error('Error loading cart products catalog details:', err);
      }
    };
    loadCartProducts();
  }, [items]);

  const getValidationItems = () => {
    return items.map(item => {
      const prod = cartProducts.find(p => p.productId === item.id);
      return {
        productId: item.id,
        categoryId: prod?.categoryId || '',
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      };
    });
  };

  // Redirect if cart is empty and we aren't in confirmation screen and not recovering/paying for an order
  useEffect(() => {
    if (items.length === 0 && activeStep !== 4 && !orderId && !queryOrderId) {
      navigate('/cart');
    }
  }, [items, activeStep, navigate, orderId, queryOrderId]);

  // Load existing order details if queryOrderId is present
  useEffect(() => {
    const loadQueryOrder = async () => {
      if (!queryOrderId) return;
      setIsLoading(true);
      try {
        const existingOrder = await orderService.getOrderById(queryOrderId);
        if (existingOrder) {
          setOrderId(existingOrder.orderId);
          setDisplayId(existingOrder.displayId || existingOrder.orderId);
          setOrderTotal(existingOrder.totalAmount);
          setOrderSubtotal(existingOrder.subtotal || existingOrder.totalAmount);
          setOrderItems(existingOrder.items || []);
          setPaymentPending(true);
          setActiveStep(3); // Go directly to step 3 (Payment selector/form)
          
          const method = String(existingOrder.paymentMethod).toLowerCase();
          if (method.includes('cod')) setPaymentMethod('cod');
          else if (method.includes('upi')) setPaymentMethod('upi');
          else if (method.includes('netbank') || method.includes('net_banking')) setPaymentMethod('netbank');
          else setPaymentMethod('card');

          if (existingOrder.shippingAddress?.fullName) {
            setFullName(existingOrder.shippingAddress.fullName);
          }
          if (existingOrder.shippingAddress?.phone) {
            setMobileNumber(existingOrder.shippingAddress.phone);
          }
          if (existingOrder.shippingAddress?.address) {
            const parts = existingOrder.shippingAddress.address.split(', ');
            if (parts.length > 0) setAddressLine1(parts[0]);
            if (parts.length > 1) setAddressLine2(parts.slice(1).join(', '));
          }
          if (existingOrder.shippingAddress?.city) {
            setCity(existingOrder.shippingAddress.city);
          }
          if (existingOrder.shippingAddress?.state) {
            setStateName(existingOrder.shippingAddress.state);
          }
          if (existingOrder.shippingAddress?.pincode) {
            setPincode(existingOrder.shippingAddress.pincode);
          }
        } else {
          toast.error('Order not found.');
          navigate('/orders');
        }
      } catch (err) {
        console.error('Error fetching order for payment recovery:', err);
        toast.error('Failed to load order details.');
        navigate('/orders');
      } finally {
        setIsLoading(false);
      }
    };
    loadQueryOrder();
  }, [queryOrderId, navigate]);

  // Revalidate coupon on subtotal changes (triggered by cart quantity changes or items removal)
  useEffect(() => {
    if (!appliedCoupon || activeStep >= 3 || orderId || queryOrderId) return;

    const revalidate = async () => {
      try {
        const validationItems = getValidationItems();
        const result = await couponService.validateCoupon(appliedCoupon.couponCode, subtotal, validationItems);
        if (result.valid) {
          setAppliedCoupon(result);
        } else {
          setAppliedCoupon(null);
          setCouponError('Coupon removed because your cart no longer satisfies the coupon conditions.');
        }
      } catch (err) {
        setAppliedCoupon(null);
        setCouponError('Coupon removed because your cart no longer satisfies the coupon conditions.');
      }
    };

    revalidate();
  }, [subtotal, cartProducts]);

  // Scroll to top smoothly when step changes or loading finishes
  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      try {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
        document.body.scrollTop = 0;
        if (document.documentElement) {
          document.documentElement.scrollTop = 0;
        }
      } catch (e) {
        window.scrollTo(0, 0);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [activeStep, isLoading]);

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim() || couponApplied || couponLoading) return;

    setCouponLoading(true);
    setCouponError('');

    try {
      const validationItems = getValidationItems();
      const result = await couponService.validateCoupon(couponCodeInput.trim().toUpperCase(), subtotal, validationItems);
      if (result.valid) {
        setAppliedCoupon(result);
        setCouponCodeInput('');
      } else {
        setCouponError('Invalid Coupon');
      }
    } catch (err: any) {
      console.error('Error validating coupon:', err);
      const errMsg = err.response?.data?.message || err.message || 'Invalid Coupon';
      setCouponError(errMsg);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError('');
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="w-full flex flex-col items-stretch space-y-8 select-none text-left animate-pulse">
          {/* Breadcrumbs skeleton */}
          <div className="flex items-center space-x-2 text-[10.5px] font-bold text-slate-455">
            <div className="h-3.5 w-10 bg-slate-200 rounded" />
            <div className="h-3.5 w-3 bg-slate-300/50" />
            <div className="h-3.5 w-16 bg-slate-200 rounded" />
          </div>

          {/* Stepper visual skeleton */}
          <div className="max-w-md mx-auto w-full flex items-center justify-between pb-4">
            <div className="w-9 h-9 rounded-full bg-slate-300" />
            <div className="h-1 flex-grow bg-slate-200 mx-2" />
            <div className="w-9 h-9 rounded-full bg-slate-300" />
            <div className="h-1 flex-grow bg-slate-200 mx-2" />
            <div className="w-9 h-9 rounded-full bg-slate-200" />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left side form placeholder */}
            <div className="lg:col-span-8 space-y-6 bg-white border border-slate-200/50 rounded-3xl p-6 shadow-sm shimmer-sweep">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div className="h-5 w-40 bg-slate-300 rounded" />
                <div className="w-6 h-6 rounded-full bg-slate-200" />
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="h-12 bg-slate-100 rounded-xl" />
                  <div className="h-12 bg-slate-100 rounded-xl" />
                </div>
                <div className="h-12 bg-slate-100 rounded-xl" />
                <div className="h-12 bg-slate-100 rounded-xl" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="h-12 bg-slate-100 rounded-xl" />
                  <div className="h-12 bg-slate-100 rounded-xl" />
                  <div className="h-12 bg-slate-100 rounded-xl" />
                </div>
              </div>
            </div>

            {/* Right side Summary aside */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 space-y-5 shadow-sm shimmer-sweep">
                <div className="h-5 w-32 bg-slate-300 rounded" />
                <div className="border-b border-slate-100" />
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="h-3.5 w-16 bg-slate-200 rounded" />
                    <div className="h-3.5 w-20 bg-slate-300 rounded" />
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

                <div className="h-12 w-full bg-slate-300 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }


  // Enrich items with specs and images directly from backend data
  const enrichCartItem = (item: any) => {
    const image = getImageUrl(item);
    const ram = item.specifications?.ram || item.specifications?.RAM || item.ram || '';
    const storage = item.specifications?.storage || item.specifications?.Storage || item.storage || '';
    const specs = ram && storage ? `${ram} • ${storage}` : (ram || storage || 'Standard');

    return {
      ...item,
      brand: item.brand?.toUpperCase() || 'ACCESSORIES',
      specs,
      image,
    };
  };

  // Calculations
  const couponDiscount = appliedCoupon?.discount || 0;
  const total = orderTotal !== null
    ? orderTotal
    : (appliedCoupon
      ? Math.max(0, appliedCoupon.finalAmount + displayTax + shipping)
      : Math.max(0, displaySubtotal - discountAmount - couponDiscount + shipping + displayTax));

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!emailAddress.trim()) {
      newErrors.emailAddress = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(emailAddress)) {
      newErrors.emailAddress = 'Please enter a valid email address';
    }
    if (!mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(mobileNumber.replace(/[\s-]/g, ''))) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit number';
    }
    if (!addressLine1.trim()) newErrors.addressLine1 = 'Address Line 1 is required';
    if (!city.trim()) newErrors.city = 'City is required';
    if (!stateName.trim()) newErrors.stateName = 'State is required';
    
    // Pincode validation: must be 6 digits
    const cleanedPincode = pincode.replace(/\s/g, '');
    if (!cleanedPincode) {
      newErrors.pincode = 'Please enter a valid pincode';
    } else if (!/^\d{6}$/.test(cleanedPincode)) {
      newErrors.pincode = 'Please enter a valid pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmitted(true);
    if (validateForm()) {
      setActiveStep(3);
    }
  };

  const handleExistingOrderPayment = async () => {
    if (paymentMethod === 'card') {
      const cardErrors: Record<string, string> = {};
      if (!cardName.trim()) cardErrors.cardName = 'Name is required';
      if (!cardNumber.trim() || cardNumber.length < 16) cardErrors.cardNumber = 'Valid card number is required';
      if (!cardExpiry.trim()) cardErrors.cardExpiry = 'Expiry is required';
      if (!cardCvv.trim() || cardCvv.length < 3) cardErrors.cardCvv = 'CVV is required';

      if (Object.keys(cardErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...cardErrors }));
        return;
      }
    }

    setIsLoading(true);
    try {
      let mappedMethod = 'Card';
      if (paymentMethod === 'cod') mappedMethod = 'COD';
      else if (paymentMethod === 'upi') mappedMethod = 'UPI';
      else if (paymentMethod === 'netbank') mappedMethod = 'NetBanking';

      let targetOrderId = orderId;

      if (!targetOrderId) {
        const shippingAddress = {
          fullName,
          phone: mobileNumber,
          address: `${addressLine1}${addressLine2 ? ', ' : ''}${addressLine2}`,
          city,
          state: stateName,
          pincode: pincode.replace(/\s/g, ''),
        };

        const order = await orderService.createOrder({
          email: emailAddress,
          shippingAddress,
          paymentMethod: mappedMethod,
          couponCode: appliedCoupon ? appliedCoupon.couponCode : undefined,
          orderStatus: mappedMethod === 'COD' ? 'PROCESSING' : 'PENDING_PAYMENT',
        } as any);

        targetOrderId = order.orderId;
        setOrderId(targetOrderId);
        setDisplayId(order.displayId || targetOrderId);
        setOrderTotal(order.totalAmount);
        setOrderSubtotal(order.subtotal || order.totalAmount);
        setOrderItems(order.items || []);

        dispatch(clearCart());
      }

      if (mappedMethod === 'COD') {
        setPaymentPending(true);
        setActiveStep(4);
        toast.success('Order placed successfully! Please pay on delivery.');
      } else {
        const payRes = await paymentService.createPayment(targetOrderId, mappedMethod);
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          toast.error('Failed to load Razorpay Checkout SDK. Please try again.');
          setPaymentPending(true);
          setActiveStep(4);
          return;
        }

        const options = {
          key: payRes.razorpayKeyId,
          amount: Math.round(payRes.amount * 100),
          currency: 'INR',
          name: 'Tech Store',
          description: `Payment for Order #${displayId || targetOrderId}`,
          order_id: payRes.razorpayOrderId,
          handler: async function (response: any) {
            setIsLoading(true);
            try {
              await paymentService.verifyPayment(
                targetOrderId,
                response.razorpay_payment_id,
                response.razorpay_order_id,
                response.razorpay_signature
              );
              setPaymentPending(false);
              toast.success('Payment completed successfully!');
            } catch (err: any) {
              console.error('Payment verification failed:', err);
              setPaymentPending(true);
              toast.error('Payment verification failed. Please check with your bank.');
            } finally {
              setIsLoading(false);
            }
          },
          prefill: {
            name: fullName || '',
            contact: mobileNumber || '',
          },
          theme: {
            color: '#2563EB',
          },
          modal: {
            ondismiss: function () {
              setPaymentPending(true);
              toast('Payment closed. You can retry paying anytime.', { icon: 'ℹ️' });
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        setPaymentPending(true);
        setActiveStep(4);
      }
    } catch (err: any) {
      console.error('Order/Payment submission failed:', err);
      setPaymentPending(true);
      setActiveStep(4);
      toast('Order created, but online payment is pending. Please complete your payment.', { icon: '⚠️' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    dispatch(clearCart());
    navigate('/');
  };

  // Stepper Header Component
  const renderStepper = () => {
    const steps = [
      { number: 1, label: 'Cart', completed: true },
      { number: 2, label: 'Checkout', completed: activeStep > 2, active: activeStep === 2 },
      { number: 3, label: 'Payment', completed: activeStep > 3, active: activeStep === 3 },
      { number: 4, label: 'Confirmation', completed: activeStep > 4, active: activeStep === 4 },
    ];

    return (
      <div className="flex items-center justify-center w-full py-4 md:py-6">
        <div className="flex items-center space-x-1.5 sm:space-x-4 max-w-2xl w-full">
          {steps.map((step, idx) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center flex-1 relative">
                <div
                  className={cn(
                    "w-7.5 h-7.5 sm:w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 border",
                    step.completed
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : step.active
                      ? "bg-blue-600 border-blue-600 text-white shadow-md ring-4 ring-blue-50"
                      : "bg-slate-100 border-slate-200 text-slate-400"
                  )}
                >
                  {step.completed ? (
                    <Check className="w-4 h-4 stroke-[3px]" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-black mt-2 tracking-tight",
                    step.active ? "text-slate-800" : "text-slate-400"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "h-[2px] flex-grow -mt-5 transition-all duration-500",
                    step.completed ? "bg-blue-600" : "bg-slate-150"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="w-full flex flex-col items-stretch space-y-6 select-none text-left">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-400">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-350" />
          <Link to="/cart" className="hover:text-blue-600 transition-colors">Cart</Link>
          <ChevronRight className="w-3 h-3 text-slate-350" />
          <span className="text-slate-800">Checkout</span>
        </div>

        {/* Stepper block */}
        {renderStepper()}

        {activeStep === 4 ? (
          /* Step 4: Confirmation screen */
          <div className="max-w-xl w-full mx-auto bg-white rounded-[24px] border border-slate-200/60 p-8 md:p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-6 animate-fadeIn">
            {paymentPending ? (
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-100 relative">
                <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-ping duration-1000 scale-95" />
                <AlertTriangle className="w-10 h-10 text-amber-600 stroke-[2px]" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100 relative">
                <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping duration-1000 scale-95" />
                <Check className="w-10 h-10 text-emerald-600 stroke-[3.5px]" />
              </div>
            )}

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-855 tracking-tight">
                {paymentPending ? 'Order Created (Payment Pending)' : 'Order Placed Successfully!'}
              </h2>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed font-sans">
                {paymentPending
                  ? `Your order has been created, but payment is pending. Please complete your payment now to reserve the items, or continue to pay later from your My Orders page.`
                  : `Thank you for shopping with NatCart. Your order details and tracking link have been sent to ${emailAddress || 'your email'}.`
                }
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left space-y-3.5">
              <div className="flex items-center justify-between text-xs border-b border-slate-200/50 pb-2.5">
                <span className="text-slate-455 font-bold">Order ID</span>
                <span className="text-slate-800 font-black tracking-tight">{displayId || orderId}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-slate-200/50 pb-2.5">
                <span className="text-slate-455 font-bold">Delivery Estimate</span>
                <span className="text-slate-800 font-black">3-5 Business Days</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-455 font-bold">{paymentPending ? 'Total Amount' : 'Total Paid'}</span>
                <Price value={total} className="text-sm font-black text-slate-900" />
              </div>
            </div>

            {paymentPending ? (
              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={isPaying}
                  className="w-full rounded-2xl font-black text-xs h-12 shadow hover:shadow-md cursor-pointer active:scale-98 transition-all flex items-center justify-center space-x-2"
                  onClick={async () => {
                    setIsPaying(true);
                    try {
                      let mappedMethod = 'Card';
                      if (paymentMethod === 'cod') mappedMethod = 'COD';
                      else if (paymentMethod === 'upi') mappedMethod = 'UPI';
                      else if (paymentMethod === 'netbank') mappedMethod = 'NetBanking';
                      
                      if (mappedMethod === 'COD') {
                        await paymentService.createPayment(orderId, mappedMethod);
                        setPaymentPending(false);
                        toast.success('Payment confirmed as COD.');
                        return;
                      }

                      const payRes = await paymentService.createPayment(orderId, mappedMethod);
                      const scriptLoaded = await loadRazorpayScript();
                      if (!scriptLoaded) {
                        toast.error('Failed to load Razorpay Checkout SDK. Please try again.');
                        return;
                      }

                      const options = {
                        key: payRes.razorpayKeyId,
                        amount: Math.round(payRes.amount * 100),
                        currency: 'INR',
                        name: 'Tech Store',
                        description: `Payment for Order #${displayId || orderId}`,
                        order_id: payRes.razorpayOrderId,
                        handler: async function (response: any) {
                          setIsPaying(true);
                          try {
                            await paymentService.verifyPayment(
                              orderId,
                              response.razorpay_payment_id,
                              response.razorpay_order_id,
                              response.razorpay_signature
                            );
                            setPaymentPending(false);
                            toast.success('Payment completed successfully!');
                          } catch (err: any) {
                            console.error('Payment verification failed:', err);
                            toast.error('Payment verification failed. Please check with your bank.');
                          } finally {
                            setIsPaying(false);
                          }
                        },
                        prefill: {
                          name: fullName || '',
                          contact: mobileNumber || '',
                        },
                        theme: {
                          color: '#2563EB',
                        },
                        modal: {
                          ondismiss: function () {
                            toast('Payment closed.', { icon: 'ℹ️' });
                          }
                        }
                      };

                      const rzp = new (window as any).Razorpay(options);
                      rzp.open();
                    } catch (err: any) {
                      console.error('Payment retry failed:', err);
                      toast.error('Payment failed. Please try again or pay from My Orders.');
                    } finally {
                      setIsPaying(false);
                    }
                  }}
                >
                  {isPaying ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <CreditCard className="w-4 h-4 text-white" />}
                  <span>Pay Now</span>
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full rounded-2xl font-black text-xs h-12 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer active:scale-98 transition-all"
                  onClick={handleFinish}
                >
                  Pay Later &amp; Continue Shopping
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="lg"
                className="w-full rounded-2xl font-black text-xs h-12 shadow cursor-pointer active:scale-98 transition-all"
                onClick={handleFinish}
              >
                Continue Shopping
              </Button>
            )}
          </div>
        ) : (
          /* Step 2 & 3 layouts */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
            {/* Left side details: Address & Method or Payment details */}
            <div className="lg:col-span-2 space-y-6">
              {activeStep === 2 ? (
                <>
                  {/* Step 2 Form: Shipping Address */}
                  <div className="bg-white rounded-[24px] border border-slate-200/60 p-6 md:p-8 shadow-[0_4px_20px_rgba(15,23,42,0.01)] space-y-6">
                    <div className="flex items-center space-x-3 pb-3.5 border-b border-slate-100">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100/50">
                        <MapPin className="w-5 h-5 stroke-[2.2px]" />
                      </div>
                      <h2 className="text-base font-black text-slate-850 tracking-tight">Shipping Address</h2>
                    </div>

                    <form onSubmit={handleContinueToPayment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="flex flex-col space-y-1.5 text-left">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Full Name</label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className={cn(
                            "w-full h-11 px-4 rounded-xl border bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all",
                            submitted && errors.fullName ? "border-rose-450 focus:ring-rose-500/20 focus:border-rose-500" : "border-slate-200 hover:border-slate-300"
                          )}
                        />
                        {submitted && errors.fullName && (
                          <span className="text-[10px] font-bold text-rose-550 flex items-center mt-1"><AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" /> {errors.fullName}</span>
                        )}
                      </div>

                      {/* Email */}
                      <div className="flex flex-col space-y-1.5 text-left">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Email Address</label>
                        <input
                          type="email"
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          placeholder="e.g. rahul@example.com"
                          className={cn(
                            "w-full h-11 px-4 rounded-xl border bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all",
                            submitted && errors.emailAddress ? "border-rose-450 focus:ring-rose-500/20 focus:border-rose-500" : "border-slate-200 hover:border-slate-300"
                          )}
                        />
                        {submitted && errors.emailAddress && (
                          <span className="text-[10px] font-bold text-rose-555 flex items-center mt-1"><AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" /> {errors.emailAddress}</span>
                        )}
                      </div>

                      {/* Mobile */}
                      <div className="flex flex-col space-y-1.5 text-left">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Mobile Number</label>
                        <input
                          type="tel"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className={cn(
                            "w-full h-11 px-4 rounded-xl border bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all",
                            submitted && errors.mobileNumber ? "border-rose-450 focus:ring-rose-500/20 focus:border-rose-500" : "border-slate-200 hover:border-slate-300"
                          )}
                        />
                        {submitted && errors.mobileNumber && (
                          <span className="text-[10px] font-bold text-rose-555 flex items-center mt-1"><AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" /> {errors.mobileNumber}</span>
                        )}
                      </div>

                      {/* Address Line 1 */}
                      <div className="flex flex-col space-y-1.5 text-left">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Address Line 1</label>
                        <input
                          type="text"
                          value={addressLine1}
                          onChange={(e) => setAddressLine1(e.target.value)}
                          placeholder="e.g. Flat, House no., Building, Apartment"
                          className={cn(
                            "w-full h-11 px-4 rounded-xl border bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all",
                            submitted && errors.addressLine1 ? "border-rose-450 focus:ring-rose-500/20 focus:border-rose-500" : "border-slate-200 hover:border-slate-300"
                          )}
                        />
                        {submitted && errors.addressLine1 && (
                          <span className="text-[10px] font-bold text-rose-555 flex items-center mt-1"><AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" /> {errors.addressLine1}</span>
                        )}
                      </div>

                      {/* Address Line 2 */}
                      <div className="flex flex-col space-y-1.5 md:col-span-2 text-left">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Address Line 2 (Optional)</label>
                        <input
                          type="text"
                          value={addressLine2}
                          onChange={(e) => setAddressLine2(e.target.value)}
                          placeholder="e.g. Area, Colony, Street, Sector"
                          className="w-full h-11 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>

                      {/* City */}
                      <div className="flex flex-col space-y-1.5 text-left">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">City</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Mumbai"
                          className={cn(
                            "w-full h-11 px-4 rounded-xl border bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all",
                            submitted && errors.city ? "border-rose-450 focus:ring-rose-500/20 focus:border-rose-500" : "border-slate-200 hover:border-slate-300"
                          )}
                        />
                        {submitted && errors.city && (
                          <span className="text-[10px] font-bold text-rose-555 flex items-center mt-1"><AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" /> {errors.city}</span>
                        )}
                      </div>

                      {/* State */}
                      <div className="flex flex-col space-y-1.5 text-left">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">State</label>
                        <input
                          type="text"
                          value={stateName}
                          onChange={(e) => setStateName(e.target.value)}
                          placeholder="e.g. Maharashtra"
                          className={cn(
                            "w-full h-11 px-4 rounded-xl border bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all",
                            submitted && errors.stateName ? "border-rose-450 focus:ring-rose-500/20 focus:border-rose-500" : "border-slate-200 hover:border-slate-300"
                          )}
                        />
                        {submitted && errors.stateName && (
                          <span className="text-[10px] font-bold text-rose-555 flex items-center mt-1"><AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" /> {errors.stateName}</span>
                        )}
                      </div>

                      {/* Pincode */}
                      <div className="flex flex-col space-y-1.5 text-left">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Pincode</label>
                        <input
                          type="text"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          placeholder="Pincode"
                          maxLength={6}
                          className={cn(
                            "w-full h-11 px-4 rounded-xl border bg-white text-xs font-semibold text-slate-855 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all",
                            submitted && errors.pincode ? "border-rose-350 focus:ring-rose-500/10 focus:border-rose-350 bg-rose-50/20 text-rose-700" : "border-slate-200 hover:border-slate-300"
                          )}
                        />
                        {submitted && errors.pincode && (
                          <span className="text-[10px] font-bold text-rose-555 flex items-center mt-1"><AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" /> {errors.pincode}</span>
                        )}
                      </div>
                    </form>
                  </div>


                </>
              ) : (
                /* Step 3 Form: Payment Details */
                <div className="bg-white rounded-[24px] border border-slate-200/60 p-6 md:p-8 shadow-[0_4px_20px_rgba(15,23,42,0.01)] space-y-6">
                  <div className="flex items-center space-x-3 pb-3.5 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100/50">
                      <CreditCard className="w-5 h-5 stroke-[2.2px]" />
                    </div>
                    <h2 className="text-base font-black text-slate-855 tracking-tight">Payment Method</h2>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Card choice */}
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={cn(
                        "p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all duration-200",
                        paymentMethod === 'card' ? "border-blue-600 bg-blue-50/10 text-blue-650 font-black" : "border-slate-200 hover:bg-slate-50 text-slate-500 font-semibold"
                      )}
                    >
                      <CreditCard className="w-5 h-5" />
                      <span className="text-[11px] tracking-tight">Card Payment</span>
                    </button>

                    {/* UPI choice */}
                    <button
                      onClick={() => setPaymentMethod('upi')}
                      className={cn(
                        "p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all duration-200",
                        paymentMethod === 'upi' ? "border-blue-600 bg-blue-50/10 text-blue-650 font-black" : "border-slate-200 hover:bg-slate-50 text-slate-500 font-semibold"
                      )}
                    >
                      <Smartphone className="w-5 h-5" />
                      <span className="text-[11px] tracking-tight">UPI / QR</span>
                    </button>

                    {/* Net Banking choice */}
                    <button
                      onClick={() => setPaymentMethod('netbank')}
                      className={cn(
                        "p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all duration-200",
                        paymentMethod === 'netbank' ? "border-blue-600 bg-blue-50/10 text-blue-650 font-black" : "border-slate-200 hover:bg-slate-50 text-slate-500 font-semibold"
                      )}
                    >
                      <Building2 className="w-5 h-5" />
                      <span className="text-[11px] tracking-tight">Net Banking</span>
                    </button>

                    {/* COD choice */}
                    <button
                      onClick={() => setPaymentMethod('cod')}
                      className={cn(
                        "p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all duration-200",
                        paymentMethod === 'cod' ? "border-blue-600 bg-blue-50/10 text-blue-650 font-black" : "border-slate-200 hover:bg-slate-50 text-slate-500 font-semibold"
                      )}
                    >
                      <Truck className="w-5 h-5" />
                      <span className="text-[11px] tracking-tight">Pay on Delivery</span>
                    </button>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    {paymentMethod === 'card' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-1.5 md:col-span-2 text-left">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Cardholder Name</label>
                          <input
                            type="text"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="Rahul Sharma"
                            className={cn(
                              "w-full h-11 px-4 rounded-xl border bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all",
                              submitted && errors.cardName ? "border-rose-450" : "border-slate-200"
                            )}
                          />
                        </div>

                        <div className="flex flex-col space-y-1.5 md:col-span-2 text-left">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Card Number</label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                            placeholder="0000 0000 0000 0000"
                            className={cn(
                              "w-full h-11 px-4 rounded-xl border bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all",
                              submitted && errors.cardNumber ? "border-rose-450" : "border-slate-200"
                            )}
                          />
                        </div>

                        <div className="flex flex-col space-y-1.5 text-left">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Expiry Date (MM/YY)</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value.slice(0, 5))}
                            placeholder="MM/YY"
                            className={cn(
                              "w-full h-11 px-4 rounded-xl border bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all",
                              submitted && errors.cardExpiry ? "border-rose-450" : "border-slate-200"
                            )}
                          />
                        </div>

                        <div className="flex flex-col space-y-1.5 text-left">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">CVV</label>
                          <input
                            type="password"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                            placeholder="***"
                            maxLength={3}
                            className={cn(
                              "w-full h-11 px-4 rounded-xl border bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all",
                              submitted && errors.cardCvv ? "border-rose-450" : "border-slate-200"
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'upi' && (
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-blue-600">
                          <Smartphone className="w-5.5 h-5.5" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xs font-black text-slate-850">Pay via UPI QR</h3>
                          <p className="text-[10px] text-slate-450 font-bold">You will be shown a secure QR code to scan from your PhonePe, Google Pay, or Paytm app on the next screen.</p>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'netbank' && (
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-blue-600">
                          <Building2 className="w-5.5 h-5.5" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xs font-black text-slate-850">Net Banking Redirect</h3>
                          <p className="text-[10px] text-slate-450 font-bold">You will be redirected securely to your selected bank's login portal to complete your transaction.</p>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'cod' && (
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-blue-600">
                          <Truck className="w-5.5 h-5.5" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xs font-black text-slate-850">Pay on Delivery Selected</h3>
                          <p className="text-[10px] text-slate-450 font-bold">Please pay with Cash, UPI, or Card once your delivery partner arrives at your address.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right side checkout columns: Order Summary sticky column */}
            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {/* Have a Coupon? Card */}
              {activeStep < 4 && (
                <div className="bg-white rounded-[24px] border border-slate-200/60 p-6.5 shadow-[0_4px_20px_rgba(15,23,42,0.015)] space-y-4.5 text-left select-none">
                  <div className="border-b border-slate-100 pb-2.5">
                    <h3 className="text-sm font-black text-slate-855 tracking-tight flex items-center space-x-1.5">
                      <Tag className="w-4 h-4 text-blue-600" />
                      <span>Have a Coupon?</span>
                    </h3>
                  </div>

                  {/* Coupon Code input widget with inline button */}
                  <div className="relative flex items-center mb-1">
                    <input
                      type="text"
                      disabled={couponLoading || couponApplied}
                      placeholder="Apply Coupon"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      className="w-full h-11 text-[11px] font-semibold border border-slate-205 rounded-[12px] pl-3 pr-24 text-slate-700 outline-none focus:border-blue-600 transition-colors bg-white shadow-sm uppercase disabled:bg-slate-50 disabled:text-slate-400 font-mono"
                    />
                    <button
                      disabled={!couponCodeInput.trim() || couponApplied || couponLoading}
                      onClick={handleApplyCoupon}
                      className="absolute right-3.5 text-[11px] font-black text-blue-600 hover:text-blue-800 cursor-pointer disabled:text-slate-400 transition-colors border-none bg-transparent flex items-center space-x-1"
                    >
                      {couponLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                          <span>Applying...</span>
                        </>
                      ) : (
                        <span>Apply</span>
                      )}
                    </button>
                  </div>

                  {/* Success message banner */}
                  {appliedCoupon && (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-left space-y-2.5 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-emerald-800 text-[11px] font-black uppercase tracking-wide">
                          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="font-mono">{appliedCoupon.couponCode}</span>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-[9.5px] font-black text-rose-600 hover:text-rose-700 transition-colors uppercase tracking-wider bg-rose-50 border border-rose-100 px-2 py-0.5 rounded cursor-pointer"
                        >
                          Remove Coupon
                        </button>
                      </div>

                      <div className="space-y-1 text-[11px] font-bold text-slate-700">
                        <div className="text-[10px] text-emerald-700 leading-tight">
                          {appliedCoupon.couponName}
                        </div>
                        <div className="flex justify-between border-t border-emerald-100/50 pt-1.5 text-slate-600 mt-1">
                          <span>Discount:</span>
                          <span className="text-slate-850 font-black">
                            {appliedCoupon.discountType === 'PERCENTAGE' ? `${appliedCoupon.discountValue}%` : <Price value={appliedCoupon.discountValue} />}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Amount Saved:</span>
                          <span className="text-emerald-750 font-black"><Price value={appliedCoupon.discount} /></span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error message banner */}
                  {couponError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-1.5 text-rose-705 text-xs font-bold animate-fadeIn">
                      <AlertCircle className="w-4.5 h-4.5 text-rose-600 flex-shrink-0 mt-0.5" />
                      <span className="leading-tight text-left">{couponError}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white rounded-[24px] border border-slate-200/60 p-6.5 shadow-[0_4px_20px_rgba(15,23,42,0.015)] space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-black text-slate-855 tracking-tight text-left">Order Summary</h2>
                </div>

                {/* Cart products items listing */}
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                  {displayItems.map((item) => {
                    const enriched = enrichCartItem(item);
                    return (
                      <div key={item.id} className="flex items-center justify-between space-x-3.5 text-left border-b border-slate-100/50 pb-3 last:border-b-0 last:pb-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 overflow-hidden flex items-center justify-center border border-slate-100 flex-shrink-0">
                            <img src={enriched.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-slate-800 truncate leading-tight">{item.name}</h4>
                            <p className="text-[9.5px] font-bold text-slate-450 truncate mt-0.5">{enriched.specs}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 flex flex-col">
                          <Price value={item.price * item.quantity} className="text-xs font-black text-slate-900" />
                          {item.quantity > 1 && (
                            <span className="text-[9.5px] text-slate-450 font-bold mt-0.5">Qty: {item.quantity}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Calculations details */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-left font-bold text-slate-500">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <Price value={displaySubtotal} className="text-slate-800 font-black" />
                  </div>

                  {appliedCoupon && (
                    <>
                      <div className="flex justify-between">
                        <span>Coupon</span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase border border-blue-100 font-mono">
                          {appliedCoupon.couponCode}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-605">
                        <span>Discount</span>
                        <span>- <Price value={appliedCoupon.discount} className="text-emerald-650 font-black" /></span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between">
                    <span>Shipping</span>
                    {shipping > 0 ? (
                      <Price value={shipping} className="text-slate-800 font-black" />
                    ) : (
                      <span className="text-emerald-600 font-black uppercase">Free</span>
                    )}
                  </div>



                  <div className="flex justify-between text-slate-850 pt-2.5 border-t border-slate-100 font-black">
                    <span>Total</span>
                    <Price value={total} className="text-sm font-black text-blue-650" />
                  </div>
                </div>

                {/* Trigger Buttons */}
                <div className="pt-2">
                  {activeStep === 2 ? (
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full rounded-full font-black text-[11px] uppercase tracking-widest h-12 shadow hover:shadow-md cursor-pointer active:scale-98 transition-all flex items-center justify-center"
                      onClick={handleContinueToPayment}
                    >
                      Proceed to Payment
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full rounded-full font-black text-[11px] uppercase tracking-widest h-12 shadow hover:shadow-md cursor-pointer active:scale-98 transition-all flex items-center justify-center"
                      onClick={handleExistingOrderPayment}
                    >
                      Pay Now
                    </Button>
                  )}
                </div>

                {/* Security Badges */}
                <div className="flex items-center justify-center space-x-6 pt-3 text-[9px] font-black tracking-wider text-slate-455 uppercase">
                  <div className="flex flex-col items-center space-y-1">
                    <ShieldCheck className="w-4 h-4 text-slate-400 stroke-[2.2px]" />
                    <span>Secure SSL</span>
                  </div>
                  <div className="flex flex-col items-center space-y-1">
                    <Lock className="w-4 h-4 text-slate-400 stroke-[2.2px]" />
                    <span>Encrypted</span>
                  </div>
                  <div className="flex flex-col items-center space-y-1">
                    <ShieldCheck className="w-4 h-4 text-slate-400 stroke-[2.2px]" />
                    <span>Trust Pass</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Checkout;
