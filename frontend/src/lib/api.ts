import type { AdminMe, Item, Order, QuoteResponse, ShopSettings } from '@/lib/types';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

const DEFAULT_SETTINGS: ShopSettings = {
  shop_name: 'Sri Uma Durga Sweets & Hot',
  tagline: 'Traditional Andhra sweets & crispy hot snacks, made fresh every day',
  phones: ['9642278354', '9640250842'],
  whatsapp: '9642278354',
  address: 'Katakoteswaram, Nidadavolu Mandal, East Godavari District, Andhra Pradesh 534305',
  upi_ids: ['9642278354@ybl'],
  slabs: [
    { max_km: 3, fee: 20 },
    { max_km: 6, fee: 40 },
    { max_km: 10, fee: 60 },
  ],
  far_min_order: 2500,
  far_fee: 100,
};

const MOCK_ITEMS: Item[] = [
  { id: '1', name: 'Kakinada Kaja', category: 'sweets', description: 'Layered, syrup-soaked crispy kaja', price: 180, unit: '500 g', image_url: 'https://images.unsplash.com/photo-1646578515903-67873a5398f9?crop=entropy&cs=srgb&fm=jpg&q=70&w=800', available: true },
  { id: '2', name: 'Pootharekulu', category: 'sweets', description: 'Paper-thin rice sheets with jaggery & ghee', price: 300, unit: '10 pcs', image_url: 'https://images.unsplash.com/photo-1758910536889-43ce7b3199fd?crop=entropy&cs=srgb&fm=jpg&q=70&w=800', available: true },
  { id: '3', name: 'Chekkalu', category: 'hot', description: 'Crispy rice crackers with chana dal & curry leaves', price: 140, unit: '500 g', image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?crop=entropy&cs=srgb&fm=jpg&q=70&w=800', available: true },
  { id: '4', name: 'Samosa', category: 'hot', description: 'Hot potato samosas, made fresh', price: 60, unit: '6 pcs', image_url: 'https://images.unsplash.com/photo-1589786742305-f24d19eedbe5?crop=entropy&cs=srgb&fm=jpg&q=70&w=800', available: true },
];

const MOCK_ORDERS: Order[] = [
  {
    id: 'o-1',
    order_number: 'SUD100001',
    customer_name: 'Ravi Kumar',
    phone: '9642278354',
    address: 'Katakoteswaram, Nidadavolu',
    distance_km: 4,
    items: [
      { item_id: '1', name: 'Kakinada Kaja', unit: '500 g', price: 180, qty: 2, line_total: 360 },
      { item_id: '3', name: 'Chekkalu', unit: '500 g', price: 140, qty: 1, line_total: 140 },
    ],
    subtotal: 500,
    delivery_fee: 20,
    total: 520,
    payment_method: 'phonepe',
    payment_status: 'paid',
    transaction_id: 'TXN123',
    status: 'out_for_delivery',
    status_history: [
      { status: 'placed', at: new Date().toISOString() },
      { status: 'shipped', at: new Date().toISOString() },
      { status: 'out_for_delivery', at: new Date().toISOString() },
    ],
    admin_note: 'Please call when near',
    created_at: new Date().toISOString(),
  },
];

function mockRequest<T>(path: string, method: string, body?: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const lower = path.toLowerCase();

      if (lower === '/settings') return resolve(DEFAULT_SETTINGS as T);
      if (lower === '/items') return resolve(MOCK_ITEMS as T);
      if (lower === '/orders') return resolve(MOCK_ORDERS as T);
      if (lower === '/auth/me') return resolve({ username: 'admin' } as T);
      if (lower.startsWith('/orders/by-phone') || lower === '/orders/by-phone') {
        const phone = new URLSearchParams(path.split('?')[1] ?? '').get('phone') ?? '';
        return resolve(MOCK_ORDERS.filter((o) => o.phone === phone) as T);
      }
      if (lower === '/delivery/quote' && body && typeof body === 'object') {
        const b = body as { distance_km?: number; subtotal?: number };
        const distance = Number(b.distance_km ?? 0);
        const subtotal = Number(b.subtotal ?? 0);
        const deliveryFee = distance <= 3 ? 20 : distance <= 6 ? 40 : distance <= 10 ? 60 : subtotal >= 2500 ? 100 : 0;
        return resolve({ deliverable: deliveryFee > 0 || subtotal >= 2500, delivery_fee: deliveryFee, message: deliveryFee > 0 || subtotal >= 2500 ? 'Delivery available' : 'Order is too far for this subtotal' } as T);
      }
      if (lower === '/auth/login') {
        const payload = body as { username?: string; password?: string } | undefined;
        if (payload?.username === 'admin' && payload?.password === 'admin123') return resolve({ username: 'admin' } as T);
        return reject(new ApiError(401, 'Invalid credentials', { detail: 'Invalid username or password' }));
      }
      if (lower === '/orders' && method === 'POST') {
        const payload = body as { customer_name?: string; phone?: string; address?: string; distance_km?: number; payment_method?: string; transaction_id?: string; items?: Array<{ item_id: string; qty: number }> };
        const itemList = payload?.items ?? [];
        const subtotal = itemList.reduce((sum, line) => sum + (MOCK_ITEMS.find((i) => i.id === line.item_id)?.price ?? 0) * line.qty, 0);
        const fee = Number(payload?.distance_km ?? 0) <= 3 ? 20 : Number(payload?.distance_km ?? 0) <= 6 ? 40 : Number(payload?.distance_km ?? 0) <= 10 ? 60 : 100;
        const order: Order = {
          id: `o-${Date.now()}`,
          order_number: `SUD${Math.floor(100000 + Math.random() * 900000)}`,
          customer_name: payload?.customer_name ?? 'Guest',
          phone: payload?.phone ?? '9642278354',
          address: payload?.address ?? '',
          distance_km: Number(payload?.distance_km ?? 0),
          items: itemList.map((line) => {
            const item = MOCK_ITEMS.find((i) => i.id === line.item_id)!;
            return { item_id: item.id, name: item.name, unit: item.unit, price: item.price, qty: line.qty, line_total: item.price * line.qty };
          }),
          subtotal,
          delivery_fee: fee,
          total: subtotal + fee,
          payment_method: (payload?.payment_method as 'phonepe' | 'cod') ?? 'phonepe',
          payment_status: 'pending',
          transaction_id: payload?.transaction_id ?? '',
          status: 'placed',
          status_history: [{ status: 'placed', at: new Date().toISOString() }],
          admin_note: '',
          created_at: new Date().toISOString(),
        };
        MOCK_ORDERS.unshift(order);
        return resolve(order as T);
      }

      reject(new ApiError(404, 'Not found', { detail: 'Path not available in mock mode' }));
    }, 200);
  });
}

async function request<T>(path: string, method: string, body?: unknown): Promise<T> {
  const url = path.startsWith('http') ? path : `/api${path}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      let parsed: unknown = null;
      try { parsed = JSON.parse(text); } catch { parsed = text; }
      throw new ApiError(response.status, response.statusText || 'Request failed', parsed);
    }

    const text = await response.text();
    return text ? (JSON.parse(text) as T) : (undefined as T);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    return mockRequest<T>(path, method, body);
  }
}

export function apiGet<T>(path: string) {
  return request<T>(path, 'GET');
}

export function apiPost<T>(path: string, body: unknown) {
  return request<T>(path, 'POST', body);
}

export function apiPut<T>(path: string, body: unknown) {
  return request<T>(path, 'PUT', body);
}

export function apiPatch<T>(path: string, body: unknown) {
  return request<T>(path, 'PATCH', body);
}

export function apiDelete<T>(path: string) {
  return request<T>(path, 'DELETE');
}
