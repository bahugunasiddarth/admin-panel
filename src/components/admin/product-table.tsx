'use client';

import type { Product } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ProductFormDialog } from './product-form';
import { DeleteProductDialog } from './product-actions';
import Image from 'next/image';

// Define a type for the actions to make the state management more robust.
type ActionState = 
  | { type: 'add' }
  | { type: 'edit', product: Product }
  | { type: 'delete', product: Product }
  | null;

// UPDATED: Added isBestsellerPage to the type definition
export function ProductTable({ 
  products, 
  type, 
  isBestsellerPage = false 
}: { 
  products: Product[], 
  type: 'gold' | 'silver', 
  isBestsellerPage?: boolean 
}) {
  // A single state to manage which dialog is open and with what data.
  const [activeAction, setActiveAction] = useState<ActionState>(null);

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      setActiveAction(null);
    }
  };

  useEffect(() => {
    if (!activeAction) {
      setTimeout(() => {
        document.body.style.pointerEvents = "";
        document.body.style.overflow = "";
      }, 500);
    }
  }, [activeAction]);

  const getDisplayUrl = (urls: string[] | undefined): string => {
    const fallback = `https://picsum.photos/seed/placeholder/64/64`;
    if (!urls || urls.length === 0) {
      return fallback;
    }
    const firstUrl = urls[0];

    if (!firstUrl || typeof firstUrl !== 'string') {
        return fallback;
    }
    
    const urlMatch = firstUrl.match(/https?:\/\/[^\s"<>]+/);
    return urlMatch ? urlMatch[0] : fallback;
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setActiveAction({ type: 'add' })}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
      <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden sm:table-cell">Status</TableHead>
            <TableHead className="hidden lg:table-cell">Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="hidden text-right md:table-cell">Stock</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center h-24">No products found.</TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="hidden sm:table-cell">
                  <Image
                    alt={product.name}
                    className="aspect-square rounded-md object-cover"
                    data-ai-hint={`${product.type} ${product.category}`}
                    height="64"
                    src={getDisplayUrl(product.imageUrls)}
                    width="64"
                  />
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={product.availability === 'READY TO SHIP' ? 'outline' : 'secondary'}>
                    {product.availability}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{product.category}</TableCell>
                <TableCell className="text-right">₹{product.price.toFixed(2)}</TableCell>
                <TableCell className="hidden text-right md:table-cell">
                    {product.stockQuantity !== undefined ? (
                        <Badge variant={(product.stockQuantity || 0) < 10 ? 'destructive' : 'outline'}>
                            {product.stockQuantity}
                        </Badge>
                    ) : (
                        'N/A'
                    )}
                </TableCell>
                <TableCell>
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
                          setTimeout(() => setActiveAction({ type: 'edit', product }), 0);
                        }}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onSelect={(e) => {
                          e.preventDefault();
                          setTimeout(() => setActiveAction({ type: 'delete', product }), 0);
                        }}
                      >
                        Delete
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

      <ProductFormDialog
        open={activeAction?.type === 'add' || activeAction?.type === 'edit'}
        onOpenChange={handleDialogClose}
        product={activeAction?.type === 'edit' ? activeAction.product : null}
        type={type}
        // UPDATED: Passing the prop down to the form
        isBestsellerOnly={isBestsellerPage} 
      />

      <DeleteProductDialog
        open={activeAction?.type === 'delete'}
        onOpenChange={handleDialogClose}
        product={activeAction?.type === 'delete' ? activeAction.product : null}
      />
    </>
  );
}