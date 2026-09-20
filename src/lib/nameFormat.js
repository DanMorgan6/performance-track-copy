// Title-cases a person or clinic name so every word starts with a capital letter.
//   "collette morgan" -> "Collette Morgan"
//   "o'brien" -> "O'Brien"
//   "anne-marie smith" -> "Anne-Marie Smith"
//   "beaches health ltd" -> "Beaches Health Ltd"
export function titleCaseName(name) {
  if (!name || typeof name !== 'string') return name;
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  return trimmed
    .toLowerCase()
    .replace(/(^|[\s'-])([a-z])/g, (_match, sep, ch) => sep + ch.toUpperCase());
}