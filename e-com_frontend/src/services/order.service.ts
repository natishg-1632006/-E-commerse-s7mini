import axios from 'axios';

const ORDER_API_BASE_URL = import.meta.env.VITE_ORDER_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'https://2z7vb3e1qd.execute-api.ap-south-2.amazonaws.com';

const getAuthToken = () => {
  return localStorage.getItem('natcart_access_token') || localStorage.getItem('natcart_token');
};

const orderApi = axios.create({
  baseURL: ORDER_API_BASE_URL,
});

orderApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

orderApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('natcart_access_token');
      localStorage.removeItem('natcart_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// TypeScript Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface OrderStatusHistoryItem {
  status: string;
  timestamp: string;
  note?: string;
}

export interface OrderProduct {
  productId: string;
  name: string;
  brand?: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  image?: string;
}

export interface ShippingAddress {
  fullName: string;
  email?: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface CustomerInfo {
  userId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

export interface Order {
  orderId: string;       // normalised from backend 'orderid'
  displayId?: string;    // Human-readable reference ID
  userId?: string;
  email?: string;        // top-level email field from backend
  customerInfo?: CustomerInfo;
  shippingAddress: ShippingAddress;
  items: OrderProduct[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  status?: string;
  statusHistory: OrderStatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  subtotal?: number;
  discountAmount?: number;
  couponCode?: string;
  coupon?: {
    couponCode: string;
    couponName: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
  };
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  orderStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  sort?: string;
  minAmount?: number;
  maxAmount?: number;
  customerId?: string;
}

export interface OrderStats {
  totalOrders: number;
  todaysOrders: number;
  processing: number;
  packed: number;
  shipped: number;
  outForDelivery: number;
  delivered: number;
  cancelled: number;
  revenue: number;
}

export interface GetOrdersResponse {
  orders: Order[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  stats?: OrderStats;
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalisation mapper
//
// The backend returns { orderid, email, items, ... } (lowercase 'orderid',
// top-level 'email', etc.).  This mapper converts every raw API object into
// the canonical frontend Order shape before any component ever sees the data.
// Every field access is defensive so nothing crashes on missing data.
// ─────────────────────────────────────────────────────────────────────────────

const normaliseOrder = (raw: any): Order => {
  // Backend key is lowercase 'orderid' — also accept camelCase variants
  const orderId: string =
    raw.orderid ?? raw.orderId ?? raw.order_id ?? raw.id ?? '';

  const displayId: string | undefined =
    raw.displayId ?? raw.display_id ?? undefined;

  // Shipping address object — all fields may be absent
  const shippingAddress: ShippingAddress = {
    fullName: raw.shippingAddress?.fullName ?? raw.shippingAddress?.full_name ?? '',
    email:    raw.shippingAddress?.email ?? raw.email ?? '',
    phone:    raw.shippingAddress?.phone ?? '',
    address:  raw.shippingAddress?.address ?? '',
    city:     raw.shippingAddress?.city ?? '',
    state:    raw.shippingAddress?.state ?? '',
    pincode:  raw.shippingAddress?.pincode ?? raw.shippingAddress?.zipCode ?? '',
  };

  // items — normalise each product entry
  const items: OrderProduct[] = Array.isArray(raw.items)
    ? raw.items.map((it: any) => ({
        productId: it.productId ?? it.product_id ?? it.id ?? '',
        name:      it.name ?? it.productName ?? '',
        brand:     it.brand ?? undefined,
        quantity:  Number(it.quantity ?? it.qty ?? 1),
        price:     Number(it.price ?? it.unitPrice ?? 0),
        imageUrl:  it.imageUrl ?? it.image ?? it.thumbnail ?? undefined,
        image:     it.image ?? it.imageUrl ?? undefined,
      }))
    : [];

  // statusHistory — optional in backend, always an array in frontend
  const statusHistory: OrderStatusHistoryItem[] = Array.isArray(raw.statusHistory)
    ? raw.statusHistory.map((h: any) => {
        const hRawStatus = h.status ?? '';
        let hStatus = hRawStatus;
        const hsUpper = String(hRawStatus).toUpperCase();
        if (hsUpper === 'PENDING_PAYMENT' || hsUpper === 'PENDING') hStatus = 'Pending Payment';
        else if (hsUpper === 'PROCESSING') hStatus = 'Processing';
        else if (hsUpper === 'PACKED') hStatus = 'Packed';
        else if (hsUpper === 'SHIPPED') hStatus = 'Shipped';
        else if (hsUpper === 'OUT_FOR_DELIVERY') hStatus = 'Out For Delivery';
        else if (hsUpper === 'DELIVERED') hStatus = 'Delivered';
        else if (hsUpper === 'COMPLETED') hStatus = 'Completed';
        else if (hsUpper === 'CANCELLED' || hsUpper === 'CANCELED') hStatus = 'Cancelled';
        else if (hsUpper === 'PAYMENT_FAILED' || hsUpper === 'FAILED') hStatus = 'Payment Failed';
        return {
          status:    hStatus,
          timestamp: h.timestamp ?? h.updatedAt ?? h.createdAt ?? '',
          note:      h.note ?? h.description ?? undefined,
        };
      })
    : [];

  const rawStatus = raw.orderStatus ?? raw.order_status ?? raw.status ?? 'Pending Payment';
  let orderStatus = 'Pending Payment';
  const statusUpper = String(rawStatus).toUpperCase();
  if (statusUpper === 'PENDING_PAYMENT' || statusUpper === 'PENDING') orderStatus = 'Pending Payment';
  else if (statusUpper === 'PROCESSING') orderStatus = 'Processing';
  else if (statusUpper === 'PACKED') orderStatus = 'Packed';
  else if (statusUpper === 'SHIPPED') orderStatus = 'Shipped';
  else if (statusUpper === 'OUT_FOR_DELIVERY') orderStatus = 'Out For Delivery';
  else if (statusUpper === 'DELIVERED') orderStatus = 'Delivered';
  else if (statusUpper === 'COMPLETED') orderStatus = 'Completed';
  else if (statusUpper === 'CANCELLED' || statusUpper === 'CANCELED') orderStatus = 'Cancelled';
  else if (statusUpper === 'PAYMENT_FAILED' || statusUpper === 'FAILED') orderStatus = 'Payment Failed';
  else orderStatus = String(rawStatus);

  return {
    orderId,
    displayId,
    userId:        raw.userId ?? raw.user_id ?? undefined,
    email:         raw.email ?? undefined,
    customerInfo:  raw.customerInfo ?? undefined,
    shippingAddress,
    items,
    totalAmount:   Number(raw.totalAmount ?? raw.total_amount ?? raw.total ?? 0),
    paymentMethod: raw.paymentMethod ?? raw.payment_method ?? '',
    paymentStatus: raw.paymentStatus ?? raw.payment_status ?? 'Pending',
    orderStatus,
    status:        raw.status ?? raw.orderStatus ?? undefined,
    statusHistory,
    createdAt:     raw.createdAt ?? raw.created_at ?? '',
    updatedAt:     raw.updatedAt ?? raw.updated_at ?? '',
    expiresAt:     raw.expiresAt ?? raw.expires_at ?? undefined,
    subtotal:      raw.subtotal !== undefined ? Number(raw.subtotal) : undefined,
    discountAmount: raw.discountAmount !== undefined ? Number(raw.discountAmount) : undefined,
    couponCode:    raw.couponCode ?? undefined,
    coupon:        raw.coupon ?? undefined,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Parameter mapping helpers for backend compatibility
// ─────────────────────────────────────────────────────────────────────────────

const mapOrderStatusToBackend = (status: string | undefined): string | undefined => {
  if (!status) return undefined;
  const s = status.toUpperCase();
  if (s === 'ALL') return undefined;
  if (s === 'PENDING PAYMENT' || s === 'PENDING_PAYMENT') return 'PENDING_PAYMENT';
  if (s === 'PROCESSING') return 'PROCESSING';
  if (s === 'PACKED') return 'PACKED';
  if (s === 'SHIPPED') return 'SHIPPED';
  if (s === 'OUT FOR DELIVERY' || s === 'OUT_FOR_DELIVERY') return 'OUT_FOR_DELIVERY';
  if (s === 'DELIVERED') return 'DELIVERED';
  if (s === 'COMPLETED') return 'COMPLETED';
  if (s === 'CANCELLED' || s === 'CANCELED') return 'CANCELLED';
  if (s === 'PAYMENT FAILED' || s === 'PAYMENT_FAILED' || s === 'FAILED') return 'PAYMENT_FAILED';
  return status;
};

const mapPaymentStatusToBackend = (status: string | undefined): string | undefined => {
  if (!status) return undefined;
  const s = status.toUpperCase();
  if (s === 'ALL') return undefined;
  if (s === 'PENDING') return 'PENDING';
  if (s === 'PAID') return 'PAID';
  if (s === 'FAILED') return 'FAILED';
  if (s === 'REFUNDED') return 'REFUNDED';
  return status;
};

const mapPaymentMethodToBackend = (method: string | undefined): string | undefined => {
  if (!method) return undefined;
  const m = method.toUpperCase();
  if (m === 'ALL') return undefined;
  if (m === 'COD') return 'COD';
  if (m === 'CARD') return 'CARD';
  if (m === 'UPI') return 'UPI';
  if (m === 'NET BANKING' || m === 'NET_BANKING') return 'NET_BANKING';
  if (m === 'WALLET') return 'WALLET';
  return method;
};

// ─────────────────────────────────────────────────────────────────────────────
// Order Service Class
// ─────────────────────────────────────────────────────────────────────────────

class OrderService {
  async getOrders(params: GetOrdersParams = {}): Promise<GetOrdersResponse> {
    const queryParams: Record<string, any> = {};
    if (params.page !== undefined) queryParams.page = params.page;
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.search) queryParams.search = params.search;
    if (params.orderStatus) queryParams.orderStatus = mapOrderStatusToBackend(params.orderStatus);
    if (params.paymentStatus) queryParams.paymentStatus = mapPaymentStatusToBackend(params.paymentStatus);
    if (params.paymentMethod) queryParams.paymentMethod = mapPaymentMethodToBackend(params.paymentMethod);
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    if (params.sort) queryParams.sort = params.sort;
    if (params.minAmount !== undefined) queryParams.minAmount = params.minAmount;
    if (params.maxAmount !== undefined) queryParams.maxAmount = params.maxAmount;
    if (params.customerId) queryParams.customerId = params.customerId;

    const response = await orderApi.get('/api/v1/orders', { params: queryParams });
    const data = response.data;

    // Resolve the raw array from any envelope shape
    let rawList: any[] = [];
    if (Array.isArray(data)) {
      rawList = data;
    } else if (data.data && Array.isArray(data.data)) {
      rawList = data.data;
    } else if (data.orders && Array.isArray(data.orders)) {
      rawList = data.orders;
    } else if (data.items && Array.isArray(data.items)) {
      rawList = data.items;
    }

    const orders = rawList.map(normaliseOrder);
    const stats = data.statistics ?? undefined;

    return {
      orders,
      total:      data.meta?.total ?? data.total ?? data.count ?? orders.length,
      page:       data.meta?.page ?? data.page ?? params.page ?? 1,
      limit:      data.meta?.limit ?? data.limit ?? params.limit ?? 15,
      totalPages: data.meta?.totalPages ?? data.totalPages ?? data.pages ?? Math.ceil((data.meta?.total ?? data.total ?? orders.length) / (params.limit ?? 15)),
      stats
    };
  }

  async getOrderById(id: string): Promise<Order | null> {
    const response = await orderApi.get(`/api/v1/orders/${id}`);
    const data = response.data;

    // Resolve the raw order object from any envelope shape
    let raw: any = null;
    if (data && typeof data === 'object') {
      if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        raw = data.data;
      } else if (data.order && typeof data.order === 'object') {
        raw = data.order;
      } else {
        // Root object is the order itself (has 'orderid' or 'items')
        raw = data;
      }
    }

    return raw ? normaliseOrder(raw) : null;
  }

  async updateOrderStatus(id: string, status: string): Promise<any> {
    const orderStatus = mapOrderStatusToBackend(status);
    const response = await orderApi.put(`/api/v1/orders/${id}/status`, { orderStatus });
    return response.data;
  }

  async downloadInvoice(id: string): Promise<Blob> {
    const response = await orderApi.get(`/api/v1/orders/${id}/invoice`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async cancelOrder(id: string): Promise<any> {
    const response = await orderApi.put(`/api/v1/orders/${id}/cancel`);
    return response.data;
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    const response = await orderApi.get(`/api/v1/orders/user/${userId}`);
    const data = response.data;
    let rawList: any[] = [];
    if (Array.isArray(data)) rawList = data;
    else if (data.data && Array.isArray(data.data)) rawList = data.data;
    else if (data.orders && Array.isArray(data.orders)) rawList = data.orders;
    return rawList.map(normaliseOrder);
  }

  async createOrder(orderData: {
    email: string;
    shippingAddress: ShippingAddress;
    paymentMethod: string;
    couponCode?: string;
  }): Promise<Order> {
    const response = await orderApi.post('/api/v1/orders', orderData);
    const data = response.data;
    const raw = data.data || data.order || data;
    return normaliseOrder(raw);
  }
}

export const orderService = new OrderService();
export default orderService;
