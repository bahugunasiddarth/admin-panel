'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Order } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface OrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

const formSchema = z.object({
  orderStatus: z.enum(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function OrderFormDialog({ open, onOpenChange, order }: OrderFormDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const firestore = useFirestore();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderStatus: 'Pending',
      trackingNumber: '',
      carrier: '',
    },
  });

  useEffect(() => {
    if (open && order) {
      form.reset({
        orderStatus: order.orderStatus,
        // @ts-ignore - Assuming these fields might exist on the order object even if not strictly typed yet
        trackingNumber: order.trackingNumber || '',
        // @ts-ignore
        carrier: order.carrier || '',
      });
    }
  }, [order, open, form]);

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      if (!firestore || !order) {
        toast({ variant: 'destructive', title: 'Error', description: 'Missing required data.' });
        return;
      }

      try {
        // Attempt to find the order path. 
        // Admin usually accesses orders via collectionGroup or known paths.
        // Assuming typical structure: users/{userId}/orders/{orderId}
        const orderRef = doc(firestore, 'users', order.userId, 'orders', order.id);

        await updateDoc(orderRef, {
          orderStatus: data.orderStatus,
          trackingNumber: data.trackingNumber,
          carrier: data.carrier,
          updatedAt: new Date(),
        });

        toast({
          title: 'Order Updated',
          description: `Order #${order.orderId || order.id.slice(0,6)} has been updated.`,
        });

        onOpenChange(false);
        router.refresh();
      } catch (error: any) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: error.message || 'Failed to update order.',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Order Details</DialogTitle>
          <DialogDescription>
            Update status and shipping information for this order.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="orderStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Shipped">Shipped</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="carrier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Carrier</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. FedEx, DHL, BlueDart" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="trackingNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracking Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter tracking ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}