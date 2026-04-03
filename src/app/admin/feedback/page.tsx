'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  CheckCircle2, 
  XSquare, 
  Trash2, 
  ShieldAlert, 
  Loader2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
        <h1 className="text-3xl font-display font-bold text-canopy-dark mb-2">Feedback Moderation</h1>
        <p className="text-canopy-dark/50">Approve or remove visitor testimonials. Only approved feedback appears on the public website.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 opacity-20">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p className="text-sm font-medium">Scanning feedback queue...</p>
        </div>
      ) : feedback.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[2rem] border border-canopy-dark/5">
          <div className="w-16 h-16 bg-sanctuary-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-sanctuary-green" />
          </div>
          <h3 className="text-lg font-bold text-canopy-dark mb-1">Queue Clear!</h3>
          <p className="text-sm text-canopy-dark/40">There are no pending feedbacks for review at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {feedback.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-3xl border border-canopy-dark/5 shadow-sm p-8 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-canopy-dark rounded-xl flex items-center justify-center font-bold text-white text-xs uppercase">
                        {item.visitorName?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <p className="font-bold text-canopy-dark leading-none mb-1">{item.visitorName || 'Anonymous Visitor'}</p>
                        <p className="text-xs text-canopy-dark/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 text-sunset-amber">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={cn("text-lg", (item.rating ?? 0) > i ? "opacity-100" : "opacity-20")}>★</span>
                      ))}
                    </div>
                  </div>
                  <blockquote className="text-canopy-dark/70 italic leading-relaxed mb-8">
                    "{item.message}"
                  </blockquote>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={() => handleApprove(item.id)}
                    className="flex-1 bg-sanctuary-green h-12 rounded-xl text-sm gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve & Publish
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleDelete(item.id)}
                    className="p-3 h-12 w-12 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 border border-red-500/10"
                  >
                    <Trash2 className="w-5 h-5" />
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
