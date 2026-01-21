'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFirestore } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '@/lib/categories';
import { Checkbox } from '../ui/checkbox';

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  type: 'gold' | 'silver';
  isBestsellerOnly?: boolean; // New prop
}

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0.01, 'Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  imageUrls: z.string().min(1, 'At least one image URL is required'),
  availability: z.enum(['READY TO SHIP', 'MADE TO ORDER']),
  sizes: z.string().optional(),
  stockQuantity: z.coerce.number().min(0, 'Stock cannot be negative').default(0),
  isBestseller: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export function ProductFormDialog({ open, onOpenChange, product, type, isBestsellerOnly = false }: ProductFormDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const firestore = useFirestore();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: '',
      imageUrls: '',
      availability: 'READY TO SHIP',
      sizes: '',
      stockQuantity: 0,
      isBestseller: isBestsellerOnly, // Default to true if in bestseller section
    },
  });

  const category = form.watch('category');

  useEffect(() => {
    if (open) {
      if (product) {
        form.reset({
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          imageUrls: product.imageUrls?.join('\n') || '',
          availability: product.availability,
          sizes: product.sizes?.join(', ') || '',
          stockQuantity: product.stockQuantity || 0,
          isBestseller: product.isBestseller || isBestsellerOnly,
        });
      } else {
        form.reset({
          name: '',
          description: '',
          price: 0,
          category: '',
          imageUrls: '',
          availability: 'READY TO SHIP',
          sizes: '',
          stockQuantity: 0,
          isBestseller: isBestsellerOnly, // Default check logic
        });
      }
    }
  }, [product, open, form, isBestsellerOnly]);

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      if (!firestore) {
        toast({ variant: 'destructive', title: 'An error occurred', description: 'Firestore not available.' });
        return;
      }
      
      const productData = {
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        imageUrls: data.imageUrls.split('\n').map(url => url.trim()).filter(Boolean),
        availability: data.availability,
        type: type,
        sizes: data.sizes ? data.sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
        stockQuantity: data.stockQuantity,
        isBestseller: data.isBestseller,
      };
      
      try {
        const batch = writeBatch(firestore);
        
        if (isBestsellerOnly) {
           // --- BESTSELLER ONLY LOGIC ---
           // Save strictly to the 'bestsellers' collection.
           // Do not touch 'products' collection.
           
           // Ensure isBestseller is true if they are in this section
           const finalData = { ...productData, isBestseller: true };

           if (product) {
             // Update existing bestseller doc
             const docRef = doc(firestore, 'bestsellers', product.id);
             batch.update(docRef, finalData);
           } else {
             // Create new bestseller doc
             const newRef = doc(collection(firestore, 'bestsellers'));
             batch.set(newRef, { ...finalData, id: newRef.id });
           }

        } else {
          // --- STANDARD LOGIC (Products Page) ---
          // Save to 'products' and sync to 'bestsellers' if checked.
          
          if (product) { // Editing
            const productDocRef = doc(firestore, 'products', product.id);
            const bestsellerDocRef = doc(firestore, 'bestsellers', product.id);

            batch.update(productDocRef, productData);

            if (productData.isBestseller) {
              batch.set(bestsellerDocRef, { ...productData, id: product.id });
            } else {
              batch.delete(bestsellerDocRef);
            }

          } else { // Adding
            const newProductRef = doc(collection(firestore, 'products'));
            const newId = newProductRef.id;
            
            batch.set(newProductRef, productData);

            if (productData.isBestseller) {
              const bestsellerRef = doc(firestore, 'bestsellers', newId);
              batch.set(bestsellerRef, { ...productData, id: newId });
            }
          }
        }
        
        await batch.commit();
        
        toast({
          title: `Product ${product ? 'Updated' : 'Added'}`,
          description: `The product "${data.name}" has been successfully ${product ? 'updated' : 'saved'}.`,
        });

        onOpenChange(false);
        setTimeout(() => {
          router.refresh();
        }, 150);

      } catch (error: any) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'An error occurred',
          description: error.message || `You do not have permission to ${product ? 'update' : 'add'} products.`,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {product ? 'Update the details of your product.' : 'Fill in the details for the new product.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            {/* Form Fields remain the same */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                    control={form.control}
                    name="stockQuantity"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Stock Quantity</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
            </div>
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             {category.toLowerCase().includes('ring') && (
                <FormField
                    control={form.control}
                    name="sizes"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Sizes (comma-separated)</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 6, 7, 8" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            )}
            <FormField
              control={form.control}
              name="imageUrls"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URLs</FormLabel>
                  <FormControl>
                    <Textarea placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter one image URL per line. The first URL will be the main display image.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="availability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Availability Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select availability" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="READY TO SHIP">Ready to Ship</SelectItem>
                      <SelectItem value="MADE TO ORDER">Made to Order</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Only show the Bestseller checkbox if NOT in Bestseller Only mode (since it's auto-true there) */}
            {!isBestsellerOnly && (
                <FormField
                    control={form.control}
                    name="isBestseller"
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
                            Mark as Bestseller
                            </FormLabel>
                            <FormDescription>
                                Bestseller products will be highlighted on the website.
                            </FormDescription>
                            <FormMessage />
                        </div>
                        </FormItem>
                    )}
                />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {product ? 'Save Changes' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}