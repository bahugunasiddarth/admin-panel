'use client';

import { useState, useEffect } from 'react';
import type { Customer } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Shield, History } from 'lucide-react';
import { CustomerFormDialog } from './customer-form';
import { DeleteCustomerDialog } from './customer-actions';
import { CustomerOrderHistory } from './customer-order-history';
import { Badge } from '@/components/ui/badge';

type ActionState =
  | { type: 'edit'; customer: Customer }
  | { type: 'delete'; customer: Customer }
  | { type: 'history'; customer: Customer }
  | null;

export function CustomerTable({ customers }: { customers: Customer[] }) {
  const [activeAction, setActiveAction] = useState<ActionState>(null);

  // Safety valve for pointer-events issues with Dialogs
  useEffect(() => {
    if (!activeAction) {
      setTimeout(() => {
        document.body.style.pointerEvents = "";
        document.body.style.overflow = "";
      }, 500);
    }
  }, [activeAction]);

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      setActiveAction(null);
    }
  };

  const formatAddress = (addr: any) => {
    if (!addr) return 'N/A';
    if (typeof addr === 'string') return addr;
    // Handle potential casing differences
    const parts = [
        addr.street || addr.Street,
        addr.city || addr.City,
        addr.state || addr.State,
        addr.zip || addr.Zip,
        addr.country || addr.Country
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead className="hidden lg:table-cell">Address</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    {customer.firstName} {customer.lastName}
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {customer.phone || 'N/A'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell max-w-[200px] truncate">
                    {formatAddress(customer.address)}
                  </TableCell>
                  <TableCell>
                     {customer.isAdmin ? (
                        <Badge variant="default" className="gap-1">
                            <Shield className="h-3 w-3" /> Admin
                        </Badge>
                     ) : (
                        <Badge variant="secondary">User</Badge>
                     )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => setActiveAction({ type: 'history', customer })}
                        >
                          <History className="mr-2 h-4 w-4" />
                          Order History
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setActiveAction({ type: 'edit', customer })}
                        >
                          Edit Details
                        </DropdownMenuItem>
                         <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setActiveAction({ type: 'delete', customer })}
                        >
                          Delete Customer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <CustomerFormDialog
        open={activeAction?.type === 'edit'}
        onOpenChange={handleDialogClose}
        customer={activeAction?.type === 'edit' ? activeAction.customer : null}
      />

      <DeleteCustomerDialog
        open={activeAction?.type === 'delete'}
        onOpenChange={handleDialogClose}
        customer={activeAction?.type === 'delete' ? activeAction.customer : null}
      />

      <CustomerOrderHistory
        open={activeAction?.type === 'history'}
        onOpenChange={handleDialogClose}
        customer={activeAction?.type === 'history' ? activeAction.customer : null}
      />
    </>
  );
}