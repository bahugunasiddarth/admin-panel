'use client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, HelpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { OrderItemDoc } from '@/lib/types';

type OrderItem = OrderItemDoc & { 
    id: string; 
    path: string;
    status?: string;
    [key: string]: any; 
};

// Robust helper to extract numbers
const parseNumber = (val: any): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const clean = val.replace(/[^\d.]/g, ''); 
        const parsed = parseFloat(clean);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

function OrderItemRow({ item }: { item: OrderItem }) {
    const firestore = useFirestore();
    const [stock, setStock] = useState<number | null>(null);
    const [productBackupPrice, setProductBackupPrice] = useState<number | null>(null);
    const [gstRate, setGstRate] = useState<number>(0); 
    const [isStockLoading, setIsStockLoading] = useState(true);
    // 1. ADDED: State for availability
    const [availability, setAvailability] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchProductDetails = async () => {
            if (!item.productId || !firestore) {
                if (isMounted) setIsStockLoading(false);
                return;
            }

            setIsStockLoading(true);
            try {
                const productRef = doc(firestore, 'products', item.productId);
                const productSnap = await getDoc(productRef);
                if (isMounted) {
                    if (productSnap.exists()) {
                        const data = productSnap.data();
                        setStock(data.stockQuantity ?? null);
                        // 2. ADDED: Fetch availability
                        setAvailability(data.availability || null);
                        
                        // 1. Fetch Backup Price
                        const backupPrice = data.price || data.unitPrice || data.amount || 0;
                        setProductBackupPrice(parseNumber(backupPrice));

                        // 2. Fetch/Determine GST Rate
                        let rate = 0;
                        if (data.gst || data.tax) {
                            rate = parseNumber(data.gst || data.tax);
                        } else if (data.type === 'gold' || data.type === 'silver') {
                            rate = 3; 
                        } else {
                            rate = 0; 
                        }
                        setGstRate(rate);

                    } else {
                         setStock(null);
                    }
                }
            } catch (error) {
                 console.error("Error fetching product details:", error);
            } finally {
                if (isMounted) setIsStockLoading(false);
            }
        };

        fetchProductDetails();
        return () => { isMounted = false; };
    }, [firestore, item.productId]);

    // --- CALCULATIONS ---
    
    // 1. Price
    let rawPrice = item.price ?? item.unitPrice ?? item.amount ?? item.cost ?? item.value ?? 0;
    let price = parseNumber(rawPrice);
    let isEstimate = false;

    // Use backup price if main price is missing
    if (price === 0 && productBackupPrice && productBackupPrice > 0) {
        price = productBackupPrice;
        isEstimate = true; 
    }

    // 2. Quantity
    const quantity = parseNumber(item.quantity ?? item.qty ?? item.count ?? item.pieces ?? 0);
    
    // 3. GST Calculation
    const finalGstRate = item.gst ? parseNumber(item.gst) : gstRate;
    const baseTotal = price * quantity;
    const gstAmount = (baseTotal * finalGstRate) / 100;

    // 4. Final Subtotal (Base + GST)
    const finalSubtotal = baseTotal + gstAmount;

    return (
        <TableRow>
            <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                    <span>{item.name || 'Unknown Item'}</span>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-50 hover:opacity-100">
                                <HelpCircle className="h-3 w-3" />
                                <span className="sr-only">Debug Info</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none text-xs uppercase text-muted-foreground">Raw Data</h4>
                                <pre className="text-[10px] bg-slate-950 text-slate-50 p-2 rounded overflow-auto max-h-40">
                                    {JSON.stringify(item, null, 2)}
                                </pre>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-normal">
                    {item.status || 'READY TO SHIP'}
                </div>
            </TableCell>
            <TableCell className="text-center">{quantity}</TableCell>
            <TableCell className="hidden text-right sm:table-cell">
                <div className="flex flex-col items-end">
                    <span>₹{price.toFixed(2)}</span>
                    {isEstimate && <span className="text-[10px] text-amber-600">(Est.)</span>}
                </div>
            </TableCell>
            
            {/* GST Column */}
            <TableCell className="text-right text-muted-foreground">
                <div className="flex flex-col items-end">
                    <span className="text-xs">₹{gstAmount.toFixed(2)}</span>
                    <span className="text-[10px]">({finalGstRate}%)</span>
                </div>
            </TableCell>

            {/* 3. UPDATED: Stock Column Logic */}
            <TableCell className="hidden text-center md:table-cell">
                 {isStockLoading ? (
                    <div className="flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : (
                    availability === 'MADE TO ORDER' ? (
                        <span className="text-muted-foreground text-sm">N/A</span>
                    ) : stock !== null ? (
                        <Badge variant={stock < 10 ? 'destructive' : 'outline'}>{stock}</Badge> 
                    ) : (
                        'N/A'
                    )
                )}
            </TableCell>
            <TableCell className="text-right font-bold">₹{finalSubtotal.toFixed(2)}</TableCell>
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
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">Price</TableHead>
                    <TableHead className="text-right">GST</TableHead>
                    <TableHead className="hidden text-center md:table-cell">Stock</TableHead>
                    <TableHead className="text-right">Total</TableHead>
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