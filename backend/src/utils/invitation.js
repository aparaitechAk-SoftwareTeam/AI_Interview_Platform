import { v4 as uuidv4 } from 'uuid';

export const generateInvitationCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid lookalikes like I, O, 0, 1
  let code1 = '';
  let code2 = '';
  
  for (let i = 0; i < 4; i++) {
    code1 += chars.charAt(Math.floor(Math.random() * chars.length));
    code2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `AIP-${code1}-${code2}`;
};

export const generateLinkToken = () => {
  return uuidv4();
};
