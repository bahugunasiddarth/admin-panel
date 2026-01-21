'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user state is loaded
    }

    if (!user) {
      setIsVerifying(false);
      // If not logged in and not on the login page, redirect
      if (pathname !== '/admin/login') {
        router.replace('/admin/login');
      }
      return;
    }

    // User is logged in, check their 'isAdmin' field in Firestore
    const verifyAdminStatus = async () => {
      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().isAdmin === true) {
          // User is an admin, allow access
          setIsVerifying(false);
        } else {
          // User is not an admin or profile doesn't exist
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You do not have permission to access this panel.',
          });
          await signOut(auth);
          router.replace('/admin/login');
        }
      } catch (error) {
        console.error('Error verifying admin status:', error);
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'Could not verify your admin status.',
        });
        await signOut(auth);
        router.replace('/admin/login');
      }
    };

    verifyAdminStatus();
    
  }, [user, isUserLoading, router, pathname, auth, firestore, toast]);

  if (isUserLoading || (user && isVerifying)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Verifying permissions...</p>
      </div>
    );
  }
  
  // Allow login page to be rendered without the layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }
  
  // If user exists and is verified as admin, show the admin panel
  if (user && !isVerifying) {
    return (
        <SidebarProvider>
            <Sidebar collapsible="icon">
                <AdminSidebar />
            </Sidebar>
            <SidebarInset>
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <SidebarTrigger />
                    {/* The rest of the header can be added here, e.g. a user dropdown */}
                </header>
                <main className="flex-1 overflow-y-auto bg-background p-4">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
  }

  // Fallback for edge cases, renders nothing while redirecting
  return null;
}
