import api from '../lib/axios';

export interface Group {
  id: string;
  name: string;
  clubId: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  members: GroupMember[];
  _count?: { messages: number };
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  joinedAt: string;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export const getGroups = () => api.get<Group[]>('/groups').then(r => r.data);

export const createGroup = (name: string, memberIds: string[]) =>
  api.post<Group>('/groups', { name, memberIds }).then(r => r.data);

export const updateGroup = (id: string, name: string) =>
  api.patch<Group>(`/groups/${id}`, { name }).then(r => r.data);

export const deleteGroup = (id: string) =>
  api.delete(`/groups/${id}`).then(r => r.data);

export const addMember = (groupId: string, userId: string) =>
  api.post(`/groups/${groupId}/members`, { userId }).then(r => r.data);

export const removeMember = (groupId: string, userId: string) =>
  api.delete(`/groups/${groupId}/members/${userId}`).then(r => r.data);

export const getGroupMessages = (groupId: string) =>
  api.get<GroupMessage[]>(`/groups/${groupId}/messages`).then(r => r.data);

export const sendGroupMessage = (groupId: string, content: string) =>
  api.post<GroupMessage>(`/groups/${groupId}/messages`, { content }).then(r => r.data);
