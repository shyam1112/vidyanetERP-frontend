import axiosInstance from './axiosInstance';

export const getStudents = (params) => axiosInstance.get('/students', { params });
export const getStudent = (id) => axiosInstance.get(`/students/${id}`);
export const createStudent = (formData) =>
  axiosInstance.post('/students', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateStudent = (id, formData) =>
  axiosInstance.put(`/students/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteStudent = (id) => axiosInstance.delete(`/students/${id}`);
