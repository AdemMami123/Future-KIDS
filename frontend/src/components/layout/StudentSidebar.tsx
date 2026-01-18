'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import {
  HomeIcon,
  RocketLaunchIcon,
  ClockIcon,
  TrophyIcon,
  AcademicCapIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

export default function StudentSidebar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: '/student/dashboard',
      icon: <HomeIcon />,
    },
    {
      label: 'Join Game',
      href: '/student/join',
      icon: <RocketLaunchIcon />,
    },
    {
      label: 'Quizzes',
      href: '/student/quizzes',
      icon: <AcademicCapIcon />,
    },
    {
      label: 'History',
      href: '/student/history',
      icon: <ClockIcon />,
    },
    {
      label: 'Achievements',
      href: '/student/achievements',
      icon: <TrophyIcon />,
    },
  ];

  const header = (
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
        {user?.firstName?.[0] || 'S'}
      </div>
      <h3 className="font-semibold text-gray-900 truncate">
        {user?.firstName} {user?.lastName}
      </h3>
      <p className="text-sm text-gray-500">Student</p>
    </div>
  );

  const footer = (
    <div className="space-y-2">
      <button
        onClick={() => router.push('/student/settings')}
        className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Cog6ToothIcon className="w-5 h-5" />
        <span>Settings</span>
      </button>
      <button
        onClick={handleLogout}
        className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <ArrowRightOnRectangleIcon className="w-5 h-5" />
        <span>Logout</span>
      </button>
    </div>
  );

  return <Sidebar navItems={navItems} header={header} footer={footer} />;
}
