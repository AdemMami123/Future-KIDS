import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import StudentSidebar from '@/components/layout/StudentSidebar';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <main className="flex-1 lg:ml-0 overflow-auto">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
