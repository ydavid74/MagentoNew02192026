export const METAL_TYPES = [
  "14KT Yellow Gold",
  "18KT Yellow Gold",
  "14KT White Gold",
  "18KT White Gold",
  "14KT Rose Gold",
  "18KT Rose Gold",
  "Platinum",
  "Silver",
  "Rose Gold",
  "Palladium",
  "Titanium",
  "Stainless Steel",
] as const;

export type MetalType = (typeof METAL_TYPES)[number];

export function getMetalTypeColor(metalType: string): string {
  switch (metalType.toLowerCase()) {
    case "14kt yellow gold":
    case "18kt yellow gold":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "14kt white gold":
    case "18kt white gold":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "platinum":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "silver":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "14kt rose gold":
    case "18kt rose gold":
    case "rose gold":
      return "bg-pink-100 text-pink-800 border-pink-200";
    case "palladium":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "titanium":
      return "bg-slate-100 text-slate-800 border-slate-200";
    case "stainless steel":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}
