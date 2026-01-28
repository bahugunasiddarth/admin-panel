'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Customer } from '@/lib/types';
import { CustomerTable } from '@/components/admin/customer-table';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

export default function CustomersPage() {
  const firestore = useFirestore();
  
  const customersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  // Fetch as raw data to handle potential field name inconsistencies
  const { data: rawCustomers, isLoading } = useCollection<any>(customersQuery);

  // Normalize the raw data to the Customer type
  const customers = useMemo(() => {
    if (!rawCustomers) return [];
    return rawCustomers.map((c): Customer => ({
      id: c.id,
      firstName: c.firstName || c.first_name,
      lastName: c.lastName || c.last_name,
      email: c.email,
      isAdmin: c.isAdmin,
      // UPDATED: Check billingAddress for phone
      phone: c.phone || c.phoneNumber || c.phone_number || c.billingAddress?.phone,
      // UPDATED: Check billingAddress for address
      address: c.address || c.billingAddress,
    }));
  }, [rawCustomers]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Customers</h1>
      <p className="text-muted-foreground">
        View and manage your customers.
      </p>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <CustomerTable customers={customers || []} />
      )}
    </div>
  );
}