export type OrderStatus = 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'COMPLETED' 
  | 'OUT_OF_STOCK' 
  | 'RETRYING' 
  | 'FAILED' 
  | 'DEAD_LETTERED';

export type ViewMode = 'dashboard' | 'orders' | 'inventory' | 'dlq' | 'simulator';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  product: string;
  quantity: number;
  status: OrderStatus;
  retryCount: number;
  totalAmount?: number;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface InventoryItem {
  productId: string;
  productName: string;
  category?: string;
  available: number;
  reserved: number;
  total: number;
  lowStockThreshold: number;
  unitPrice: number;
}

export interface DomainEvent {
  id: string;
  timestamp: string;
  type: string;
  orderNumber?: string;
  productName?: string;
  details: string;
}

export interface DeadLetterRecord {
  id: string;
  orderNumber: string;
  customer: string;
  failureReason: string;
  retryCount: number;
  createdAt: string;
  status: 'DEAD_LETTERED';
}

export interface HealthState {
  status: 'ONLINE' | 'OFFLINE' | 'AWAITING_CONNECTION';
  service: string;
  latencyMs: number | null;
  postgres: 'ONLINE' | 'OFFLINE' | 'AWAITING_CONNECTION';
  redis: 'ONLINE' | 'OFFLINE' | 'AWAITING_CONNECTION';
  processor: 'ONLINE' | 'STANDBY' | 'AWAITING_CONNECTION';
  sse: 'ONLINE' | 'STANDBY' | 'AWAITING_CONNECTION';
}
