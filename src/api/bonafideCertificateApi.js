import axiosInstance from './axiosInstance';

export const getBonafideCertificateTemplate = () => axiosInstance.get('/bonafide-certificate/template');
export const saveBonafideCertificateTemplate = (template) =>
  axiosInstance.put('/bonafide-certificate/template', { template });
