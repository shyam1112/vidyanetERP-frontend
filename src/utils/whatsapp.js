/**
 * Send a WhatsApp message to a phone number.
 * Replace this implementation with your actual WhatsApp sending code.
 *
 * @param {string} phone  - recipient phone number (with country code, e.g. "919876543210")
 * @param {string} message - message text
 */
export function sendWhatsAppMessage(phone, message) {
  // TODO: replace with your WhatsApp API integration
  const cleaned = phone.replace(/\D/g, '');
  const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

/**
 * Format a phone number to include country code.
 * Defaults to India (+91) if no country code present.
 */
export function formatPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}
