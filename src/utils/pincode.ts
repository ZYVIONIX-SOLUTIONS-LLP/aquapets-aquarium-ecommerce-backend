/**
 * Pincode Utility for Backend Order Validation
 * Layer 1: Instant offline validation
 * Layer 2: Online India Post validation with cache
 */

export const ERNAKULAM_BORDER_PINCODES = new Set([
  "686664", // Piravom
  "686662", // Koothattukulam
  "686667", // Pampakkuda
  "686663", // Ramamangalam
  "686668", // Kaloor (Muvattupuzha)
  "686686", // Palakuzha
  "686693", // Oonnukal
  "686567", // Valakom
  "686673", // Memadangu
  "686674", // Onakkoor
]);

const backendPincodeCache = new Map<string, boolean>();

/**
 * Checks if a pincode / address is within the Ernakulam / Kochi local delivery zone
 */
export async function isErnakulamPincode(pincode: string, addressText: string = ""): Promise<boolean> {
  const cleanPin = (pincode || "").trim();

  // Layer 1: Fast offline check
  if (cleanPin.startsWith("682") || cleanPin.startsWith("683") || ERNAKULAM_BORDER_PINCODES.has(cleanPin)) {
    return true;
  }

  // Address keyword check
  const lowerAddr = (addressText || "").toLowerCase();
  if (lowerAddr.includes("ernakulam") || lowerAddr.includes("kochi")) {
    return true;
  }

  // Layer 2: Cached or online India Post verification
  if (/^\d{6}$/.test(cleanPin)) {
    if (backendPincodeCache.has(cleanPin)) {
      return backendPincodeCache.get(cleanPin)!;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: any = await res.json();
        if (Array.isArray(data) && data[0]?.Status === "Success") {
          const district = data[0].PostOffice?.[0]?.District?.toLowerCase() || "";
          const isErn = district.includes("ernakulam");
          backendPincodeCache.set(cleanPin, isErn);
          return isErn;
        }
      }
    } catch {
      // Ignore API errors, fallback to false
    }
  }

  return false;
}
