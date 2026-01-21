'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import type { Order, OrderItemDoc } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InvoiceButtonProps {
  order: Order;
}

export function InvoiceButton({ order }: InvoiceButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      if (!firestore || !order.userId || !order.id) {
        throw new Error('Required order details are missing.');
      }

      const itemsQuery = query(collection(firestore, 'users', order.userId, 'orders', order.id, 'orderItems'));
      const querySnapshot = await getDocs(itemsQuery);
      
      if (querySnapshot.empty) {
          toast({
              variant: 'destructive',
              title: 'No Items Found',
              description: 'This order does not have any items to include in the invoice.',
          });
          return;
      }
      
      const items = querySnapshot.docs.map(doc => doc.data() as OrderItemDoc);

      // Dynamically import the PDF generation function only when needed on the client-side.
      const { generateInvoicePdf } = await import('@/lib/invoice');
      generateInvoicePdf(order, items);

    } catch (error: any) {
      console.error('Failed to generate invoice:', error);
      toast({
        variant: 'destructive',
        title: 'Invoice Generation Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={isLoading} variant="outline" size="sm">
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Download Invoice
    </Button>
  );
}
