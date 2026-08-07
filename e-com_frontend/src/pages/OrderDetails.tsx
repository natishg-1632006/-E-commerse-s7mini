import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Price } from '../components/ui/Price';
import { orderService } from '../services/order.service';
import { productService } from '../services/product.service';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Truck,
  Check,
  Calendar,
  Copy,
  CreditCard,
  MapPin,
  FileText,
  Loader2,
  XCircle,
  AlertTriangle
} from 'lucide-react';

import { getImageUrl } from '../utils/imageHelper';

const formatDatetime = (isoString?: string) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) + ' ' + d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const formatDate = (isoString?: string) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getTrackingSteps = (status: string, statusHistory: any[]) => {
  const stepsDef = [
    { label: 'Pending Payment', key: 'PENDING_PAYMENT' },
    { label: 'Processing', key: 'PROCESSING' },
    { label: 'Packed', key: 'PACKED' },
    { label: 'Shipped', key: 'SHIPPED' },
    { label: 'Out for Delivery', key: 'OUT_FOR_DELIVERY' },
    { label: 'Completed', key: 'DELIVERED' }
  ];

  const currentStatusUpper = status.toUpperCase().replace(/ /g, '_');
  let currentIdx = stepsDef.findIndex(step => 
    step.key === currentStatusUpper || 
    (step.key === 'PENDING_PAYMENT' && currentStatusUpper === 'PENDING')
  );

  const getHistoryItem = (key: string) => {
    return statusHistory.find((h: any) => String(h.status).toUpperCase() === key);
  };

  return stepsDef.map((step, idx) => {
    const histItem = getHistoryItem(step.key);
    const active = !!histItem || (currentIdx !== -1 && idx <= currentIdx);
    const date = histItem ? formatDate(histItem.timestamp) : (active ? 'Completed' : 'Expected soon');

    return {
      label: step.label,
      date,
      active
    };
  });
};

