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

