'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Order } from '@/lib/types';
import {
  AlertDialog,
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
import { doc, deleteDoc } from 'firebase/firestore';

interface DeleteOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export function DeleteOrderDialog({ open, onOpenChange, order }: DeleteOrderDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const firestore = useFirestore();
  const router = useRouter();

  const handleDelete = () => {
    if (!order || !order.userId) return;

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
        const orderDocRef = doc(firestore, 'users', order.userId, 'orders', order.id);
        await deleteDoc(orderDocRef);
        toast({
          title: 'Order Deleted',
          description: `The order has been successfully deleted.`,
        });

        onOpenChange(false); // Close first
        setTimeout(() => {
          router.refresh(); // Refresh after animation starts
        }, 150);
        
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Delete Failed',
          description: error.message || 'You do not have permission to delete this order.',
        });
      }
    });
  };
  
  if (!order) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this order.
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
