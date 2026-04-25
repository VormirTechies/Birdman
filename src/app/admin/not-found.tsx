import { redirect } from 'next/navigation';

export default function AdminNotFound() {
  // Immediately redirect to admin dashboard for any unknown admin routes
  redirect('/admin');
}
