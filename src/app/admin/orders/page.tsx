'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy } from 'firebase/firestore'; // Added orderBy
import type { Order, Customer } from '@/lib/types';
import { OrderTable } from '@/components/admin/order-table';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

export default function OrdersPage() {
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Sort by orderDate desc at the database level if possible, otherwise client side
    return query(collectionGroup(firestore, 'orders'));
  }, [firestore]);
  
  const { data: orders, isLoading: isLoadingOrders } = useCollection<any>(ordersQuery);

  const combinedOrders = useMemo(() => {
    if (!orders) return [];

    console.log("Raw Firestore Orders:", orders); // DIAGNOSTIC LOG

    // Normalize and sort orders
    const sortedOrders = [...orders].sort((a, b) => {
        const dateA = (a.orderDate || a.order_date)?.toDate()?.getTime() || 0;
        const dateB = (b.orderDate || b.order_date)?.toDate()?.getTime() || 0;
        return dateB - dateA;
    });

    return sortedOrders.map(order => {
        // FIX 1: Robust User ID Extraction
        // If 'userId' is not saved in the doc, we default to empty string, 
        // which will cause OrderItems to fail. You MUST save userId in the order doc.
        const userId = order.userId || order.user_id || '';

        // FIX 2: Handle Price (Check common variations)
        const rawPrice = order.totalAmount || order.total_amount || order.price || order.totalPrice || order.amount || 0;
        const finalPrice = typeof rawPrice === 'string' ? parseFloat(rawPrice) : Number(rawPrice);

        // FIX 3: Handle Address (Check common variations)
        // Check for 'shippingAddress', 'shipping_address', or just 'address'
        const shipping = order.shippingAddress || order.shipping_address || order.address || {};
        const billing = order.billingAddress || order.billing_address || order.billing || {};

        // Explicitly construct the new order object
        const newOrder: Order = {
            id: order.id,
            userId: userId, 
            orderId: order.orderId || order.id,
            customer: {
                // Handle cases where customer info is directly on the order or nested
                name: order.customer?.name || order.customerName || order.name || 'Unknown',
                email: order.customer?.email || order.customerEmail || order.email || 'N/A',
            },
            orderDate: order.orderDate || order.order_date,
            totalAmount: isNaN(finalPrice) ? 0 : finalPrice,
            orderStatus: order.orderStatus || order.status || 'Pending',
            shippingAddress: shipping,
            billingAddress: billing,
            paymentMethod: order.paymentMethod || order.payment_method || 'N/A',
        };
        return newOrder;
    });
  }, [orders]);

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Orders</h1>
            <p className="text-muted-foreground">
                Manage and track all customer orders.
            </p>
            {isLoadingOrders ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <OrderTable orders={combinedOrders} />
            )}
        </div>
    );
}