import axiosInstance from './axiosInstance';

export const getExamTypes = () => axiosInstance.get('/exam-types');
export const createExamType = (name) => axiosInstance.post('/exam-types', { name });
