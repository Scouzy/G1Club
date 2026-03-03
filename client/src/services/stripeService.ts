import api from '../lib/axios';

export const createCheckoutSession = async (): Promise<string> => {
  const res = await api.post<{ url: string }>('/stripe/create-checkout-session');
  return res.data.url;
};

export const createPortalSession = async (): Promise<string> => {
  const res = await api.get<{ url: string }>('/stripe/portal');
  return res.data.url;
};
