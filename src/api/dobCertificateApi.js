import axiosInstance from './axiosInstance';

export const getDOBCertificateTemplate = () => axiosInstance.get('/dob-certificate/template');
export const saveDOBCertificateTemplate = (template) =>
  axiosInstance.put('/dob-certificate/template', { template });
