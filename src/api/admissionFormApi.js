import axiosInstance from './axiosInstance';

export const getAdmissionFormTemplate = () => axiosInstance.get('/admission-form/template');
export const saveAdmissionFormTemplate = (template) =>
  axiosInstance.put('/admission-form/template', { template });
