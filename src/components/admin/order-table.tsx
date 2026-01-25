'use client';

import { useState, useEffect } from 'react';
import type { Order, Address } from '@/lib/types';
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
import { MoreHorizontal, ChevronDown } from 'lucide-react';
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
    if (!isOpen) {
      setActiveAction(null);
    }
  };

  const isAddressProvided = (address?: any) => {
    if (!address || typeof address !== 'object' || Object.keys(address).length === 0) {
      return false;
    }
    return Object.values(address).some(value => !!value);
  };

  // Helper to safely access address fields regardless of case (street vs Street)
  const getAddrField = (addr: any, key: string) => {
    if (!addr) return '';
    // Check key (street), Capitalized (Street), or Uppercase (STREET)
    return addr[key] || addr[key.charAt(0).toUpperCase() + key.slice(1)] || addr[key.toUpperCase()] || '';
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
          <div className="w-full max-w-sm">
             <Input 
                placeholder="Search by ID, name or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
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
                <TableHead>Order Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
              {filteredOrders.length === 0 ? (
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">No orders found.</TableCell>
                  </TableRow>
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
                                <span className="sr-only">Toggle row</span>
                              </Button>
                            </CollapsibleTrigger>
                            <span>#{order.orderId ? order.orderId.slice(0, 6).toUpperCase() : order.id.slice(0, 6).toUpperCase()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{order.customer.name}</div>
                          <div className="hidden text-sm text-muted-foreground sm:block">{order.customer.email}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{order.orderDate ? format(order.orderDate.toDate(), 'PPP') : 'N/A'}</TableCell>
                        <TableCell className="hidden lg:table-cell">{order.paymentMethod || 'N/A'}</TableCell>
                        <TableCell className="text-right">₹{(order.totalAmount || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <OrderStatusSelect order={order} />
                        </TableCell>
                        <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                setTimeout(() => setActiveAction({ type: 'edit', order }), 0);
                              }}
                            >
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={(e) => {
                                e.preventDefault();
                                setTimeout(() => setActiveAction({ type: 'delete', order }), 0);
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                          <TableRow>
                              <TableCell colSpan={7} className="p-0">
                                <div className="p-4 bg-muted/50 grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="md:col-span-2">
                                    <h4 className="font-bold mb-4 text-sm">Order Items</h4>
                                    <OrderItems userId={order.userId} orderId={order.id} />
                                  </div>
                                  <div className="flex flex-col gap-4">
                                    <div>
                                      <h4 className="font-bold mb-2 text-sm">Shipping Address</h4>
                                      {isAddressProvided(order.shippingAddress) ? (
                                        <address className="text-sm text-muted-foreground not-italic space-y-1">
                                          {getAddrField(order.shippingAddress, 'street') && <div>{getAddrField(order.shippingAddress, 'street')}</div>}
                                          <div>
                                            {getAddrField(order.shippingAddress, 'city') && <span>{getAddrField(order.shippingAddress, 'city')}, </span>}
                                            {getAddrField(order.shippingAddress, 'state') && <span>{getAddrField(order.shippingAddress, 'state')} </span>}
                                            {getAddrField(order.shippingAddress, 'zip') && <span>{getAddrField(order.shippingAddress, 'zip')}</span>}
                                          </div>
                                          {getAddrField(order.shippingAddress, 'country') && <div>{getAddrField(order.shippingAddress, 'country')}</div>}
                                        </address>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">No shipping address provided.</p>
                                      )}
                                    </div>
                                    <Separator />
                                    <div>
                                      <h4 className="font-bold mb-2 text-sm">Billing Address</h4>
                                       {isAddressProvided(order.billingAddress) ? (
                                        <address className="text-sm text-muted-foreground not-italic space-y-1">
                                          {getAddrField(order.billingAddress, 'street') && <div>{getAddrField(order.billingAddress, 'street')}</div>}
                                          <div>
                                            {getAddrField(order.billingAddress, 'city') && <span>{getAddrField(order.billingAddress, 'city')}, </span>}
                                            {getAddrField(order.billingAddress, 'state') && <span>{getAddrField(order.billingAddress, 'state')} </span>}
                                            {getAddrField(order.billingAddress, 'zip') && <span>{getAddrField(order.billingAddress, 'zip')}</span>}
                                          </div>
                                          {getAddrField(order.billingAddress, 'country') && <div>{getAddrField(order.billingAddress, 'country')}</div>}
                                        </address>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">No billing address provided.</p>
                                      )}
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
              ))
              )}
          </Table>
        </CardContent>
      </Card>

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