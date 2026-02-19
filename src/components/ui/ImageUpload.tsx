import React, { useState, useCallback } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadProductImage, deleteFile } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';

interface ImageUploadProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  onRemove?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  orderId?: string;
  sku?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  placeholder = "Upload image",
  className = "",
  disabled = false,
  orderId,
  sku
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();


  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      let imageUrl = '';
      
      // Check if we have the required parameters for Supabase upload
      if (orderId && sku && sku.trim()) {
        console.log('Uploading to Supabase Storage:', { orderId, sku, fileName: file.name });
        
        // Upload to Supabase Storage
        const result = await uploadProductImage(file, orderId, sku.trim());
        
        if (result.error) {
          console.error('Supabase upload error:', result.error);
          throw new Error(result.error);
        }
        
        imageUrl = result.url;
        console.log('Upload successful, URL:', imageUrl);
      } else {
        console.log('Using local object URL (missing orderId or sku):', { orderId, sku });
        
        // Fallback to local object URL for testing
        imageUrl = URL.createObjectURL(file);
      }
      
      onChange(imageUrl);
      
      toast({
        title: "Image uploaded successfully",
        description: "The image has been added to the item",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [onChange, toast, orderId, sku]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleRemove = useCallback(async () => {
    try {
      // If we have a value and it's a Supabase URL, try to delete from storage
      if (value && value.includes('supabase.co') && orderId && sku) {
        // Extract the path from the URL to delete from storage
        const urlParts = value.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const path = `product-images/${orderId}/${fileName}`;
        
        await deleteFile(path);
      }
      
      if (onRemove) {
        onRemove();
      } else {
        onChange('');
      }
      
      toast({
        title: "Image removed",
        description: "The image has been removed from the item",
      });
    } catch (error) {
      console.error('Error removing image:', error);
      // Still remove from UI even if storage deletion fails
      if (onRemove) {
        onRemove();
      } else {
        onChange('');
      }
    }
  }, [onChange, onRemove, value, orderId, sku, toast]);

  if (value) {
    return (
      <div className={`relative ${className}`}>
        <div className="relative w-20 h-20">
          <img
            src={value}
            alt="Product"
            className="w-full h-full object-cover rounded-md border border-gray-200 dark:border-gray-700"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-1 -right-1 w-5 h-5 p-0 rounded-full"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        className={`
          relative border-2 border-dashed rounded-md p-4 text-center transition-colors
          ${isDragOver 
            ? 'border-primary bg-primary/10' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={disabled || isUploading}
        />
        
        <div className="space-y-1">
          {isUploading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
              <div className="text-xs">
                <span className="font-medium text-primary">Click to upload</span>
              </div>
              <div className="text-xs text-muted-foreground">
                PNG, JPG, GIF up to 5MB
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
