'use client';

import { useState, useEffect } from 'react';
import type { Order } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { MoreHorizontal, ChevronDown, AlertCircle } from 'lucide-react';
import { OrderFormDialog } from './order-form';
import { DeleteOrderDialog } from './order-actions';
import { OrderItems } from './order-items';
import { InvoiceButton } from './invoice-button';
import { Separator } from '@/components/ui/separator';
import { OrderStatusSelect } from './order-status-select';
import { Input } from '@/components/ui/input';

type ActionState = 
  | { type: 'edit', order: Order }
  | { type: 'delete', order: Order }
  | null;

// --- FIX: Robust Address Display Component ---
const AddressDisplay = ({ address }: { address: any }) => {
    // 1. Handle Empty/Null
    if (!address) {
        return <p className="text-sm text-muted-foreground">No address provided.</p>;
    }

    // 2. Handle String Address (Fixes "comma after every alphabet" bug)
    if (typeof address === 'string') {
        return <div className="text-sm text-muted-foreground">{address}</div>;
    }

    // 3. Handle Object Address
    // Attempt to find fields regardless of case (street vs Street vs addressLine1)
    const getVal = (keys: string[]) => {
        if (typeof address !== 'object') return null;
        for (const k of keys) {
            const val = address[k] || address[k.toLowerCase()] || address[k.toUpperCase()] || address[k.charAt(0).toUpperCase() + k.slice(1)];
            if (val) return val;
        }
        return null;
    };

    const street = getVal(['street', 'addressLine1', 'line1', 'address']);
    const city = getVal(['city', 'town']);
    const state = getVal(['state', 'province', 'region']);
    const zip = getVal(['zip', 'postalCode', 'pincode', 'zipCode']);
    const country = getVal(['country']);

    // If it's an object but we can't find standard keys, try to display values nicely
    if (!street && !city && !zip) {
         return (
             <div className="text-sm text-muted-foreground">
                 {/* Only join if values are actually strings, to prevent [object Object] */}
                 {Object.values(address)
                    .filter(v => typeof v === 'string' || typeof v === 'number')
                    .join(', ')}
             </div>
         );
    }

    return (
        <address className="text-sm text-muted-foreground not-italic space-y-1">
            {street && <div>{street}</div>}
            <div>
                {city && <span>{city}, </span>}
                {state && <span>{state} </span>}
                {zip && <span>{zip}</span>}
            </div>
            {country && <div>{country}</div>}
        </address>
    );
};

export function OrderTable({ orders }: { orders: Order[] }) {
  const [activeAction, setActiveAction] = useState<ActionState>(null);
  const [searchQuery, setSearchQuery] = useState('');

   useEffect(() => {
    if (!activeAction) {
      setTimeout(() => {
        document.body.style.pointerEvents = "";
        document.body.style.overflow = "";
      }, 500);
    }
  }, [activeAction]);

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) setActiveAction(null);
  };

  const filteredOrders = orders.filter(order => {
      const searchLower = searchQuery.toLowerCase();
      const orderId = order.orderId || order.id || '';
      const customerName = order.customer?.name || '';
      const customerEmail = order.customer?.email || '';
      return (
          orderId.toLowerCase().includes(searchLower) ||
          customerName.toLowerCase().includes(searchLower) ||
          customerEmail.toLowerCase().includes(searchLower)
      );
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold">All Orders</CardTitle>
          <Input 
            className="max-w-sm"
            placeholder="Search orders..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden lg:table-cell">Payment</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
              {filteredOrders.length === 0 ? (
                <TableBody>
                  <TableRow><TableCell colSpan={7} className="text-center h-24">No orders found.</TableCell></TableRow>
                </TableBody>
              ) : (
              filteredOrders.map((order) => (
                <Collapsible asChild key={order.id}>
                    <tbody className="group/collapsible [&_tr:last-child]:border-0">
                      <TableRow>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-9 p-0">
                                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                              </Button>
                            </CollapsibleTrigger>
                            <span>#{order.orderId ? order.orderId.slice(0, 6).toUpperCase() : order.id.slice(0, 6).toUpperCase()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{order.customer.name}</div>
                          <div className="hidden text-sm text-muted-foreground sm:block">{order.customer.email}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                             {/* Safe date check */}
                             {order.orderDate?.toDate ? format(order.orderDate.toDate(), 'PPP') : 'Invalid Date'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{order.paymentMethod}</TableCell>
                        <TableCell className="text-right">₹{(order.totalAmount || 0).toFixed(2)}</TableCell>
                        <TableCell><OrderStatusSelect order={order} /></TableCell>
                        <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onSelect={() => setActiveAction({ type: 'edit', order })}>Edit Details</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onSelect={() => setActiveAction({ type: 'delete', order })}>Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      
                      <CollapsibleContent asChild>
                          <TableRow>
                              <TableCell colSpan={7} className="p-0">
                                <div className="p-4 bg-muted/50 grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* ORDER ITEMS SECTION */}
                                  <div className="md:col-span-2">
                                    <h4 className="font-bold mb-4 text-sm">Order Items</h4>
                                    {!order.userId ? (
                                        <div className="flex items-center gap-2 text-destructive text-sm p-4 border border-destructive/20 rounded-md bg-destructive/10">
                                            <AlertCircle className="h-4 w-4" />
                                            <span>
                                                Error: This order is missing the 'userId' field. 
                                                System cannot locate order items without the user ID.
                                            </span>
                                        </div>
                                    ) : (
                                        <OrderItems userId={order.userId} orderId={order.id} />
                                    )}
                                  </div>

                                  {/* ADDRESS SECTION */}
                                  <div className="flex flex-col gap-4">
                                    <div>
                                      <h4 className="font-bold mb-2 text-sm">Shipping Address</h4>
                                      <AddressDisplay address={order.shippingAddress} />
                                    </div>
                                    <Separator />
                                    <div>
                                      <h4 className="font-bold mb-2 text-sm">Billing Address</h4>
                                      <AddressDisplay address={order.billingAddress} />
                                    </div>
                                    <Separator />
                                    <div>
                                        <h4 className="font-bold mb-2 text-sm">Actions</h4>
                                        <InvoiceButton order={order} />
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                          </TableRow>
                      </CollapsibleContent>
                    </tbody>
                </Collapsible>
              )))}
          </Table>
        </CardContent>
      </Card>
      
      {/* Dialogs */}
      <OrderFormDialog
        open={activeAction?.type === 'edit'}
        onOpenChange={handleDialogClose}
        order={activeAction?.type === 'edit' ? activeAction.order : null}
      />
      <DeleteOrderDialog
        open={activeAction?.type === 'delete'}
        onOpenChange={handleDialogClose}
        order={activeAction?.type === 'delete' ? activeAction.order : null}
      />
    </>
  );
}