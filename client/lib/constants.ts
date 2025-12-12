// Dietary restriction constants
export const DIETARY_RESTRICTIONS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "gluten-free", label: "Gluten-Free" },
  { value: "dairy-free", label: "Dairy-Free" },
  { value: "nut-free", label: "Nut-Free" },
] as const;

export type DietaryRestrictionValue = typeof DIETARY_RESTRICTIONS[number]["value"];

// Common event tags (dietary + descriptive)
export const COMMON_EVENT_TAGS = [
  ...DIETARY_RESTRICTIONS.map((r) => r.value),
  "warm",
  "cold",
  "sweet",
  "spicy",
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "beverage",
] as const;

// Food categories for events
export const FOOD_CATEGORIES = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "gluten-free", label: "Gluten-Free" },
  { value: "dairy-free", label: "Dairy-Free" },
  { value: "nut-free", label: "Nut-Free" },
  { value: "OTHER", label: "Other" },
] as const;

export const FOOD_CATEGORY_COLORS: Record<string, string> = {
  vegetarian: "#10b981",
  vegan: "#059669",
  halal: "#3b82f6",
  kosher: "#6366f1",
  "gluten-free": "#f59e0b",
  "dairy-free": "#ef4444",
  "nut-free": "#8b5cf6",
  OTHER: "#6b7280",
};

