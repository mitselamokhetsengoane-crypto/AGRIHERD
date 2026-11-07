// Format currency (e.g., M 45,000.00)
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'M 0.00';
  return new Intl.NumberFormat('en-LS', {
    style: 'currency',
    currency: 'LSL', // Lesotho Loti
    minimumFractionDigits: 2,
  }).format(amount).replace('LSL', 'M'); // Adjust symbol if needed
};

// Format dates (e.g., 20 August 2026)
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-GB', options);
};

// Capitalize first letter of a string
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Truncate text for tables/cards
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Get status color for badges
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'healthy':
    case 'completed':
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'pending':
    case 'growing':
      return 'bg-yellow-100 text-yellow-800';
    case 'sick':
    case 'low stock':
    case 'error':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};