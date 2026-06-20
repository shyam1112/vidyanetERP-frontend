import axiosInstance from './axiosInstance';

export const getMarks = (params) => axiosInstance.get('/marks', { params });
export const getMark = (id) => axiosInstance.get(`/marks/${id}`);
export const getStudentMarks = (studentId) => axiosInstance.get(`/marks/student/${studentId}`);
export const getClassReport = (params) => axiosInstance.get('/marks/class-report', { params });
export const createMarks = (data) => axiosInstance.post('/marks', data);
export const updateMarks = (id, data) => axiosInstance.put(`/marks/${id}`, data);
export const deleteMarks = (id) => axiosInstance.delete(`/marks/${id}`);
export const getUsedExamTypes = () => axiosInstance.get('/marks/used-exam-types');
