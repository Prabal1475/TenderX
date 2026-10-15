/**
 * Formats Indian Currency into Crores and Lakhs representation.
 * e.g., 25000000 -> "₹2.50 Cr", 4500000 -> "₹45.00 Lakh"
 */
export function formatINR(amount) {
  if (amount === undefined || amount === null) return "₹0";
  const num = Number(amount);
  if (isNaN(num)) return "₹0";

  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} Lakh`;
  } else {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  }
}

/**
 * Formats ISO date string into readable Indian standard format.
 */
export function formatDate(dateString) {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Returns human-readable days left until a deadline.
 */
export function getDaysRemaining(dateString) {
  if (!dateString) return "";
  const diffMs = new Date(dateString) - new Date();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Expired";
  if (diffDays === 0) return "Due Today";
  if (diffDays === 1) return "Due Tomorrow";
  return `${diffDays} days left`;
}

/**
 * Formats file size in bytes into KB or MB.
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 KB";
  const kb = bytes / 1024;
  if (kb >= 1024) {
    return `${(kb / 1024).toFixed(1)} MB`;
  }
  return `${Math.round(kb)} KB`;
}

