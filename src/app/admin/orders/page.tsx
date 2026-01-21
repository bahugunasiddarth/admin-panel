'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, query } from 'firebase/firestore';
import type { Order, Customer } from '@/lib/types';
import { OrderTable } from '@/components/admin/order-table';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

export default function OrdersPage() {
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'orders'));
  }, [firestore]);
  
  const usersQuery = useMemoFirebase(() => {
      if(!firestore) return null;
      return collection(firestore, 'users');
  }, [firestore]);

  const { data: orders, isLoading: isLoadingOrders } = useCollection<any>(ordersQuery);
  // We track user loading but don't let it block the UI if it fails
  const { data: users, isLoading: isLoadingUsers } = useCollection<Customer>(usersQuery);

  const combinedOrders = useMemo(() => {
    // FIX: Only return empty if ORDERS are missing. Ignore users for now.
    if (!orders) return [];

    const usersMap = users ? new Map(users.map(u => [u.id, u])) : new Map();

    // Normalize and sort orders
    const sortedOrders = [...orders].sort((a, b) => {
        const dateA = (a.orderDate || a.order_date)?.toDate()?.getTime() || 0;
        const dateB = (b.orderDate || b.order_date)?.toDate()?.getTime() || 0;
        return dateB - dateA;
    });

    return sortedOrders.map(order => {
        const pathSegments = (order as any).path ? (order as any).path.split('/') : [];
        const userId = pathSegments.length > 1 ? pathSegments[1] : (order.userId || '');
        const user = usersMap.get(userId);

        // FIX: Handle Price safely (convert string to number)
        const rawPrice = order.totalAmount || order.total_amount || order.price || order.totalPrice;
        const finalPrice = rawPrice ? Number(rawPrice) : 0;

        // FIX: Handle Address Mapping (camelCase vs snake_case)
        const shipping = order.shippingAddress || order.shipping_address || {};
        const billing = order.billingAddress || order.billing_address || {};

        // Explicitly construct the new order object
        const newOrder: Order = {
            id: order.id,
            userId: userId,
            orderId: order.orderId || order.id,
            customer: {
                name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : (order.customer?.name || 'Unknown User'),
                email: user ? user.email : (order.customer?.email || 'N/A'),
            },
            orderDate: order.orderDate || order.order_date,
            totalAmount: finalPrice,
            orderStatus: order.orderStatus || order.status || 'Pending',
            shippingAddress: shipping,
            billingAddress: billing,
            paymentMethod: order.paymentMethod || order.payment_method,
        };
        return newOrder;
    });
  }, [orders, users]);

    // FIX: Only block loading on orders, not users
    const isLoading = isLoadingOrders;

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Orders</h1>
            <p className="text-muted-foreground">
                Manage and track all customer orders.
            </p>
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <OrderTable orders={combinedOrders} />
            )}
        </div>
    );
}