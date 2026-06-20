import axiosInstance from './axiosInstance';

export const sendWhatsAppBulk = (recipients, templateName, langCode) =>
  axiosInstance.post('/whatsapp/send', { recipients, templateName, langCode });
