'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, User } from 'lucide-react';
import { ChildInfo } from '@/lib/parentApi';

interface ChildSelectorProps {
  children: ChildInfo[];
  selectedChildId: string | null;
  onSelectChild: (childId: string) => void;
  loading?: boolean;
}

export default function ChildSelector({
  children,
  selectedChildId,
  onSelectChild,
  loading = false,
}: ChildSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedChild = children.find((c) => c.childId === selectedChildId);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-yellow-800 text-sm">
          No children linked yet. Link a child from the Parent-Child Linking
          section.
        </p>
      </div>
    );
  }

  if (children.length === 1) {
    const child = children[0];
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center">
          {child.avatarUrl ? (
            <img
              src={child.avatarUrl}
              alt={`${child.firstName} ${child.lastName}`}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="ml-4">
            <h3 className="font-semibold text-gray-900">
              {child.firstName} {child.lastName}
            </h3>
            <p className="text-sm text-gray-500">
              {child.grade && `Grade ${child.grade}`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow"
      >
        <div className="flex items-center">
          {selectedChild?.avatarUrl ? (
            <img
              src={selectedChild.avatarUrl}
              alt={`${selectedChild.firstName} ${selectedChild.lastName}`}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="ml-4 text-left">
            <h3 className="font-semibold text-gray-900">
              {selectedChild
                ? `${selectedChild.firstName} ${selectedChild.lastName}`
                : 'Select a child'}
            </h3>
            {selectedChild?.grade && (
              <p className="text-sm text-gray-500">Grade {selectedChild.grade}</p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden"
          >
            {children.map((child) => (
              <button
                key={child.childId}
                onClick={() => {
                  onSelectChild(child.childId);
                  setIsOpen(false);
                }}
                className={`w-full p-4 flex items-center hover:bg-gray-50 transition-colors ${
                  child.childId === selectedChildId ? 'bg-purple-50' : ''
                }`}
              >
                {child.avatarUrl ? (
                  <img
                    src={child.avatarUrl}
                    alt={`${child.firstName} ${child.lastName}`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="ml-3 text-left">
                  <p className="font-medium text-gray-900">
                    {child.firstName} {child.lastName}
                  </p>
                  {child.grade && (
                    <p className="text-sm text-gray-500">Grade {child.grade}</p>
                  )}
                </div>
                {child.childId === selectedChildId && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-purple-600"></div>
                )}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}
