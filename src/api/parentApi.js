import axiosInstance from './axiosInstance';

export const getParents = (params) => axiosInstance.get('/parents', { params });
export const getParent = (id) => axiosInstance.get(`/parents/${id}`);
export const getParentByStudent = (studentId) => axiosInstance.get(`/parents/student/${studentId}`);
export const createParent = (data) => axiosInstance.post('/parents', data);
export const updateParent = (id, data) => axiosInstance.put(`/parents/${id}`, data);
export const deleteParent = (id) => axiosInstance.delete(`/parents/${id}`);
