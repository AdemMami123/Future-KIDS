import api from './api';

export interface ParentChildLink {
  linkId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: any;
  approvedAt?: any;
  rejectedAt?: any;
  parent: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  } | null;
  child: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    grade?: number;
    avatarUrl?: string;
  } | null;
}

export interface ChildInfo {
  linkId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  grade?: number;
  avatarUrl?: string;
  linkedAt: any;
}

export interface ParentInfo {
  linkId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  linkedAt: any;
}

/**
 * Create a parent-child link request
 */
export const createLinkRequest = async (data: {
  childEmail?: string;
  childId?: string;
}): Promise<ParentChildLink> => {
  const response = await api.post('/parent-child/request', data);
  return response.data.data;
};

/**
 * Get pending link requests
 */
export const getPendingRequests = async (): Promise<ParentChildLink[]> => {
  const response = await api.get('/parent-child/pending');
  return response.data.data;
};

/**
 * Approve a link request
 */
export const approveLinkRequest = async (linkId: string): Promise<ParentChildLink> => {
  const response = await api.post(`/parent-child/approve/${linkId}`);
  return response.data.data;
};

/**
 * Reject a link request
 */
export const rejectLinkRequest = async (linkId: string): Promise<void> => {
  await api.post(`/parent-child/reject/${linkId}`);
};

/**
 * Remove an approved link
 */
export const removeLink = async (linkId: string): Promise<void> => {
  await api.delete(`/parent-child/remove/${linkId}`);
};

/**
 * Get all children for parent
 */
export const getChildren = async (): Promise<ChildInfo[]> => {
  const response = await api.get('/parent-child/children');
  return response.data;
};

/**
 * Get all parents for student
 */
export const getParents = async (): Promise<ParentInfo[]> => {
  const response = await api.get('/parent-child/parents');
  console.log('getParents response:', response);
  console.log('response.data:', response.data);
  return response.data;
};

/**
 * Get link details
 */
export const getLinkDetails = async (linkId: string): Promise<ParentChildLink> => {
  const response = await api.get(`/parent-child/${linkId}`);
  return response.data.data;
};
