export interface PriceRange {
  min: number;
  max: number;
  label: string;
  tag: string;
  color: string;
}

export const priceRanges: PriceRange[] = [
  {
    min: 500,
    max: 1000,
    label: "₹500 - ₹1,000",
    tag: "Budget Pick",
    color: "bg-green-100 text-green-700 border-green-200"
  },
  {
    min: 1000,
    max: 2000,
    label: "₹1,000 - ₹2,000",
    tag: "Mid-Range",
    color: "bg-blue-100 text-blue-700 border-blue-200"
  },
  {
    min: 2000,
    max: 3000,
    label: "₹2,000 - ₹3,000",
    tag: "Premium",
    color: "bg-purple-100 text-purple-700 border-purple-200"
  },
  {
    min: 3000,
    max: 4000,
    label: "₹3,000 - ₹4,000",
    tag: "Luxury",
    color: "bg-orange-100 text-orange-700 border-orange-200"
  },
  {
    min: 4000,
    max: 10000,
    label: "₹4,000+",
    tag: "Ultra Luxury",
    color: "bg-pink-100 text-pink-700 border-pink-200"
  }
];

export const getPriceRangeInfo = (price: number): PriceRange => {
  return priceRanges.find(range => price >= range.min && price <= range.max) || priceRanges[priceRanges.length - 1];
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);
};