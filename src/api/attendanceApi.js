import axiosInstance from './axiosInstance';

export const getAttendanceByDate  = (params) => axiosInstance.get('/attendance', { params });
export const saveAttendance       = (data)   => axiosInstance.post('/attendance', data);
export const getClassReport       = (params) => axiosInstance.get('/attendance/report', { params });
export const getOverview          = (params) => axiosInstance.get('/attendance/overview', { params });
export const getStudentAttendance = (studentId, params) => axiosInstance.get(`/attendance/student/${studentId}`, { params });
