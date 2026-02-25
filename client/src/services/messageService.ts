import api from '../lib/axios';

export interface UserBasic {
    id: string;
    name: string;
    role: string;
    email?: string;
}

export interface CategoryBasic {
    id: string;
    name: string;
}

export interface TeamBasic {
    id: string;
    name: string;
    categoryId: string;
    category?: CategoryBasic;
}

export interface Message {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    receiverId?: string | null;
    categoryId?: string | null;
    teamId?: string | null;
    sender: UserBasic;
    receiver?: UserBasic | null;
    category?: CategoryBasic | null;
    team?: TeamBasic | null;
}

export interface Conversation {
    contact: UserBasic;
    lastMessage: Message;
}

export interface CoachContact {
    id: string;
    userId: string;
    user: UserBasic;
    categories: CategoryBasic[];
}

export interface SportifContact {
    id: string;
    userId: string;
    user: UserBasic;
    category: CategoryBasic;
}

export interface ContactsData {
    coaches: CoachContact[];
    admins: UserBasic[];
    sportifs: SportifContact[];
    categories: CategoryBasic[];
    teams: TeamBasic[];
}

export const getConversations = async () => {
    const response = await api.get<Conversation[]>('/messages/conversations');
    return response.data;
};

export const getMessages = async (userId: string) => {
    const response = await api.get<Message[]>(`/messages/${userId}`);
    return response.data;
};

export const sendMessage = async (receiverId: string, content: string) => {
    const response = await api.post<Message>('/messages', { receiverId, content });
    return response.data;
};

export const getContacts = async () => {
    const response = await api.get<ContactsData>('/messages/contacts');
    return response.data;
};

export const getCategoryMessages = async (categoryId: string) => {
    const response = await api.get<Message[]>(`/messages/category/${categoryId}`);
    return response.data;
};

export const sendCategoryMessage = async (categoryId: string, content: string) => {
    const response = await api.post<Message>(`/messages/category/${categoryId}`, { content });
    return response.data;
};

export const getTeamMessages = async (teamId: string) => {
    const response = await api.get<Message[]>(`/messages/team/${teamId}`);
    return response.data;
};

export const sendTeamMessage = async (teamId: string, content: string) => {
    const response = await api.post<Message>(`/messages/team/${teamId}`, { content });
    return response.data;
};
