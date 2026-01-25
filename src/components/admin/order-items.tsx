'use client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { OrderItemDoc } from '@/lib/types';

// The type for the item object used in the component, including the id/path added by useCollection
type OrderItem = OrderItemDoc & { 
    id: string; 
    path: string;
    status?: string; // Add status field
};


// A more robust component to handle individual item rows and price/stock lookups
function OrderItemRow({ item }: { item: OrderItem }) {
    const firestore = useFirestore();
    const [stock, setStock] = useState<number | null>(null);
    const [isStockLoading, setIsStockLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchProductStock = async () => {
            if (!item.productId || !firestore) {
                if (isMounted) {
                    setStock(null);
                    setIsStockLoading(false);
                }
                return;
            }

            setIsStockLoading(true);
            try {
                const productRef = doc(firestore, 'products', item.productId);
                const productSnap = await getDoc(productRef);
                if (isMounted) {
                    if (productSnap.exists()) {
                        const productData = productSnap.data();
                        setStock(productData.stockQuantity ?? null);
                    } else {
                         setStock(null);
                    }
                }
            } catch (error) {
                 console.error("Error fetching product stock:", error);
                 if (isMounted) {
                    setStock(null);
                 }
            } finally {
                if (isMounted) {
                    setIsStockLoading(false);
                }
            }
        };

        fetchProductStock();
        return () => { isMounted = false; };
    }, [firestore, item.productId]);

    const price = item.price || 0;
    const quantity = item.quantity || 0;
    const subtotal = price * quantity;

    return (
        <TableRow>
            <TableCell className="font-medium">
                <div>{item.name}</div>
                {/* Show Item Status (Ready to Ship / Made to Order) */}
                <div className="text-xs text-muted-foreground mt-1 font-normal">
                    {item.status || 'READY TO SHIP'}
                </div>
            </TableCell>
            <TableCell className="text-center">{quantity}</TableCell>
            <TableCell className="hidden text-right sm:table-cell">
                ₹{price.toFixed(2)}
            </TableCell>
            <TableCell className="hidden text-center md:table-cell">
                 {isStockLoading ? (
                    <div className="flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : (
                    stock !== null ? <Badge variant={stock < 10 ? 'destructive' : 'outline'}>{stock}</Badge> : 'N/A'
                )}
            </TableCell>
            <TableCell className="text-right">₹{subtotal.toFixed(2)}</TableCell>
        </TableRow>
    );
}


export function OrderItems({ userId, orderId }: { userId: string, orderId: string }) {
    const firestore = useFirestore();

    const itemsQuery = useMemoFirebase(() => {
        if (!firestore || !userId || !orderId) return null;
        return collection(firestore, 'users', userId, 'orders', orderId, 'orderItems');
    }, [firestore, userId, orderId]);

    const { data: items, isLoading } = useCollection<OrderItemDoc>(itemsQuery);

    if (isLoading) {
        return <div className="flex items-center justify-center p-4"><Loader2 className="h-5 w-5 animate-spin" /></div>;
    }

    if (!items || items.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">No items found for this order.</p>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">Price</TableHead>
                    <TableHead className="hidden text-center md:table-cell">Current Stock</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item) => (
                   <OrderItemRow key={item.id} item={item as OrderItem} />
                ))}
            </TableBody>
        </Table>
    );
}