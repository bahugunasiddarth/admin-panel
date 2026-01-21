'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Customer, Order } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface CustomerOrderHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

export function CustomerOrderHistory({ open, onOpenChange, customer }: CustomerOrderHistoryProps) {
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !customer) return null;
    // Fetches orders from the user's subcollection: users/{userId}/orders
    return query(
      collection(firestore, 'users', customer.id, 'orders'),
      orderBy('orderDate', 'desc')
    );
  }, [firestore, customer]);

  const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order History: {customer?.firstName} {customer?.lastName}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
           <div className="flex justify-center p-8">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
           </div>
        ) : !orders || orders.length === 0 ? (
           <div className="text-center py-8">
             <p className="text-muted-foreground">No orders found for this customer.</p>
           </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">
                      #{order.orderId ? order.orderId.slice(0, 8).toUpperCase() : order.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      {order.orderDate ? format(order.orderDate.toDate(), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        order.orderStatus === 'Delivered' ? 'default' : 
                        order.orderStatus === 'Cancelled' ? 'destructive' : 
                        'secondary'
                      }>
                        {order.orderStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{(order.totalAmount || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}