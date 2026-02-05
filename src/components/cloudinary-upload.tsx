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
      uploadPreset="khushi_uploads"
      // Added options to ensure it behaves like a modal
      options={{
        sources: ['local', 'url', 'camera'],
        multiple: false,
        maxFiles: 1,
        // Force styling if needed, though CSS class is better
        styles: {
            palette: {
                window: "#FFFFFF",
                windowBorder: "#90A0B3",
                tabIcon: "#0078FF",
                menuIcons: "#5A616A",
                textDark: "#000000",
                textLight: "#FFFFFF",
                link: "#0078FF",
                action: "#FF620C",
                inactiveTabIcon: "#0E2F5A",
                error: "#F44235",
                inProgress: "#0078FF",
                complete: "#20B832",
                sourceBg: "#E4EBF1"
            }
        }
      }}
onSuccess={(result: any) => {
  // Cloudinary says: "Here is the new image URL"
  if (result.info?.secure_url) {
      // You pass this URL back to your form to save it
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