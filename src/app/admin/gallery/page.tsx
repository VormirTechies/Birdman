'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Plus, 
  Loader2, 
  Eye, 
  X,
  FileImage,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface GalleryImage {
  id: string;
  url: string;
  caption: string | null;
  uploadedAt: string;
}

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const supabase = createClient();

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/gallery');
      const data = await res.json();
      setImages(data);
    } catch (err) {
      toast.error('Failed to load gallery');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        // 1. Upload to Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('gallery')
          .upload(filePath, file);

        if (storageError) throw storageError;

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('gallery')
          .getPublicUrl(filePath);

        // 3. Save to Database
        const res = await fetch('/api/admin/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: publicUrl, caption: file.name.split('.')[0] }),
        });

        if (!res.ok) throw new Error('Failed to save to database');

        const newImage = await res.json();
        setImages(prev => [newImage, ...prev]);
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      toast.success(`Successfully uploaded ${files.length} images!`);
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setImages(prev => prev.filter(img => img.id !== id));
      toast.success('Image removed from gallery');
    } catch (err) {
      toast.error('Failed to delete image');
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-display font-bold text-canopy-dark mb-2">Gallery Management</h1>
          <p className="text-canopy-dark/50 max-w-lg">
            Upload new parakeet photos directly to the sanctuary collection. High-resolution images are automatically optimized for display.
          </p>
        </div>
        
        {/* Upload Button Overlay */}
        <label className="cursor-pointer">
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleUpload} 
            className="hidden" 
            disabled={isUploading}
          />
          <div className="bg-sanctuary-green hover:bg-sanctuary-green/90 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-sanctuary-green/20">
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            {isUploading ? `Uploading ${Math.round(uploadProgress)}%` : 'Add Parakeet Photo'}
          </div>
        </label>
      </div>

      {/* Main Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 opacity-20">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p className="text-sm font-medium tracking-widest uppercase">Opening Vault...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="py-40 text-center bg-white rounded-[3rem] border border-dashed border-canopy-dark/10">
           <div className="w-20 h-20 bg-canopy-dark/[0.03] rounded-full flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-10 h-10 text-canopy-dark/10" />
           </div>
           <h3 className="text-xl font-bold text-canopy-dark mb-2">No Images in Gallery</h3>
           <p className="text-canopy-dark/40 max-w-xs mx-auto">Start by uploading some stunning shots of the parakeets in Chintadripet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
           <AnimatePresence mode="popLayout">
            {images.map((img, i) => (
              <motion.div
                key={img.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                transition={{ delay: i * 0.03 }}
                className="group relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-canopy-dark shadow-xl"
              >
                 <img 
                    src={img.url} 
                    alt={img.caption || ''} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80"
                 />
                 
                 {/* Overlay Actions */}
                 <div className="absolute inset-0 bg-gradient-to-t from-canopy-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                    <p className="text-white font-bold text-sm mb-4 truncate">{img.caption || 'Unnamed Shot'}</p>
                    <div className="flex gap-2">
                       <Button 
                          onClick={() => handleDelete(img.id)}
                          variant="destructive" 
                          size="icon" 
                          className="h-10 w-10 rounded-xl bg-red-600/90 hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                       </Button>
                       <Button 
                          variant="secondary" 
                          size="icon" 
                          className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white/40"
                        >
                          <Eye className="w-4 h-4" />
                       </Button>
                    </div>
                 </div>
              </motion.div>
            ))}
           </AnimatePresence>
        </div>
      )}

      {/* Upload Feedback Overlay */}
      <AnimatePresence>
        {isUploading && (
           <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-12 right-12 z-[200] bg-white rounded-3xl shadow-2xl p-6 border border-canopy-dark/5 flex items-center gap-6 min-w-[320px]"
           >
              <div className="w-12 h-12 bg-sanctuary-green/10 rounded-2xl flex items-center justify-center">
                 <Loader2 className="w-6 h-6 text-sanctuary-green animate-spin" />
              </div>
              <div className="flex-1">
                 <p className="text-sm font-bold text-canopy-dark">Uploading Gallery...</p>
                 <div className="w-full h-1.5 bg-canopy-dark/5 rounded-full mt-2 overflow-hidden">
                    <motion.div 
                        className="h-full bg-sanctuary-green"
                        animate={{ width: `${uploadProgress}%` }}
                    />
                 </div>
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
