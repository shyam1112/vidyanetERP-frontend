import axiosInstance from './axiosInstance';

export const getTeam = () => axiosInstance.get('/team');
export const addMember = (data) => axiosInstance.post('/team', data);
export const updateMember = (id, data) => axiosInstance.put(`/team/${id}`, data);
export const resetMemberPassword = (id, password) => axiosInstance.put(`/team/${id}/reset-password`, { password });
export const deleteMember = (id) => axiosInstance.delete(`/team/${id}`);
