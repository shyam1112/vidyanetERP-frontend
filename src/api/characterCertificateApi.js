import axiosInstance from './axiosInstance';

export const getCharacterCertificateTemplate = () => axiosInstance.get('/character-certificate/template');
export const saveCharacterCertificateTemplate = (template) =>
  axiosInstance.put('/character-certificate/template', { template });
