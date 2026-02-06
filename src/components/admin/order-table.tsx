'use client';

import { useState, useEffect, Fragment } from 'react';
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
import { MoreHorizontal, ChevronDown, ChevronUp, AlertCircle, Clock } from 'lucide-react';
import { OrderFormDialog } from './order-form';
import { DeleteOrderDialog } from './order-actions';
import { OrderItems } from './order-items';
import { InvoiceButton } from './invoice-button';
import { Separator } from '@/components/ui/separator';
import { OrderStatusSelect } from './order-status-select';
import { Input } from '@/components/ui/input';
import { calculateDeliveryRange } from '@/lib/delivery-utils';

type ActionState = 
  | { type: 'edit', order: Order }
  | { type: 'delete', order: Order }
  | null;

const AddressDisplay = ({ address }: { address: any }) => {
    if (!address) return <p className="text-sm text-muted-foreground">No address provided.</p>;
    if (typeof address === 'string') return <div className="text-sm text-muted-foreground">{address}</div>;

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

    if (!street && !city && !zip) {
         return (
             <div className="text-sm text-muted-foreground">
                 {Object.values(address).filter(v => typeof v === 'string' || typeof v === 'number').join(', ')}
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

// Extracted Row Component to isolate state and maintain clean Table DOM structure
function OrderRow({ 
  order, 
  setActiveAction 
}: { 
  order: Order, 
  setActiveAction: (action: ActionState) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const availability = order.orderStatus === 'Processing' ? 'MADE TO ORDER' : 'READY TO SHIP';
  const { estimatedRange, isOverdue } = calculateDeliveryRange(availability, order.orderDate);
  const isCompleted = order.orderStatus === 'Delivered' || order.orderStatus === 'Cancelled';

  return (
    <>
      <TableRow className={`hover:bg-muted/50 ${isOpen ? 'border-b-0' : ''}`}>
        <TableCell className="font-medium w-[150px]">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-8 h-8 p-0"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <span className="truncate">
              #{order.orderId ? order.orderId.slice(0, 6).toUpperCase() : order.id.slice(0, 6).toUpperCase()}
            </span>
          </div>
        </TableCell>
        
        <TableCell className="w-[220px]">
          <div className="font-medium truncate">{order.customer?.name}</div>
          <div className="hidden text-sm text-muted-foreground sm:block truncate">{order.customer?.email}</div>
        </TableCell>
        
        <TableCell className="hidden md:table-cell w-[150px]">
             {order.orderDate?.toDate ? format(order.orderDate.toDate(), 'PPP') : 'Invalid Date'}
        </TableCell>

        <TableCell className="hidden xl:table-cell w-[150px]">
          <div className="flex flex-col">
            <span className={`font-medium ${isOverdue && !isCompleted ? 'text-destructive' : ''}`}>
              {estimatedRange}
            </span>
            {isOverdue && !isCompleted && (
              <span className="text-[10px] uppercase font-bold text-destructive">Overdue</span>
            )}
          </div>
        </TableCell>

        <TableCell className="hidden lg:table-cell w-[120px]">{order.paymentMethod}</TableCell>
        <TableCell className="text-right w-[140px]">₹{(order.totalAmount || 0).toFixed(2)}</TableCell>
        <TableCell className="w-[160px]"><OrderStatusSelect order={order} /></TableCell>
        
        <TableCell className="text-center w-[80px]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => setActiveAction({ type: 'edit', order })}>
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onSelect={() => setActiveAction({ type: 'delete', order })}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </TableCell>
      </TableRow>
      
      {isOpen && (
        <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableCell colSpan={8} className="p-0 border-t-0">
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <h4 className="font-bold mb-4 text-sm">Order Items</h4>
                  {!order.userId ? (
                      <div className="flex items-center gap-2 text-destructive text-sm p-4 border border-destructive/20 rounded-md bg-destructive/10">
                          <AlertCircle className="h-4 w-4" />
                          <span>Error: Missing 'userId'. Cannot locate items.</span>
                      </div>
                  ) : (
                      <OrderItems userId={order.userId} orderId={order.id} />
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <div className="bg-background p-3 rounded-md border shadow-sm">
                      <h4 className="font-bold mb-1 text-xs uppercase text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Delivery Commitment
                      </h4>
                      <p className="text-sm font-semibold">{estimatedRange}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {availability === 'MADE TO ORDER' ? 'Handcrafted (25-28 days)' : 'Ready-to-ship (5-7 days)'}
                      </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-bold mb-2 text-sm">Shipping Address</h4>
                    <AddressDisplay address={order.shippingAddress} />
                  </div>
                  <Separator />
                  <div>
                      <h4 className="font-bold mb-2 text-sm">Actions</h4>
                      <div className="flex flex-col gap-2">
                        <InvoiceButton order={order} />
                        <Button variant="outline" size="sm" onClick={() => setActiveAction({ type: 'edit', order })}>
                          Update Tracking Info
                        </Button>
                      </div>
                  </div>
                </div>
              </div>
            </TableCell>
        </TableRow>
      )}
    </>
  );
}

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
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px] text-left">Order ID</TableHead>
                <TableHead className="w-[220px] text-left">Customer</TableHead>
                <TableHead className="hidden md:table-cell w-[150px] text-left">Date</TableHead>
                <TableHead className="hidden xl:table-cell w-[150px] text-left">Deadline</TableHead> 
                <TableHead className="hidden lg:table-cell w-[120px] text-left">Payment</TableHead>
                <TableHead className="w-[140px] text-right">Amount</TableHead>
                <TableHead className="w-[160px] text-left">Status</TableHead>
                <TableHead className="w-[80px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {filteredOrders.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={8} className="text-center h-24">No orders found.</TableCell>
                  </TableRow>
              ) : (
                  filteredOrders.map((order) => (
                      <OrderRow 
                          key={order.id} 
                          order={order} 
                          setActiveAction={setActiveAction} 
                      />
                  ))
              )}
            </TableBody>
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