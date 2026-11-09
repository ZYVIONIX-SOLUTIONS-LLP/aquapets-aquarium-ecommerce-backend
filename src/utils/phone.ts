/**
 * Phone Number Validation Utility for Aqua Pets Aquarium
 * 
 * Rules for Mobile Numbers:
 * - Optional when isRequired is false (returns isValid: true, cleanPhone: undefined if empty)
 * - When provided:
 *   - Strips non-digits, country code (+91 / 91 for 12-digit format), and leading 0 (for 11-digit format)
 *   - Must be exactly 10 digits
 *   - Must start with 6, 7, 8, or 9 (valid Indian mobile series)
 *   - Rejects identical repeating digits (e.g. 0000000000, 1111111111, 9999999999, etc.)
 *   - Rejects 6+ consecutive identical digits (e.g. 9800000001)
 *   - Rejects common dummy sequences (e.g. 9876543210)
 */

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  cleanPhone?: string;
}

export function validatePhoneNumber(
  rawPhone?: string | null,
  isRequired: boolean = false
): PhoneValidationResult {
  // If not provided or empty string
  if (rawPhone === undefined || rawPhone === null) {
    if (isRequired) {
      return { isValid: false, error: "Mobile phone number is required" };
    }
    return { isValid: true, cleanPhone: undefined };
  }

  const trimmed = String(rawPhone).trim();
  if (!trimmed) {
    if (isRequired) {
      return { isValid: false, error: "Mobile phone number is required" };
    }
    return { isValid: true, cleanPhone: undefined };
  }

  // Reject strings containing alphabetic letters
  if (/[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, error: "Phone number cannot contain letters" };
  }

  // Extract numerical digits only
  let digits = trimmed.replace(/\D/g, "");

  // Normalize international country code (+91 or 91 with 12 digits total)
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }
  // Normalize trunk prefix 0 (11 digits total)
  else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // Check digit count
  if (digits.length < 10) {
    return {
      isValid: false,
      error: `Phone number is too short (${digits.length} digits). It must be exactly 10 digits.`,
    };
  }

  if (digits.length > 10) {
    return {
      isValid: false,
      error: `Phone number is too long (${digits.length} digits). It must be exactly 10 digits.`,
    };
  }

  // Must start with valid Indian mobile operator prefix (6, 7, 8, or 9)
  if (!/^[6-9]/.test(digits)) {
    return {
      isValid: false,
      error: "Please enter a valid mobile number starting with 6, 7, 8, or 9 (numbers starting with 0, 1, 2, 3, 4, 5 are invalid).",
    };
  }

  // Reject all identical repeating digits (e.g. 0000000000, 1111111111, 9999999999, 8888888888)
  if (/^(\d)\1{9}$/.test(digits)) {
    return {
      isValid: false,
      error: "Invalid phone number: repetitive digits (e.g. 0000000000, 1111111111, 9999999999) are not allowed.",
    };
  }

  // Reject 6 or more consecutive identical digits
  if (/(\d)\1{5,}/.test(digits)) {
    return {
      isValid: false,
      error: "Please enter a genuine, active mobile phone number.",
    };
  }

  // Reject obvious dummy/test sequences
  const fakeSequences = ["9876543210", "6789012345", "7890123456", "8901234567", "9876501234", "9123456780"];
  if (fakeSequences.includes(digits)) {
    return {
      isValid: false,
      error: "Please enter a real mobile number. Dummy test numbers are not permitted.",
    };
  }

  return { isValid: true, cleanPhone: digits };
}
