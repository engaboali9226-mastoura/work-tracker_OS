/** R163: only a registered category is a valid definition-editor choice. */
export function noorCategoryOptions(categories: readonly string[], savedCategory?: string): string[] {
  const values = [...categories, ...(savedCategory ? [savedCategory] : [])];
  return [...new Set(values.filter(value => typeof value === "string" && value.trim().length > 0))];
}
export function noorExistingCategory(value: string, options: readonly string[]): boolean {
  return value.length > 0 && options.includes(value);
}
export type NoorCategoryProposal =
  | { kind: "invalid"; message: string }
  | { kind: "existing"; value: string }
  | { kind: "new"; value: string };
export function noorProposeCategory(input: string, options: readonly string[]): NoorCategoryProposal {
  const containsControl = /[\u0000-\u001f\u007f]/u.test(input);
  const value = input.normalize("NFC").trim().replace(/\s+/gu, " ");
  if (containsControl || !value || value.length > 60) {
    return { kind: "invalid", message: "اكتب اسم تصنيف صالحًا لا يزيد على 60 حرفًا." };
  }
  const existing = options.find(option => option.normalize("NFC").trim().replace(/\s+/gu, " ").toLocaleLowerCase("ar") === value.toLocaleLowerCase("ar"));
  if (existing) return { kind: "existing", value: existing };
  return { kind: "new", value };
}
