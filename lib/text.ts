/**
 * The site never shows dash punctuation (a house rule). AI output sometimes
 * slips one in, so generated text is tidied before a student sees it:
 * an en or em dash between numbers becomes a hyphen (a range, "5-10"), any
 * other en or em dash becomes a comma, and a spaced hyphen between two words
 * ("public policy - such as") becomes a comma. A spaced hyphen next to a
 * digit or symbol is left alone, since that is subtraction ("$120,000 - $45,000").
 */
export function tidyDashes(s: string): string {
  return s
    .replace(/(\d)\s*[–—]\s*(\d)/g, "$1-$2")
    .replace(/\s*[–—]\s*/g, ", ")
    .replace(/([A-Za-z)])\s+-\s+([A-Za-z(])/g, "$1, $2")
    .replace(/,\s*,/g, ",");
}

/** Applies tidyDashes to a practice question's visible text. */
export function tidyQuestion<T extends { question: string; options: Record<string, string>; explanation?: string }>(q: T): T {
  return {
    ...q,
    question: tidyDashes(q.question),
    options: Object.fromEntries(Object.entries(q.options).map(([k, v]) => [k, tidyDashes(v)])) as T["options"],
    ...(typeof q.explanation === "string" ? { explanation: tidyDashes(q.explanation) } : {}),
  };
}
