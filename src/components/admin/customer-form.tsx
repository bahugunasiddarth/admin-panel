'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Customer } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFirestore } from '@/firebase';
import { collection, addDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Omit<Customer, 'id'> & { id?: string } | null;
}

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  isAdmin: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export function CustomerFormDialog({ open, onOpenChange, customer }: CustomerFormDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const firestore = useFirestore();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        isAdmin: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (customer) {
        form.reset({
          firstName: customer.firstName || '',
          lastName: customer.lastName || '',
          email: customer.email || '',
          phone: customer.phone || '',
          street: customer.address?.street || '',
          city: customer.address?.city || '',
          state: customer.address?.state || '',
          zip: customer.address?.zip || '',
          country: customer.address?.country || '',
          isAdmin: customer.isAdmin || false,
        });
      } else {
        form.reset({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            street: '',
            city: '',
            state: '',
            zip: '',
            country: '',
            isAdmin: false,
        });
      }
    }
  }, [customer, open, form]);

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      if (!firestore) {
        toast({ variant: 'destructive', title: 'An error occurred', description: 'Firestore not available.' });
        return;
      }
      
      const customerData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: {
            street: data.street,
            city: data.city,
            state: data.state,
            zip: data.zip,
            country: data.country
        },
        isAdmin: data.isAdmin,
      };
      
      try {
        if (customer?.id) {
          const customerDocRef = doc(firestore, 'users', customer.id);
          await updateDoc(customerDocRef, customerData);
        } else {
          // Note: This creates a Firestore document but not a Firebase Auth user.
          // The user will need to be created in Firebase Auth console to log in.
          await addDoc(collection(firestore, 'users'), customerData);
        }
        toast({
          title: `Customer ${customer ? 'Updated' : 'Added'}`,
          description: `The customer "${data.firstName} ${data.lastName}" has been successfully ${customer ? 'updated' : 'saved'}.`,
        });

        onOpenChange(false); // Close first
        setTimeout(() => {
          router.refresh(); // Refresh after animation starts
        }, 150);

      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'An error occurred',
          description: error.message || `You do not have permission to ${customer ? 'update' : 'add'} customers.`,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          <DialogDescription>
            {customer ? 'Update the details of this customer.' : 'Fill in the details for the new customer.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
             <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
             <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
             
             <h3 className="text-lg font-medium pt-4">Address</h3>
             <FormField control={form.control} name="street" render={({ field }) => ( <FormItem><FormLabel>Street</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="state" render={({ field }) => ( <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
             </div>
             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="zip" render={({ field }) => ( <FormItem><FormLabel>ZIP / Postal Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="country" render={({ field }) => ( <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
             </div>
             <FormField
                control={form.control}
                name="isAdmin"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                        <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel>
                        Administrator
                        </FormLabel>
                        <FormMessage />
                    </div>
                    </FormItem>
                )}
                />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {customer ? 'Save Changes' : 'Create Customer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
