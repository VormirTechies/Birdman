'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, CloudUpload } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { GalleryImageItem } from './ImageCard';

const FONT = 'var(--font-work-sans, Work Sans, sans-serif)';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface AddImageModalProps {
  /** When provided, the modal is in edit mode (no file upload) */
  editImage?: GalleryImageItem;
  onClose: () => void;
  onSaved: (image: GalleryImageItem) => void;
}

export function AddImageModal({ editImage, onClose, onSaved }: AddImageModalProps) {
  const isEdit = !!editImage;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState(editImage?.altText ?? '');
  const [description, setDescription] = useState(editImage?.caption ?? '');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Revoke object URL on unmount
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const validateAndSetFile = useCallback((f: File) => {
    setError('');
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('Only JPG, PNG, WebP, or GIF images are allowed.');
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setError('Image must be 5 MB or smaller.');
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }, []);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) validateAndSetFile(f);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) validateAndSetFile(f);
  }, [validateAndSetFile]);

  const handleSave = async () => {
    setError('');
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!isEdit && !file) { setError('Please select an image.'); return; }

    setSaving(true);
    try {
      if (isEdit) {
        // Edit mode: just update title and description
        const res = await fetch(`/api/admin/gallery/${editImage!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim(), description: description.trim() || null }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? 'Failed to update image.'); return; }
        onSaved(data.image);
      } else {
        // Add mode: upload file + save
        const fd = new FormData();
        fd.append('file', file!);
        fd.append('title', title.trim());
        if (description.trim()) fd.append('description', description.trim());

        const res = await fetch('/api/admin/gallery/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? 'Failed to upload image.'); return; }
        onSaved(data.image);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col"
        style={{ fontFamily: FONT }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#212121]">
              {isEdit ? 'Edit Image' : 'Add New Image'}
            </h2>
            <p className="text-xs text-[#9E9E9E] mt-0.5">
              {isEdit ? 'Update the title or description.' : 'Upload high-quality JPG or PNG files.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5F5F5] transition-colors text-[#616161] shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-2 flex flex-col gap-4">
          {/* Upload zone (add mode only) */}
          {!isEdit && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative border-2 border-dashed rounded-xl cursor-pointer transition-colors overflow-hidden',
                dragging ? 'border-[#2E7D32] bg-[#E8F5E9]' : 'border-[#E0E0E0] bg-[#FAFAFA] hover:border-[#2E7D32] hover:bg-[#F1F8E9]'
              )}
              style={{ minHeight: '160px' }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFilePick}
              />
              {previewUrl ? (
                <div className="relative w-full" style={{ height: '160px' }}>
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                    <span className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-full">
                      Change image
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-2 pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                    <CloudUpload className="w-5 h-5 text-[#2E7D32]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-[#212121]">Click to upload or drag and drop</p>
                    <p className="text-xs text-[#9E9E9E] mt-0.5">SVG, PNG, JPG or GIF (max. 5MB)</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#212121]">
              Title <span className="text-[#D32F2F]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ocean View Suite"
              maxLength={200}
              className="h-10 px-3 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#212121] placeholder-[#BDBDBD] focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] transition"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#212121]">
              Description <span className="text-[#9E9E9E] font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief context for this image..."
              rows={3}
              maxLength={500}
              className="px-3 py-2.5 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#212121] placeholder-[#BDBDBD] focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] transition resize-none"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-xs text-[#D32F2F] bg-[#FFEBEE] px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-5 pt-4">
          <button
            onClick={onClose}
            className="h-10 px-5 rounded-xl border border-[#E0E0E0] text-sm font-medium text-[#616161] hover:bg-[#F5F5F5] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-10 px-5 rounded-xl bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#1B5E20] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Save Image'}
          </button>
        </div>
      </div>
    </div>
  );
}
