import type { Timestamp } from 'firebase/firestore';

export type Address = {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrls: string[];
  availability: 'READY TO SHIP' | 'MADE TO ORDER';
  type: 'gold' | 'silver';
  sizes?: string[];
  stockQuantity?: number;
  isBestseller?: boolean; 
};

export type OrderItemDoc = {
    productId: string;
    name: string;
    quantity: number;
    price: number;
};

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export type Order = {
  id: string;
  userId: string;
  orderId: string;
  customer: {
    name: string;
    email: string;
  };
  orderDate: Timestamp;
  totalAmount: number;
  orderStatus: OrderStatus;
  shippingAddress?: Address;
  billingAddress?: Address;
  paymentMethod?: string;
  stockDecremented?: boolean;
};

export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin?: boolean;
  phone?: string;
  address?: Address;
};