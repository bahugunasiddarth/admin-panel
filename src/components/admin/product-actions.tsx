'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, writeBatch } from 'firebase/firestore';

interface DeleteProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function DeleteProductDialog({ open, onOpenChange, product }: DeleteProductDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const firestore = useFirestore();
  const router = useRouter();

  const handleDelete = () => {
    if (!product) return;

    startTransition(async () => {
      if (!firestore) {
        toast({
          variant: 'destructive',
          title: 'Delete Failed',
          description: 'Firestore not available.',
        });
        return;
      }
      try {
        const batch = writeBatch(firestore);

        const productDoc = doc(firestore, 'products', product.id);
        batch.delete(productDoc);

        // Also delete from bestsellers, if it exists there.
        // It's safe to call delete on a non-existent document within a batch.
        const bestsellerDoc = doc(firestore, 'bestsellers', product.id);
        batch.delete(bestsellerDoc);

        await batch.commit();

        toast({
          title: 'Product Deleted',
          description: `The product "${product.name}" has been successfully deleted.`,
        });

        onOpenChange(false); // Close first
        setTimeout(() => {
          router.refresh(); // Refresh after animation starts
        }, 150);
        
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Delete Failed',
          description: error.message || 'You do not have permission to delete this product.',
        });
      }
    });
  };
  
  if (!product) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the product
            <span className="font-semibold"> {product.name}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
