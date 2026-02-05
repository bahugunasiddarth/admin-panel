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

const availabilityOptions: readonly ('READY TO SHIP' | 'MADE TO ORDER')[] = ['READY TO SHIP', 'MADE TO ORDER'];

export default function ProductsPage() {
  const firestore = useFirestore();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  const goldProductsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('type', '==', 'gold'));
  }, [firestore]);

  const silverProductsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('type', '==', 'silver'));
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
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Inventory</h1>
          <p className="text-muted-foreground">Manage your gold and silver product catalog.</p>
        </div>
      </div>
      
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
      </div>

      <Tabs defaultValue="gold">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gold">Gold Products</TabsTrigger>
          <TabsTrigger value="silver">Silver Products</TabsTrigger>
        </TabsList>
        <TabsContent value="gold">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="grid gap-1">
                <CardTitle>Gold Products</CardTitle>
                <CardDescription>View and manage gold inventory.</CardDescription>
              </div>
              <ManagementHeader type="gold" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ProductTable products={filteredGoldProducts} type="gold" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="silver">
          <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="grid gap-1">
                <CardTitle>Silver Products</CardTitle>
                <CardDescription>View and manage silver inventory.</CardDescription>
              </div>
              <ManagementHeader type="silver" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                 <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ProductTable products={filteredSilverProducts} type="silver" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}