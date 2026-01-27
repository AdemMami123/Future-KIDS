'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import LanguageSwitcher from './LanguageSwitcher';
import {
  HomeIcon,
  UserGroupIcon,
  ChartBarIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

export default function ParentSidebar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const navItems = [
    {
      label: t('nav.dashboard'),
      href: '/parent/dashboard',
      icon: <HomeIcon />,
    },
    {
      label: t('parent.children.title'),
      href: '/parent/children',
      icon: <UserGroupIcon />,
    },
    {
      label: t('nav.reports'),
      href: '/parent/reports',
      icon: <ChartBarIcon />,
    },
    {
      label: t('nav.notifications'),
      href: '/parent/notifications',
      icon: <BellIcon />,
    },
  ];

  const header = (
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
        {user?.firstName?.[0] || 'P'}
      </div>
      <h3 className="font-semibold text-gray-900 truncate">
        {user?.firstName} {user?.lastName}
      </h3>
      <p className="text-sm text-gray-500">{t('auth.parent')}</p>
    </div>
  );

  const footer = (
    <div className="space-y-2">
      <LanguageSwitcher />
      <button
        onClick={() => router.push('/parent/settings')}
        className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Cog6ToothIcon className="w-5 h-5" />
        <span>{t('common.settings')}</span>
      </button>
      <button
        onClick={handleLogout}
        className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <ArrowRightOnRectangleIcon className="w-5 h-5" />
        <span>{t('common.logout')}</span>
      </button>
    </div>
  );

  return <Sidebar navItems={navItems} header={header} footer={footer} />;
}