export const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvedProducts, setResolvedProducts] = useState<Record<string, any>>({});

  const [isDownloading, setIsDownloading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const isPaying = false;

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    setIsLoading(true);
    try {
      const orderData = await orderService.getOrderById(orderId);
      if (!orderData) {
        toast.error('Order not found.');
        navigate('/orders');
        return;
      }
      setOrder(orderData);

      // Fetch products in background to get images/slugs if missing
      if (orderData.items && orderData.items.length > 0) {
        const productMap: Record<string, any> = {};
        await Promise.all(
          orderData.items.map(async (item: any) => {
            try {
              const prod = await productService.getProductById(item.productId);
              if (prod) productMap[item.productId] = prod;
            } catch (e) {
              // Ignore missing product queries
            }
          })
        );
        setResolvedProducts(productMap);
      }
    } catch (err: any) {
      console.error('Error fetching order details:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to load order details.');
      navigate('/orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Order ID copied to clipboard!');
  };

  const handleDownloadInvoice = async () => {
    if (!orderId) return;
    setIsDownloading(true);
    try {
      const blob = await orderService.downloadInvoice(orderId);

      if (blob.type === 'application/json') {
        const text = await blob.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Failed to download invoice.');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully!');
    } catch (err: any) {
      console.error('Error downloading invoice:', err);
      let errorMsg = 'Failed to download invoice.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          errorMsg = parsed.message || errorMsg;
        } catch (_) {}
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      toast.error(errorMsg);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderId) return;
    setIsCancelling(true);
    try {
      await orderService.cancelOrder(orderId);
      toast.success('Order cancelled successfully!');
      setShowCancelModal(false);
      await fetchOrderDetails();
    } catch (err: any) {
      console.error('Error cancelling order:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to cancel order.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse select-none">
          <div className="h-4.5 w-48 bg-slate-200 rounded" />
          <div className="bg-white border border-slate-200/50 rounded-[24px] p-6 space-y-4 shadow-sm">
            <div className="h-6 w-60 bg-slate-350 rounded" />
            <div className="h-4 w-40 bg-slate-200 rounded" />
          </div>
          <div className="bg-white border border-slate-200/50 rounded-[24px] p-6 space-y-6 shadow-sm">
            <div className="h-5 w-32 bg-slate-300 rounded" />
            <div className="h-20 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!order) return null;

  const statusLower = String(order.orderStatus || '').toLowerCase();
  const canCancelCustomer = ['pending payment', 'pending_payment', 'pending', 'confirmed', 'processing'].includes(statusLower);
  const trackingSteps = getTrackingSteps(order.orderStatus || 'Pending Payment', order.statusHistory || []);
  const grandTotal = order.items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || order.totalAmount || 0;

  return (
    <MainLayout>
      {/* Premium Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white border border-slate-100/80 rounded-3xl p-6.5 max-w-sm w-full shadow-2xl space-y-5 text-left">
            
            {/* Alert Header */}
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900 leading-tight">Cancel Order?</h3>
                <p className="text-[11px] text-slate-455 font-bold leading-normal">
                  Are you sure you want to cancel this order? This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Context order details badge */}
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 text-xs font-bold text-slate-655 space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Order ID:</span>
                <span className="text-blue-650 font-black">#{order?.displayId || (orderId || '').slice(0, 12)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Price:</span>
                <span className="text-slate-800 font-extrabold"><Price value={order.totalAmount} /></span>
              </div>
            </div>

            {/* Actions button tray */}
            <div className="flex items-center space-x-3.5 justify-end select-none">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="px-4.5 h-10 border border-slate-250 hover:bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-650 rounded-xl transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-sm"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="px-6 h-10 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-500/20 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Cancel Order</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 text-left">
        
        {/* Breadcrumb Path */}
        <nav className="text-[11px] font-black text-slate-455 uppercase tracking-widest flex items-center space-x-1.5 justify-start select-none">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span>&gt;</span>
          <span className="hover:text-blue-600 transition-colors cursor-pointer">Account</span>
          <span>&gt;</span>
          <Link to="/orders" className="hover:text-blue-600 transition-colors">My Orders</Link>
          <span>&gt;</span>
          <span className="text-slate-900">Order Details</span>
        </nav>

        {/* Back Link */}
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center space-x-2 text-[11px] font-black text-slate-500 hover:text-slate-800 uppercase tracking-wider focus:outline-none bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Orders</span>
        </button>

        {/* Order Header Summary Card */}
        <div className="bg-white border border-slate-200/60 rounded-[24px] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="text-xs font-black text-slate-400 font-mono tracking-tight">Order ID</span>
              <span className="text-sm font-black text-slate-900 font-mono">#{order.displayId || order.orderId}</span>
              <button
                onClick={() => copyToClipboard(order.orderId)}
                className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded-lg hover:bg-slate-50 cursor-pointer border-none bg-transparent"
                title="Copy Order ID"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-[11px] text-slate-455 font-bold flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Placed {formatDatetime(order.createdAt)}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 select-none">
            {/* Status Tags */}
            <span
              className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 border ${
                ['DELIVERED', 'COMPLETED'].includes(String(order.orderStatus || '').toUpperCase())
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : String(order.orderStatus || '').toUpperCase() === 'CANCELLED'
                    ? 'bg-red-50 text-red-700 border-red-100'
                    : 'bg-blue-50 text-blue-700 border-blue-100'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>
                {String(order.orderStatus || 'Pending').toUpperCase() === 'DELIVERED'
                  ? 'Completed'
                  : order.orderStatus || 'Pending'}
              </span>
            </span>

            <span className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 border ${
              order.paymentStatus === 'Paid'
                ? 'bg-green-50 text-green-700 border-green-100'
                : 'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
              <CreditCard className="w-3.5 h-3.5" />
              <span>{order.paymentStatus || 'Pending'}</span>
            </span>

            {/* Action Buttons */}
            <button
              onClick={handleDownloadInvoice}
              disabled={isDownloading}
              className="h-8.5 px-3.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-655 flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{isDownloading ? 'Downloading…' : 'Invoice'}</span>
            </button>

            {canCancelCustomer && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="h-8.5 px-3.5 rounded-full border border-red-200 bg-white hover:bg-red-50 text-[10px] font-black uppercase tracking-wider text-red-600 flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
              >
                <XCircle className="w-3.5 h-3.5 text-red-500" />
                <span>Cancel Order</span>
              </button>
            )}
          </div>
        </div>

        {/* Tracking Details Step Timeline */}
        <div className="bg-white border border-slate-200/60 rounded-[24px] p-6 shadow-sm space-y-5">
          <h2 className="text-xs font-black text-slate-900 tracking-wider uppercase">Delivery Progress</h2>
          
          {/* Timeline steps grid */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 md:gap-4 relative pt-2">
            {trackingSteps.map((step, idx) => {
              const showActiveLine = step.active && idx < trackingSteps.length - 1 && trackingSteps[idx + 1].active;
              return (
                <div key={idx} className="flex md:flex-col items-start md:items-center text-left md:text-center relative gap-4 md:gap-0">
                  {/* Horizontal Line connector (Desktop only) */}
                  {idx < trackingSteps.length - 1 && (
                    <div
                      className={`hidden md:block absolute top-[10px] left-[50%] w-full h-[2px] z-0 ${
                        showActiveLine ? 'bg-blue-600' : 'bg-slate-100'
                      }`}
                    />
                  )}

                  {/* Vertical Line connector (Mobile only) */}
                  {idx < trackingSteps.length - 1 && (
                    <div
                      className={`md:hidden absolute left-[10px] top-[20px] w-[2px] h-[calc(105%+24px)] z-0 ${
                        showActiveLine ? 'bg-blue-600' : 'bg-slate-100'
                      }`}
                    />
                  )}

                  {/* Circle Node Marker */}
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center z-10 transition-colors duration-300 flex-shrink-0 md:mb-2.5 ${
                      step.active
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-white text-slate-350'
                    }`}
                  >
                    {step.active ? (
                      <Check className="w-2.5 h-2.5 stroke-[3.5px]" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-[11px] font-black text-slate-800">{step.label}</div>
                    <div className="text-[9.5px] text-slate-455 font-bold">{step.date}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Product Items Listing Card */}
        <div className="bg-white border border-slate-200/60 rounded-[24px] p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-black text-slate-900 tracking-wider uppercase">Items Summary</h2>
          <div className="divide-y divide-slate-100">
            {order.items?.map((item: any, idx: number) => {
              const catalogProd = resolvedProducts[item.productId];
              const specsText = item.specifications
                ? Object.entries(item.specifications).map(([_, v]) => `${v}`).join(' • ')
                : '';
              const finalImage = getImageUrl(catalogProd || item);

              return (
                <div key={idx} className="flex items-center space-x-4 py-4 first:pt-0 last:pb-0 group">
                  <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-150 overflow-hidden flex items-center justify-center p-2.5 flex-shrink-0">
                    <img src={finalImage} alt={item.name} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <Link to={`/product/${item.productId}`} className="text-xs font-black text-slate-900 hover:text-blue-650 transition-colors truncate block">
                      {item.name}
                    </Link>
                    <p className="text-[10px] text-slate-450 font-bold mt-0.5 truncate">
                      {item.brand} {specsText && `• ${specsText}`}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-xs font-black text-slate-950 flex-shrink-0">
                    <Price value={item.price * item.quantity} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Billing & Address Grid Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
          {/* Shipping details */}
          <div className="bg-white border border-slate-200/60 rounded-[24px] p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-slate-800 pb-1.5 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-slate-450" />
              <h3 className="text-xs font-black tracking-wider uppercase">Shipping Destination</h3>
            </div>
            {order.shippingAddress ? (
              <div className="space-y-1 text-slate-600 text-xs font-bold leading-relaxed">
                <p className="text-slate-850 font-black text-[12.5px]">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.address}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                {order.shippingAddress.mobileNumber && (
                  <p className="pt-1.5 text-[10.5px] text-slate-400 font-semibold">Phone: {order.shippingAddress.mobileNumber}</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-450 font-semibold">Standard Delivery Address</p>
            )}
          </div>

          {/* Payment summary details */}
          <div className="bg-white border border-slate-200/60 rounded-[24px] p-6 shadow-sm space-y-3.5">
            <div className="flex items-center space-x-2 text-slate-800 pb-1.5 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-slate-455" />
              <h3 className="text-xs font-black tracking-wider uppercase">Payment Breakdown</h3>
            </div>
            
            <div className="space-y-2 text-xs font-bold text-slate-550">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-slate-800"><Price value={order.subtotal || grandTotal} /></span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Charge</span>
                <span className="text-slate-800">FREE</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="text-slate-800">₹0</span>
              </div>
              {order.couponCode && (
                <div className="flex justify-between">
                  <span>Coupon Used</span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase border border-blue-100 font-mono">
                    {order.couponCode}
                  </span>
                </div>
              )}
              {order.discountAmount ? (
                <div className="flex justify-between text-emerald-605 font-bold">
                  <span>Discount</span>
                  <span>- <Price value={order.discountAmount} className="font-black text-emerald-650" /></span>
                </div>
              ) : null}
              <div className="border-t border-slate-100 pt-2 flex justify-between font-black text-slate-900 text-sm">
                <span>Grand Total</span>
                <span className="text-blue-655"><Price value={order.totalAmount || grandTotal} /></span>
              </div>
            </div>

            <div className="pt-2 flex flex-col space-y-2.5">
              <div className="text-[10px] text-slate-400 font-semibold">
                Paid via {order.paymentMethod || 'Card'} • Status: {order.paymentStatus || 'Pending'}
              </div>
              {String(order.paymentStatus).toUpperCase() !== 'PAID' && 
               String(order.orderStatus).toUpperCase() !== 'CANCELLED' && 
               String(order.orderStatus).toUpperCase() !== 'EXPIRED' && (
                <button
                  disabled={isPaying}
                  onClick={() => {
                    if (orderId) navigate(`/checkout?orderId=${orderId}`);
                  }}
                  className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow transition-colors cursor-pointer active:scale-98 border-none disabled:opacity-50"
                >
                  {isPaying ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <CreditCard className="w-4 h-4 text-white" />
                  )}
                  <span>Pay Now</span>
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  );
};
