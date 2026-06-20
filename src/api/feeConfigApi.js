import axiosInstance from './axiosInstance';

export const getAllFeeConfigs = (params) => axiosInstance.get('/fee-config', { params });
export const getFeeConfigByClass = (cls, params) => axiosInstance.get(`/fee-config/class/${cls}`, { params });
export const saveFeeConfig = (cls, data) => axiosInstance.put(`/fee-config/class/${cls}`, data);
export const deleteFeeConfig = (cls, params) => axiosInstance.delete(`/fee-config/class/${cls}`, { params });
