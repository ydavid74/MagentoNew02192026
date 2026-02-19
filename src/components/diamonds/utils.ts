// Constants for diamond search and display
export const shapes = ["Round", "Princess", "Oval", "Emerald", "Pear", "Marquise", "Cushion", "Radiant"];
export const caratRanges = ["0.5-1.0", "1.0-1.5", "1.5-2.0", "2.0-3.0", "3.0+"];
export const colors = ["D", "E", "F", "G", "H", "I", "J", "K"];
export const clarities = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2"];
export const sortOptions = ["Price: Low to High", "Price: High to Low", "Carat: Low to High", "Carat: High to Low", "Date Added"];
export const priceRanges = ["$0-$1000", "$1000-$5000", "$5000-$10000", "$10000-$25000", "$25000+"];

// Helper functions
export const getStatusColor = (daysActive: number): string => {
  if (daysActive <= 20) return "bg-yellow-100 text-gray-900";
  if (daysActive <= 45) return "bg-white text-gray-900";
  if (daysActive <= 120) return "bg-blue-100 text-gray-900";
  return "bg-red-100 text-gray-900";
};

export const getHoverColor = (daysActive: number): string => {
  if (daysActive <= 20) return "hover:bg-yellow-200";
  if (daysActive <= 45) return "hover:bg-gray-200";
  if (daysActive <= 120) return "hover:bg-blue-200";
  return "hover:bg-red-200";
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatNumber = (num: number, decimals: number = 2): string => {
  return Number(num).toFixed(decimals);
};
