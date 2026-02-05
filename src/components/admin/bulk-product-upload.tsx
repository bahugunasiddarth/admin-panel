'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useFirestore } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileSpreadsheet } from 'lucide-react';

interface BulkUploadProps {
  type: 'gold' | 'silver';
  isBestsellerOnly?: boolean;
}

export function BulkProductUpload({ type, isBestsellerOnly = false }: BulkUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firestore) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const batch = writeBatch(firestore);

        data.forEach((row: any) => {
          const newId = doc(collection(firestore, 'products')).id;
          const productRef = doc(firestore, 'products', newId);
          const bestsellerRef = doc(firestore, 'bestsellers', newId);

          const productData = {
            id: newId,
            name: String(row.name || 'Untitled Product'),
            description: String(row.description || ''),
            price: Number(row.price || 0),
            category: String(row.category || 'Uncategorized'),
            // Splits by newline or comma
            imageUrls: row.imageUrls ? String(row.imageUrls).split(/[,\n]/).map((u: string) => u.trim()).filter(Boolean) : [],
            availability: row.availability === 'MADE TO ORDER' ? 'MADE TO ORDER' : 'READY TO SHIP',
            type: type,
            material: type === 'gold' ? 'Gold' : 'Silver',
            stockQuantity: Number(row.stockQuantity || 0),
            isBestseller: isBestsellerOnly || row.isBestseller === 'true' || row.isBestseller === true,
            priceOnRequest: row.priceOnRequest === 'true' || row.priceOnRequest === true,
            sizes: row.sizes ? String(row.sizes).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
            slug: String(row.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          };

          batch.set(productRef, productData);

          if (productData.isBestseller) {
            batch.set(bestsellerRef, productData);
          }
        });

        await batch.commit();
        toast({ title: "Success", description: `Bulk upload of ${data.length} items complete.` });
        window.location.reload(); // Refresh to show new data
      } catch (error: any) {
        toast({ variant: "destructive", title: "Upload Failed", description: error.message });
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <Button variant="outline" size="sm" disabled={isUploading} className="relative cursor-pointer">
      {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
      {isUploading ? "Uploading..." : "Bulk Add"}
      <input 
        type="file" 
        className="absolute inset-0 opacity-0 cursor-pointer" 
        accept=".xlsx, .xls, .csv" 
        onChange={handleFileUpload} 
        disabled={isUploading}
      />
    </Button>
  );
}