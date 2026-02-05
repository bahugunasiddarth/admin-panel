'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductFormDialog } from './product-form';
import { BulkProductUpload } from './bulk-product-upload';

interface ManagementHeaderProps {
  title?: string;
  type: 'gold' | 'silver';
  isBestsellerOnly?: boolean;
}

export function ManagementHeader({ title, type, isBestsellerOnly = false }: ManagementHeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {title && <h2 className="text-lg font-semibold">{title}</h2>}
      
      {/* Excel Upload Button */}
      <BulkProductUpload type={type} isBestsellerOnly={isBestsellerOnly} />
      
      {/* Single Add Button */}
      <Button onClick={() => setIsDialogOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        Add Product
      </Button>

      <ProductFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        product={null} 
        type={type} 
        isBestsellerOnly={isBestsellerOnly} 
      />
    </div>
  );
}