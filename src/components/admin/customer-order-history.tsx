'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { OrderStatus } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo } from 'react';

export function CustomerOrderHistory({ customerId }: { customerId: string }) {
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !customerId) return null;
    return query(collection(firestore, 'users', customerId, 'orders'));
  }, [firestore, customerId]);

  const { data: rawOrders, isLoading } = useCollection<any>(ordersQuery);

  const orders = useMemo(() => {
    if (!rawOrders) return [];
    
    // Normalize and sort orders
    const sortedOrders = [...rawOrders].sort((a, b) => {
        const dateA = (a.orderDate || a.order_date)?.toDate()?.getTime() || 0;
        const dateB = (b.orderDate || b.order_date)?.toDate()?.getTime() || 0;
        return dateB - dateA;
    });

    return sortedOrders.map(o => ({
      id: o.id,
      orderId: o.orderId || o.id,
      orderDate: o.orderDate || o.order_date,
      orderStatus: o.orderStatus || o.status,
      totalAmount: o.totalAmount || o.total_amount,
    }));
  }, [rawOrders]);

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case 'Pending': return 'secondary';
      case 'Processing': return 'secondary';
      case 'Shipped': return 'default';
      case 'Delivered': return 'outline';
      case 'Cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-4"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  if (!orders || orders.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No order history for this customer.</p>;
  }

  return (
    <div className="p-4 bg-muted/50">
        <h4 className="font-bold mb-2 text-sm">Order History</h4>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Order Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map(order => (
                    <TableRow key={order.id}>
                        <TableCell className="font-medium">#{(order.orderId).slice(0, 6).toUpperCase()}</TableCell>
                        <TableCell>{order.orderDate ? format(order.orderDate.toDate(), 'PP') : 'N/A'}</TableCell>
                        <TableCell><Badge variant={getStatusBadgeVariant(order.orderStatus)}>{order.orderStatus}</Badge></TableCell>
                        <TableCell className="text-right">₹{(order.totalAmount || 0).toFixed(2)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
  );
}
