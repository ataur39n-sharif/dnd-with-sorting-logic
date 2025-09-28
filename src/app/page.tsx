'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Toaster } from 'sonner';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardLayout />
      <Toaster position="top-right" />
    </div>
  );
}
