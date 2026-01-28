"use client";

import { CldUploadWidget } from 'next-cloudinary';
import { Button } from '@/components/ui/button';
import { ImagePlus } from 'lucide-react';

interface CloudinaryUploadProps {
  onUploadSuccess: (url: string) => void;
}

export function CloudinaryUpload({ onUploadSuccess }: CloudinaryUploadProps) {
  return (
    <CldUploadWidget 
      // FIX 1: Removed the < > brackets. 
      // Ensure 'khushi_uploads' matches the Unsigned Preset name in your Cloudinary Settings exactly.
      uploadPreset="khushi_uploads"
      onSuccess={(result: any) => {
        // Cloudinary returns the secure_url on success
        if (result.info?.secure_url) {
            onUploadSuccess(result.info.secure_url);
        }
      }}
    >
      {({ open }) => {
        return (
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => open()}
            className="flex items-center gap-2"
          >
            <ImagePlus className="h-4 w-4" />
            Upload Image
          </Button>
        );
      }}
    </CldUploadWidget>
  );
}