'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, query } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import type { Order, Product, Customer } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, Package, ShoppingCart, Users, Loader2, Hourglass, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isSameDay } from 'date-fns';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';


const revenueChartConfig = {
  total: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const orderChartConfig = {
  total: {
    label: 'Orders',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;


export default function DashboardPage() {
  const firestore = useFirestore();

  // State for date filtering
  const [date, setDate] = useState<DateRange | undefined>();
  const [activeFilter, setActiveFilter] = useState<string>('all_time');

  // Queries
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'orders'));
  }, [firestore]);
  
  // Data fetching
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
  const { data: users, isLoading: isLoadingUsers } = useCollection<Customer>(usersQuery);
  const { data: allOrders, isLoading: isLoadingOrders } = useCollection<any>(ordersQuery);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    const now = new Date();
    if (filter === 'today') setDate({ from: now, to: now });
    else if (filter === 'week') setDate({ from: startOfWeek(now), to: endOfWeek(now) });
    else if (filter === 'month') setDate({ from: startOfMonth(now), to: endOfMonth(now) });
    else if (filter === 'year') setDate({ from: startOfYear(now), to: endOfYear(now) });
    else if (filter === 'all_time') setDate(undefined);
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDate(range);
    if (range?.from && isSameDay(range.from, new Date()) && !range.to) {
        setActiveFilter('today');
    } else {
        setActiveFilter('custom');
    }
  };

  const filteredOrders = useMemo(() => {
    if (!allOrders) return [];
    if (!date?.from) return allOrders; // No filter, return all

    const from = date.from;
    const to = date.to || date.from; // if only `from` is selected, `to` is the same day.

    // Set to to end of day for proper comparison
    const toEndOfDay = new Date(to);
    toEndOfDay.setHours(23, 59, 59, 999);

    return allOrders.filter(order => {
        const orderDate = order.orderDate?.toDate();
        if (!orderDate) return false;
        return orderDate >= from && orderDate <= toEndOfDay;
    });
  }, [allOrders, date]);


  const recentOrders = useMemo(() => {
    if (!allOrders || !users) return [];
    
    const usersMap = new Map(users.map(u => [u.id, u]));

    const enrichedOrders = allOrders.map(order => {
        const pathSegments = (order as any).path.split('/');
        const userId = pathSegments.length > 1 ? pathSegments[1] : '';
        const user = usersMap.get(userId);
        
        return {
            ...order,
            customer: {
                name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown User',
                email: user ? user.email : 'N/A',
            },
            shippingAddress: order.shippingAddress || order.shipping_address,
        };
    });

    // Sort by date descending and take the first 5
    return [...enrichedOrders]
      .sort((a, b) => (b.orderDate?.toDate()?.getTime() || 0) - (a.orderDate?.toDate()?.getTime() || 0))
      .slice(0, 5);
  }, [allOrders, users]);

  const lowStockProducts = useMemo(() => {
    if (!products) return [];
    return products
      .filter(p => p.stockQuantity !== undefined && p.stockQuantity < 10)
      .sort((a, b) => (a.stockQuantity || 0) - (b.stockQuantity || 0))
      .slice(0, 5);
  }, [products]);

  const stats = useMemo(() => {
    const totalRevenue = filteredOrders?.reduce((acc, order) => acc + (order.totalAmount || 0), 0) || 0;
    const completedOrders = filteredOrders?.filter(order => (order.orderStatus || order.status) === 'Delivered').length || 0;
    const pendingOrders = filteredOrders?.filter(order => (order.orderStatus || order.status) === 'Pending').length || 0;
    const customerIdsInFilteredOrders = new Set(filteredOrders.map(order => order.userId));
    
    return {
      totalProducts: products?.length || 0,
      totalCustomers: date?.from ? customerIdsInFilteredOrders.size : (users?.length || 0),
      totalOrders: filteredOrders?.length || 0,
      totalRevenue,
      completedOrders,
      pendingOrders,
    };
  }, [products, users, filteredOrders, date]);
  
  const weeklyRevenueData = useMemo(() => {
    if (!allOrders) return [];
    
    const data: { [key: string]: { name: string; total: number } } = {};
    
    // Initialize the last 7 days in chronological order
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayKey = format(d, 'yyyy-MM-dd');
        data[dayKey] = { name: format(d, 'EEE'), total: 0 };
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    allOrders.forEach(order => {
        if (order.orderDate?.toDate) {
            const date = order.orderDate.toDate();
            if (date >= sevenDaysAgo) {
                const dayKey = format(date, 'yyyy-MM-dd');
                if (data[dayKey]) {
                    data[dayKey].total += order.totalAmount || 0;
                }
            }
        }
    });
    
    return Object.values(data);
  }, [allOrders]);

  const weeklyOrderData = useMemo(() => {
    if (!allOrders) return [];
    
    const data: { [key: string]: { name: string; total: number } } = {};
    
    // Initialize the last 7 days in chronological order
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayKey = format(d, 'yyyy-MM-dd');
        data[dayKey] = { name: format(d, 'EEE'), total: 0 };
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    allOrders.forEach(order => {
        if (order.orderDate?.toDate) {
            const date = order.orderDate.toDate();
            if (date >= sevenDaysAgo) {
                const dayKey = format(date, 'yyyy-MM-dd');
                if (data[dayKey]) {
                    data[dayKey].total += 1;
                }
            }
        }
    });
    
    return Object.values(data);
  }, [allOrders]);

  const getInitials = (name: string = '') => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const isLoading = isLoadingProducts || isLoadingUsers || isLoadingOrders;

  if (isLoading) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Dashboard</h1>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Button variant={activeFilter === 'all_time' ? 'default' : 'outline'} size="sm" onClick={() => handleFilterChange('all_time')}>All Time</Button>
            <Button variant={activeFilter === 'today' ? 'default' : 'outline'} size="sm" onClick={() => handleFilterChange('today')}>Today</Button>
            <Button variant={activeFilter === 'week' ? 'default' : 'outline'} size="sm" onClick={() => handleFilterChange('week')}>This Week</Button>
            <Button variant={activeFilter === 'month' ? 'default' : 'outline'} size="sm" onClick={() => handleFilterChange('month')}>This Month</Button>
            <Button variant={activeFilter === 'year' ? 'default' : 'outline'} size="sm" onClick={() => handleFilterChange('year')}>This Year</Button>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={activeFilter === 'custom' ? 'default' : 'outline'}
                        size="sm"
                        className={cn("w-full justify-start text-left font-normal sm:w-[240px]", !date && "text-muted-foreground")}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Custom Range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={handleDateSelect}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </div>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Revenue for selected period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Orders in selected period</p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <Hourglass className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.pendingOrders}</div>
                <p className="text-xs text-muted-foreground">Orders awaiting processing</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.completedOrders}</div>
                <p className="text-xs text-muted-foreground">Orders successfully delivered</p>
            </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">{date?.from ? 'Active customers in period' : 'Total registered users'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Total products available</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>Revenue from the last 7 days.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2 h-[250px]">
                 <ChartContainer config={revenueChartConfig} className="w-full h-full">
                    <BarChart accessibilityLayer data={weeklyRevenueData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                        />
                        <YAxis
                            tickFormatter={(value) => `₹${value / 1000}k`}
                            tickLine={false}
                            axisLine={false}
                            width={80}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent 
                                formatter={(value) => `₹${Number(value).toLocaleString()}`}
                                indicator="dot" 
                            />}
                        />
                        <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Order Overview</CardTitle>
                <CardDescription>Number of orders from the last 7 days.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2 h-[250px]">
                 <ChartContainer config={orderChartConfig} className="w-full h-full">
                    <BarChart accessibilityLayer data={weeklyOrderData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                        />
                        <YAxis
                            tickFormatter={(value) => `${value}`}
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                            width={80}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent 
                                formatter={(value) => `${Number(value).toLocaleString()} orders`}
                                indicator="dot" 
                            />}
                        />
                        <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your 5 most recent orders.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead className="hidden md:table-cell">City</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="hidden text-right sm:table-cell">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentOrders && recentOrders.length > 0 ? (
                            recentOrders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback>{getInitials(order.customer.name)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{order.customer.name}</div>
                                                <div className="text-sm text-muted-foreground">{order.customer.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{order.shippingAddress?.city || 'N/A'}</TableCell>
                                    <TableCell className="text-right">₹{(order.totalAmount || 0).toFixed(2)}</TableCell>
                                    <TableCell className="hidden text-right sm:table-cell">{order.orderDate ? format(order.orderDate.toDate(), 'PP') : 'N/A'}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">No recent orders.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Low Stock Alerts</CardTitle>
                <CardDescription>Top 5 products with fewer than 10 units in stock.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lowStockProducts && lowStockProducts.length > 0 ? (
                            lowStockProducts.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <div className="font-medium">{product.name}</div>
                                        <div className="text-sm text-muted-foreground">{product.category}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="destructive">{product.stockQuantity}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center h-24">All products are well-stocked.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
