import axiosInstance from './axiosInstance';

export const getLeavingCertificateTemplate = () => axiosInstance.get('/leaving-certificate/template');
export const saveLeavingCertificateTemplate = (template) =>
  axiosInstance.put('/leaving-certificate/template', { template });
