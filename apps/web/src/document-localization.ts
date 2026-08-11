export type DocumentLanguage =
  "en" | "ar";

export type DocumentDirection =
  "ltr" | "rtl";

export type DocumentLocalization =
Readonly<{
  language:
    DocumentLanguage;
  direction:
    DocumentDirection;
}>;

const ENGLISH_LOCALIZATION:
DocumentLocalization =
  Object.freeze({
    language:
      "en",
    direction:
      "ltr",
  });

const ARABIC_LOCALIZATION:
DocumentLocalization =
  Object.freeze({
    language:
      "ar",
    direction:
      "rtl",
  });

export function resolveDocumentLocalization(
  language: string | null | undefined,
): DocumentLocalization {
  const primaryLanguage =
    language
      ?.trim()
      .toLowerCase()
      .split(
        /[-_]/u,
        1,
      )[0];

  return primaryLanguage === "ar"
    ? ARABIC_LOCALIZATION
    : ENGLISH_LOCALIZATION;
}

export function applyDocumentLocalization(
  targetDocument: Document,
  language: string | null | undefined,
): DocumentLocalization {
  const localization =
    resolveDocumentLocalization(
      language,
    );

  targetDocument.documentElement.lang =
    localization.language;

  targetDocument.documentElement.dir =
    localization.direction;

  return localization;
}
