const crypto = require('crypto');
require('dotenv').config();

// AES-256-CBC algorithm
const algorithm = 'aes-256-cbc';

// 32-byte key from environment (must be hex-encoded)
const secretKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

// 🔐 Encrypt vote data
function encryptVote(data) {
  const iv = crypto.randomBytes(16); // 🔁 generate a new IV per encryption
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    iv: iv.toString('hex'),
    data: encrypted
  };
}

// 🔓 Decrypt vote data
function decryptVote(encrypted) {
  const decipher = crypto.createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(encrypted.iv, 'hex')
  );
  let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}

module.exports = { encryptVote, decryptVote };
