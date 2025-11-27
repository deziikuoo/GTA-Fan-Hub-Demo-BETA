// Email validation utilities for server-side validation
import { randomBytes } from 'crypto';

/**
 * Basic email format validation using regex
 * @param {string} email - Email address to validate
 * @returns {boolean}
 */
export function isValidEmailFormat(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Comprehensive email regex pattern
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  // Check length
  if (email.length > 254) {
    return false;
  }
  
  return emailRegex.test(email);
}

/**
 * List of known disposable email domains
 * Expand this list as needed
 */
const disposableDomains = new Set([
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'guerrillamail.org',
  'mailinator.com',
  'maildrop.cc',
  'fakeinbox.com',
  'throwaway.email',
  'yopmail.com',
  'tempail.com',
  'emailondeck.com',
  'trashmail.com',
  'sharklasers.com',
  'grr.la',
  'guerrillamail.info',
  'guerrillamail.biz',
  'guerrillamail.de',
  'spam4.me',
  'getairmail.com',
  'mohmal.com',
  'temp.pm',
  'getnada.com',
  'tempmailo.com',
  'emailfake.com',
  'fakemailgenerator.com',
  'dispostable.com',
  'mailnesia.com',
  'mailcatch.com',
  'mytrashmail.com',
]);

/**
 * Check if email uses a disposable/temporary email service
 * @param {string} email - Email address to check
 * @returns {boolean} - True if disposable, false if legitimate
 */
export function isDisposableEmail(email) {
  if (!email) return false;
  
  const domain = email.toLowerCase().split('@')[1];
  return disposableDomains.has(domain);
}

/**
 * List of common role-based email prefixes
 * These are often not personal emails and may not be ideal for newsletters
 */
const roleBasedPrefixes = [
  'admin',
  'administrator',
  'info',
  'support',
  'help',
  'contact',
  'sales',
  'marketing',
  'noreply',
  'no-reply',
  'no_reply',
  'webmaster',
  'hostmaster',
  'postmaster',
  'abuse',
  'security',
  'team',
  'hello',
  'office',
  'billing',
  'jobs',
  'careers',
  'hr',
  'press',
  'media',
  'feedback',
];

/**
 * Check if email is a role-based/generic address
 * @param {string} email - Email address to check
 * @returns {boolean} - True if role-based, false if personal
 */
export function isRoleBasedEmail(email) {
  if (!email) return false;
  
  const localPart = email.toLowerCase().split('@')[0];
  return roleBasedPrefixes.some(prefix => localPart === prefix || localPart.startsWith(prefix + '.') || localPart.startsWith(prefix + '_') || localPart.startsWith(prefix + '+'));
}

/**
 * Sanitize email address
 * @param {string} email - Email address to sanitize
 * @returns {string} - Sanitized email
 */
export function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  return email.toLowerCase().trim();
}

/**
 * Comprehensive email validation
 * @param {string} email - Email address to validate
 * @returns {{valid: boolean, reason?: string}}
 */
export function validateEmail(email) {
  // Sanitize first
  const sanitized = sanitizeEmail(email);
  
  if (!sanitized) {
    return { valid: false, reason: 'Email address is required' };
  }
  
  // Check format
  if (!isValidEmailFormat(sanitized)) {
    return { valid: false, reason: 'Invalid email format' };
  }
  
  // Check for disposable email
  if (isDisposableEmail(sanitized)) {
    return { valid: false, reason: 'Disposable email addresses are not allowed' };
  }
  
  // Check for role-based email (warning, not blocking)
  // We'll allow these but could flag them if needed
  // if (isRoleBasedEmail(sanitized)) {
  //   return { valid: false, reason: 'Please use a personal email address' };
  // }
  
  return { valid: true };
}

/**
 * Generate a secure random token
 * @param {number} bytes - Number of random bytes (default: 32)
 * @returns {string} - Hex-encoded token
 */
export function generateToken(bytes = 32) {
  // Use Node.js crypto module for serverless environment
  return randomBytes(bytes).toString('hex');
}

/**
 * Check if a confirmation token has expired
 * @param {Date} subscribedAt - When the subscription was created
 * @param {number} expiryDays - Number of days until expiry (default: 7)
 * @returns {boolean} - True if expired
 */
export function isTokenExpired(subscribedAt, expiryDays = 7) {
  if (!subscribedAt) return true;
  
  const expiryTime = expiryDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds
  const now = Date.now();
  const subscriptionTime = new Date(subscribedAt).getTime();
  
  return (now - subscriptionTime) > expiryTime;
}

