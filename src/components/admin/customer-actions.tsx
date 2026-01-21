'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Customer } from '@/lib/types';
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

interface DeleteCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

export function DeleteCustomerDialog({ open, onOpenChange, customer }: DeleteCustomerDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const firestore = useFirestore();
  const router = useRouter();

  const handleDelete = () => {
    if (!customer) return;

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
        const customerDoc = doc(firestore, 'users', customer.id);
        await deleteDoc(customerDoc);
        toast({
          title: 'Customer Deleted',
          description: `The customer "${customer.firstName} ${customer.lastName}" has been successfully deleted.`,
        });

        onOpenChange(false); // Close first
        setTimeout(() => {
          router.refresh(); // Refresh after animation starts
        }, 150);
        
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Delete Failed',
          description: error.message || 'You do not have permission to delete this customer.',
        });
      }
    });
  };
  
  if (!customer) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the customer account for
            <span className="font-semibold"> {customer.firstName} {customer.lastName}</span>.
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
