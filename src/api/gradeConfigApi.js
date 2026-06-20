import axiosInstance from './axiosInstance';

export const getGradeConfig = () => axiosInstance.get('/grade-config');
export const saveGradeConfig = (data) => axiosInstance.put('/grade-config', data);
