'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  CheckCircle2, 
  Trash2, 
  Loader2,
  Clock,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Feedback {
  id: string;
  visitorName: string | null;
  message: string;
  rating: number | null;
  isApproved: boolean;
  createdAt: string;
}

export default function FeedbackModerationPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeedback = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/feedback');
      const data = await res.json();
      setFeedback(data);
    } catch (err) {
      toast.error('Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, { method: 'PATCH' });
      if (!res.ok) throw new Error();
      setFeedback(prev => prev.filter(f => f.id !== id));
      toast.success('Feedback approved & published!');
    } catch (err) {
      toast.error('Failed to approve feedback');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setFeedback(prev => prev.filter(f => f.id !== id));
      toast.success('Feedback deleted');
    } catch (err) {
      toast.error('Failed to delete feedback');
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="mb-12">
        <h1 className="text-3xl font-display font-black text-zinc-900 mb-2 tracking-tight">Public Sentiments</h1>
        <p className="text-zinc-400 font-bold text-sm uppercase tracking-wider">Moderate and curate visitor testimonials</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 opacity-20">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-zinc-900" />
          <p className="text-sm font-black tracking-widest uppercase text-zinc-900">Scanning queue...</p>
        </div>
      ) : feedback.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[3rem] border border-black/5 shadow-sm">
          <div className="w-16 h-16 bg-sanctuary-green/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="w-8 h-8 text-sanctuary-green" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 mb-2">All Caught Up!</h3>
          <p className="text-sm font-bold text-zinc-300 uppercase tracking-widest">No pending feedback for review</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {feedback.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-[2.5rem] border border-black/5 shadow-2xl shadow-black/[0.02] p-10 flex flex-col justify-between group hover:border-black/10 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-zinc-900 rounded-3xl shadow-xl flex items-center justify-center font-black text-white text-lg">
                        {item.visitorName?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <p className="font-black text-zinc-900 leading-none mb-1.5 text-xl tracking-tight">{item.visitorName || 'Anonymous Visitor'}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
                          <Clock className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("w-5 h-5 fill-current", (item.rating ?? 0) > i ? "opacity-100" : "opacity-10")} />
                      ))}
                    </div>
                  </div>
                  <blockquote className="text-zinc-500 font-medium italic leading-relaxed mb-10 text-xl">
                    "{item.message}"
                  </blockquote>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button 
                    onClick={() => handleApprove(item.id)}
                    className="flex-1 bg-sanctuary-green hover:bg-zinc-900 text-white h-16 rounded-2xl text-sm font-black uppercase tracking-widest gap-3 shadow-xl shadow-black/5 group-hover:translate-y-[-2px] transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Approve Asset
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleDelete(item.id)}
                    className="p-3 h-16 w-16 rounded-2xl text-zinc-300 hover:text-red-500 hover:bg-red-50 border border-black/5 hover:border-red-100 transition-all shadow-sm"
                  >
                    <Trash2 className="w-6 h-6" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </main>
  );
}
