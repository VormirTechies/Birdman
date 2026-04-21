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
          <h1 className="text-3xl font-display font-black text-zinc-900 mb-2 tracking-tight">Gallery Library</h1>
          <p className="text-zinc-400 max-w-lg text-sm font-bold uppercase tracking-wider">
            Manage parakeet photography & visual assets
          </p>
        </div>
        
        {/* Upload Button Overlay */}
        <label className="cursor-pointer group">
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleUpload} 
            className="hidden" 
            disabled={isUploading}
          />
          <div className="bg-zinc-900 hover:bg-zinc-800 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-zinc-900/10 group-active:scale-95">
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            {isUploading ? `Uploading ${Math.round(uploadProgress)}%` : 'Add New Asset'}
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
        <div className="py-40 text-center bg-white rounded-[3rem] border border-dashed border-black/10 shadow-sm">
           <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-black/5">
              <ImageIcon className="w-10 h-10 text-zinc-200" />
           </div>
           <h3 className="text-xl font-bold text-zinc-900 mb-2">Vault is Empty</h3>
           <p className="text-zinc-400 max-w-xs mx-auto text-sm font-medium">Start by uploading some stunning shots of the parakeets in Chintadripet.</p>
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
                className="group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-zinc-900 shadow-xl border border-black/5"
              >
                 <img 
                    src={img.url} 
                    alt={img.caption || ''} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-60"
                 />
                 
                 {/* Overlay Actions */}
                 <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 p-8 flex flex-col justify-end translate-y-4 group-hover:translate-y-0">
                    <p className="text-white font-black text-sm mb-4 truncate tracking-tight">{img.caption || 'Unnamed Shot'}</p>
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
              className="fixed bottom-12 right-12 z-[200] bg-white rounded-[2rem] shadow-2xl p-8 border border-black/5 flex items-center gap-6 min-w-[340px] backdrop-blur-md"
           >
              <div className="w-14 h-14 bg-sanctuary-green/10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                 <Loader2 className="w-6 h-6 text-sanctuary-green animate-spin" />
              </div>
              <div className="flex-1">
                 <p className="text-sm font-black text-zinc-900 tracking-tight">Processing Library...</p>
                 <div className="w-full h-2 bg-zinc-50 rounded-full mt-2.5 overflow-hidden border border-black/5">
                    <motion.div 
                        className="h-full bg-sanctuary-green shadow-[0_0_12px_rgba(34,197,94,0.3)]"
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
