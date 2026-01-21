'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Gem,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
  Users,
  Star,
} from 'lucide-react';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import {
    SidebarContent,
    SidebarHeader,
    SidebarFooter,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    useSidebar
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/products', icon: Package, label: 'Products' },
  { href: '/admin/bestsellers', icon: Star, label: 'Bestsellers' },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/admin/customers', icon: Users, label: 'Customers' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();
  const { state, setOpenMobile } = useSidebar();

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setOpenMobile(false);
      router.push('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleLinkClick = () => {
    setOpenMobile(false);
  }

  return (
    <>
        <SidebarHeader className={cn(
          "flex flex-row h-14 items-center justify-center border-b px-3 lg:h-[60px]",
          state === 'expanded' && 'justify-start px-4 lg:px-6'
        )}>
             <Link href="/admin" className="flex items-center gap-2 font-semibold text-foreground">
                <Gem className="h-6 w-6" />
                {state === 'expanded' && <span className="font-semibold">Khushi admin</span>}
            </Link>
        </SidebarHeader>
        <SidebarContent className="flex-1 p-2">
            <SidebarMenu>
                {navItems.map((item) => {
                    const isActive = item.href === '/admin'
                        ? pathname === item.href
                        : pathname.startsWith(item.href);
                    
                    return (
                        <SidebarMenuItem key={item.href}>
                             <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={{
                                    children: item.label,
                                }}
                             >
                                <Link href={item.href} onClick={handleLinkClick}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t p-2">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        onClick={handleSignOut}
                        tooltip={{
                            children: 'Sign Out'
                        }}
                    >
                        <LogOut />
                        <span>Sign Out</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
    </>
  );
}
