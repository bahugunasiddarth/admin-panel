'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { ProductTable } from '@/components/admin/product-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PRODUCT_CATEGORIES } from '@/lib/categories';

const availabilityOptions: readonly ('READY TO SHIP' | 'MADE TO ORDER')[] = ['READY TO SHIP', 'MADE TO ORDER'];

export default function BestsellersPage() {
  const firestore = useFirestore();

  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  // CHANGE: Query 'products' collection where isBestseller == true
  // This ensures we see the LIVE stock, not the stale bestsellers collection.
  const goldProductsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'products'), 
        where('type', '==', 'gold'),
        where('isBestseller', '==', true)
    );
  }, [firestore]);

  const silverProductsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'products'), 
        where('type', '==', 'silver'),
        where('isBestseller', '==', true)
    );
  }, [firestore]);

  const { data: goldProducts, isLoading: isLoadingGold } = useCollection<Product>(goldProductsQuery);
  const { data: silverProducts, isLoading: isLoadingSilver } = useCollection<Product>(silverProductsQuery);

  const filterProducts = (products: Product[] | null) => {
    if (!products) return [];
    return products.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = categoryFilter === 'all' || product.category === categoryFilter;
      const availabilityMatch = availabilityFilter === 'all' || product.availability === availabilityFilter;
      return nameMatch && categoryMatch && availabilityMatch;
    });
  };

  const filteredGoldProducts = useMemo(() => filterProducts(goldProducts), [goldProducts, searchTerm, categoryFilter, availabilityFilter]);
  const filteredSilverProducts = useMemo(() => filterProducts(silverProducts), [silverProducts, searchTerm, categoryFilter, availabilityFilter]);


  const isLoading = isLoadingGold || isLoadingSilver;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Bestsellers</h1>
          <p className="text-muted-foreground">
            Manage your bestselling gold and silver products.
          </p>
        </div>
      </div>
      
      {/* Filter and Search Controls */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[240px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {PRODUCT_CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
          <SelectTrigger className="w-full md:w-[240px]">
            <SelectValue placeholder="Filter by availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Availability</SelectItem>
            {availabilityOptions.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


      <Tabs defaultValue="gold">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gold">Gold Bestsellers</TabsTrigger>
          <TabsTrigger value="silver">Silver Bestsellers</TabsTrigger>
        </TabsList>
        <TabsContent value="gold">
          <Card>
            <CardHeader>
              <CardTitle>Gold Bestsellers</CardTitle>
              <CardDescription>View, add, edit, or delete gold bestsellers.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ProductTable 
                    products={filteredGoldProducts} 
                    type="gold" 
                    isBestsellerPage={true} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="silver">
          <Card>
             <CardHeader>
              <CardTitle>Silver Bestsellers</CardTitle>
              <CardDescription>View, add, edit, or delete silver bestsellers.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                 <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ProductTable 
                    products={filteredSilverProducts} 
                    type="silver" 
                    isBestsellerPage={true} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}