'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bird,
  Lock,
  Calendar,
  Users,
  Bell,
  LogOut,
  Eye,
  Search,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

/* ════════════════════════════════════════════════════════════════════════════
   ADMIN PAGE — Login + Dashboard
   ════════════════════════════════════════════════════════════════════════════ */

const mockBookings = [
  { id: 'BK-001', name: 'Priya Sundaram', date: '2026-03-29', session: 'Morning', guests: 3, status: 'confirmed', phone: '+91 98765 43210' },
  { id: 'BK-002', name: 'Raj Krishnamurthy', date: '2026-03-29', session: 'Evening', guests: 2, status: 'confirmed', phone: '+91 87654 32109' },
  { id: 'BK-003', name: 'Sarah Mitchell', date: '2026-03-30', session: 'Morning', guests: 4, status: 'confirmed', phone: '+91 76543 21098' },
  { id: 'BK-004', name: 'Anand Rajan', date: '2026-03-30', session: 'Evening', guests: 1, status: 'cancelled', phone: '+91 65432 10987' },
  { id: 'BK-005', name: 'Meera Venkatesh', date: '2026-03-31', session: 'Morning', guests: 5, status: 'confirmed', phone: '+91 54321 09876' },
  { id: 'BK-006', name: 'David Chen', date: '2026-03-31', session: 'Morning', guests: 2, status: 'completed', phone: '+91 43210 98765' },
  { id: 'BK-007', name: 'Lakshmi Narayan', date: '2026-04-01', session: 'Evening', guests: 6, status: 'confirmed', phone: '+91 32109 87654' },
  { id: 'BK-008', name: 'Thomas Wright', date: '2026-04-01', session: 'Morning', guests: 2, status: 'confirmed', phone: '+91 21098 76543' },
];

const statusColors: Record<string, string> = {
  confirmed: 'bg-sanctuary-green/10 text-sanctuary-green border-sanctuary-green/20',
  cancelled: 'bg-error/10 text-error border-error/20',
  completed: 'bg-canopy-dark/10 text-canopy-dark border-canopy-dark/20',
};

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'birdman2026') {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials. Try admin / birdman2026');
    }
  };

  const filteredBookings = mockBookings.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const todayBookings = mockBookings.filter(
    (b) => b.date === '2026-03-29' && b.status === 'confirmed'
  ).length;
  const totalGuests = mockBookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.guests, 0);
  const pendingReminders = mockBookings.filter(
    (b) => b.status === 'confirmed'
  ).length;

  /* ── LOGIN VIEW ──────────────────────────────────────────────────────── */
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-canopy-dark flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-sanctuary-green/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bird className="w-8 h-8 text-sanctuary-green-light" />
            </div>
            <h1 className="font-display font-bold text-2xl text-white">
              Admin Dashboard
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Birdman of Chennai — Booking Management
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-2xl space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Username
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="rounded-xl h-11 bg-white/10 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="rounded-xl h-11 bg-white/10 border-white/10 text-white placeholder:text-white/30"
              />
            </div>

            {loginError && (
              <p className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">
                {loginError}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-sanctuary-green hover:bg-sanctuary-green-light text-white rounded-xl h-12 text-base gap-2"
            >
              <Lock className="w-4 h-4" />
              Sign In
            </Button>
          </form>

          <p className="text-center text-white/30 text-xs mt-6">
            Demo credentials: admin / birdman2026
          </p>
        </motion.div>
      </div>
    );
  }

  /* ── DASHBOARD VIEW ──────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Top bar */}
      <header className="bg-white border-b border-canopy-dark/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bird className="w-6 h-6 text-sanctuary-green" />
            <span className="font-display font-bold text-canopy-dark">
              Admin Dashboard
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLoggedIn(false)}
            className="text-canopy-dark/50 hover:text-canopy-dark gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {[
            {
              icon: Calendar,
              label: "Today's Bookings",
              value: todayBookings,
              color: 'bg-sanctuary-green/10 text-sanctuary-green',
            },
            {
              icon: Users,
              label: 'Total Guests (Active)',
              value: totalGuests,
              color: 'bg-golden-hour/10 text-sunset-amber',
            },
            {
              icon: Bell,
              label: 'Pending Reminders',
              value: pendingReminders,
              color: 'bg-info/10 text-info',
            },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-xl border border-canopy-dark/5"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-canopy-dark">
                    {stat.value}
                  </div>
                  <div className="text-xs text-canopy-dark/50">
                    {stat.label}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-xl border border-canopy-dark/5 overflow-hidden">
          <div className="p-5 border-b border-canopy-dark/5 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <h2 className="font-display font-bold text-lg text-canopy-dark">
              All Bookings
            </h2>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-canopy-dark/30" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 rounded-lg h-9 w-60 text-sm border-canopy-dark/10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-lg border border-canopy-dark/10 px-3 text-sm text-canopy-dark bg-white"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-canopy-dark/[0.02]">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-canopy-dark/40">
                  Booking ID
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-canopy-dark/40">
                  Visitor
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-canopy-dark/40">
                  Date
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-canopy-dark/40">
                  Session
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-canopy-dark/40">
                  Guests
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-canopy-dark/40">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-canopy-dark/40">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking, i) => (
                <motion.tr
                  key={booking.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-canopy-dark/5 hover:bg-morning-mist/50 transition-colors"
                >
                  <TableCell className="text-sm font-mono text-canopy-dark/50">
                    {booking.id}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium text-canopy-dark">
                        {booking.name}
                      </div>
                      <div className="text-xs text-canopy-dark/40">
                        {booking.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-canopy-dark/70">
                    {new Date(booking.date).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-sm text-canopy-dark/70">
                    {booking.session}
                  </TableCell>
                  <TableCell className="text-sm text-canopy-dark/70">
                    {booking.guests}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        statusColors[booking.status]
                      }`}
                    >
                      {booking.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button className="p-1.5 rounded-lg hover:bg-canopy-dark/5 transition-colors text-canopy-dark/30 hover:text-canopy-dark">
                      <Eye className="w-4 h-4" />
                    </button>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>

          {filteredBookings.length === 0 && (
            <div className="py-12 text-center text-canopy-dark/30 text-sm">
              No bookings match your search.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
