'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ParentChildLink,
  approveLinkRequest,
  rejectLinkRequest,
} from '@/lib/parentChildApi';
import { User, Mail, Check, X, Clock } from 'lucide-react';

interface ParentRequestCardProps {
  request: ParentChildLink;
  onHandled: () => void;
}

export default function ParentRequestCard({
  request,
  onHandled,
}: ParentRequestCardProps) {
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(
    null
  );

  const handleApprove = async () => {
    if (
      !confirm(
        `Are you sure you want to approve this link request from ${request.parent?.firstName} ${request.parent?.lastName}? They will be able to view your academic progress.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setActionType('approve');
      await approveLinkRequest(request.linkId);
      onHandled();
    } catch (error: any) {
      alert(
        `Failed to approve request: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  const handleReject = async () => {
    if (
      !confirm(
        `Are you sure you want to reject this link request from ${request.parent?.firstName} ${request.parent?.lastName}?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setActionType('reject');
      await rejectLinkRequest(request.linkId);
      onHandled();
    } catch (error: any) {
      alert(
        `Failed to reject request: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  if (!request.parent) {
    return null;
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden transition-shadow hover:shadow-xl"
    >
      <div className="p-6">
        {/* Header with Badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              Pending Approval
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {new Date(
              request.requestedAt._seconds * 1000
            ).toLocaleDateString()}
          </span>
        </div>

        {/* Parent Info */}
        <div className="flex items-center gap-4 mb-6">
          {request.parent.avatarUrl ? (
            <img
              src={request.parent.avatarUrl}
              alt={`${request.parent.firstName} ${request.parent.lastName}`}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">
                {request.parent.firstName[0]}
                {request.parent.lastName[0]}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">
              {request.parent.firstName} {request.parent.lastName}
            </h3>
            <div className="flex items-center gap-2 text-gray-600 mt-1">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{request.parent.email}</span>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
          <p className="text-gray-700">
            <span className="font-semibold">
              {request.parent.firstName} {request.parent.lastName}
            </span>{' '}
            wants to link to your account to monitor your academic progress. If
            you approve, they will be able to view your assignments, grades, and
            overall performance.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && actionType === 'reject' ? (
              <>
                <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <X className="w-5 h-5" />
                Reject
              </>
            )}
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && actionType === 'approve' ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Approve
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
