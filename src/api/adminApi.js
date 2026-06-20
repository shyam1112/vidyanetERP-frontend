import axiosInstance from './axiosInstance';

export const getRegistrations = (params) => axiosInstance.get('/admin/registrations', { params });
export const getRegistration = (id) => axiosInstance.get(`/admin/registrations/${id}`);
export const getRegistrationSummary = () => axiosInstance.get('/admin/registrations/summary');
export const approveRegistration = (id) => axiosInstance.put(`/admin/registrations/${id}/approve`);
export const rejectRegistration = (id, reason) => axiosInstance.put(`/admin/registrations/${id}/reject`, { reason });
