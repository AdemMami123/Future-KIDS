import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ParentSidebar from '@/components/layout/ParentSidebar';

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['parent']}>
      <div className="flex min-h-screen bg-gray-50">
        <ParentSidebar />
        <main className="flex-1 lg:ml-0 overflow-auto">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
