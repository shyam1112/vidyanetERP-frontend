import axiosInstance from './axiosInstance';

export const getFees = (params) => axiosInstance.get('/fees', { params });
export const getFee = (id) => axiosInstance.get(`/fees/${id}`);
export const getStudentFees = (studentId) => axiosInstance.get(`/fees/student/${studentId}`);
export const getFeesSummary = (params) => axiosInstance.get('/fees/summary', { params });
export const getFeesChartData = (params) => axiosInstance.get('/fees/chart-data', { params });
export const createFee = (data) => axiosInstance.post('/fees', data);
export const updateFee = (id, data) => axiosInstance.put(`/fees/${id}`, data);
export const deleteFee = (id) => axiosInstance.delete(`/fees/${id}`);

// Payment installments
export const addPayment = (feeId, data) => axiosInstance.post(`/fees/${feeId}/payments`, data);
export const deletePayment = (feeId, paymentId) => axiosInstance.delete(`/fees/${feeId}/payments/${paymentId}`);
