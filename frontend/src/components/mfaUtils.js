// Generate mock TOTP secret
export const generateSecret = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
};

// Generate mock backup codes
export const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
                 Math.random().toString(36).substring(2, 6).toUpperCase();
    codes.push({ code, used: false });
  }
  return codes;
};

// Mock TOTP verification (in production, this would verify against actual TOTP)
export const verifyTOTP = (code) => {
  // Accept any 6-digit code for mock purposes
  return /^\d{6}$/.test(code);
};

// Format secret for display (groups of 4)
export const formatSecret = (secret) => {
  return secret?.match(/.{1,4}/g)?.join(' ') || '';
};
