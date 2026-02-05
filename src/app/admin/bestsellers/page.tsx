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
import { ManagementHeader } from '@/components/admin/management-header';

export default function BestsellersPage() {
  const firestore = useFirestore();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

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
      return nameMatch && categoryMatch;
    });
  };

  const filteredGoldProducts = useMemo(() => filterProducts(goldProducts), [goldProducts, searchTerm, categoryFilter]);
  const filteredSilverProducts = useMemo(() => filterProducts(silverProducts), [silverProducts, searchTerm, categoryFilter]);

  const isLoading = isLoadingGold || isLoadingSilver;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Bestsellers</h1>
          <p className="text-muted-foreground">Manage your featured gold and silver products.</p>
        </div>
      </div>
      
      <div className="relative w-full md:w-1/2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search bestsellers..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs defaultValue="gold">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gold">Gold Bestsellers</TabsTrigger>
          <TabsTrigger value="silver">Silver Bestsellers</TabsTrigger>
        </TabsList>
        <TabsContent value="gold">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="grid gap-1">
                <CardTitle>Gold Bestsellers</CardTitle>
                <CardDescription>Items featured in your gold collection.</CardDescription>
              </div>
              <ManagementHeader type="gold" isBestsellerOnly={true} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ProductTable products={filteredGoldProducts} type="gold" isBestsellerPage={true} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="silver">
          <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="grid gap-1">
                <CardTitle>Silver Bestsellers</CardTitle>
                <CardDescription>Items featured in your silver collection.</CardDescription>
              </div>
              <ManagementHeader type="silver" isBestsellerOnly={true} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                 <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ProductTable products={filteredSilverProducts} type="silver" isBestsellerPage={true} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}