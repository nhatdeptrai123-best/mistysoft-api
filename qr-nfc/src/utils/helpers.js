import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';

// Hash password
export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Compare password
export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Generate unique QR code
export function generateQRCode() {
  return uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
}

// Generate QR image
export async function generateQRImage(code, url) {
  try {
    const qrData = `${url}/${code}`;
    return await QRCode.toDataURL(qrData);
  } catch (error) {
    console.error('Error generating QR image:', error);
    return null;
  }
}
