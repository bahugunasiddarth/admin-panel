'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { runTransaction, doc, collection, getDocs, query, DocumentReference } from 'firebase/firestore'; // Added DocumentReference
import type { Order, OrderItemDoc, OrderStatus } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const orderStatuses: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

interface OrderStatusSelectProps {
  order: Order;
}

export function OrderStatusSelect({ order }: OrderStatusSelectProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const firestore = useFirestore();
  const router = useRouter();

  const getStatusBadgeVariant = (status: Order['orderStatus']) => {
    switch (status) {
      case 'Pending': return 'secondary';
      case 'Processing': return 'secondary';
      case 'Shipped': return 'default';
      case 'Delivered': return 'outline';
      case 'Cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (newStatus === order.orderStatus) return;

    startTransition(async () => {
      if (!firestore || !order.userId) {
        toast({ variant: 'destructive', title: 'An error occurred', description: 'Required information is missing.' });
        return;
      }

      // 1. Fetch items outside the transaction (this is a standard query, not a transactional read)
      const itemsQuery = query(collection(firestore, 'users', order.userId, 'orders', order.id, 'orderItems'));
      const itemsSnapshot = await getDocs(itemsQuery);
      const items = itemsSnapshot.docs.map(doc => doc.data() as OrderItemDoc);

      try {
        await runTransaction(firestore, async (transaction) => {
          // 2. READ: Get Order Doc
          const orderDocRef = doc(firestore, 'users', order.userId, 'orders', order.id);
          const orderDocSnap = await transaction.get(orderDocRef);
          
          if (!orderDocSnap.exists()) {
            throw new Error("Order does not exist!");
          }
          
          const currentOrderData = orderDocSnap.data() as Order;
          const stockWasDecremented = currentOrderData.stockDecremented === true;
          let newStockDecremented = stockWasDecremented;

          const shouldDecrement = !stockWasDecremented && (newStatus === 'Processing' || newStatus === 'Shipped' || newStatus === 'Delivered');
          const shouldIncrement = stockWasDecremented && newStatus === 'Cancelled';

          // 3. READ: Get all Product Docs involved (Prepare Phase)
          // We store the logic to apply later so we don't write yet
          const productUpdates: { ref: DocumentReference, newStock: number }[] = [];

          if (shouldDecrement || shouldIncrement) {
            for (const item of items) {
              if (!item.productId) continue;
              
              const productRef = doc(firestore, 'products', item.productId);
              const productSnap = await transaction.get(productRef); // This READ is valid because we haven't written yet

              if (!productSnap.exists()) {
                console.warn(`Product with ID ${item.productId} not found. Cannot update stock.`);
                continue;
              }

              const currentStock = productSnap.data().stockQuantity ?? 0;
              const quantityChange = item.quantity || 0;
              
              const newStock = shouldDecrement 
                  ? currentStock - quantityChange
                  : currentStock + quantityChange;

              productUpdates.push({
                ref: productRef,
                newStock: newStock < 0 ? 0 : newStock
              });
            }
            newStockDecremented = shouldDecrement;
          }

          // 4. WRITE: Apply all updates (Commit Phase)
          // Now that all reads are done, we can write.
          for (const update of productUpdates) {
             transaction.update(update.ref, { stockQuantity: update.newStock });
          }

          transaction.update(orderDocRef, {
            orderStatus: newStatus,
            status: newStatus,
            stockDecremented: newStockDecremented,
          });
        });

        toast({
          title: 'Order Status Updated',
          description: `Order #${order.id.slice(0, 6).toUpperCase()} status changed to ${newStatus}.`,
        });
        
        router.refresh();

      } catch (error: any) {
        console.error("Order status update transaction failed: ", error);
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: error.message || 'Could not update the order status.',
        });
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
      <Select
        onValueChange={(value: OrderStatus) => handleStatusChange(value)}
        value={order.orderStatus}
        disabled={isPending}
      >
        <SelectTrigger className={cn(
          "h-auto py-0.5 px-2.5 border-0 text-xs font-semibold focus:ring-0 focus:ring-offset-0 w-[120px] justify-start",
          badgeVariants({ variant: getStatusBadgeVariant(order.orderStatus) })
        )}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {orderStatuses.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}