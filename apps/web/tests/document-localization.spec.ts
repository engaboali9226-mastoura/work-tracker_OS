import assert from "node:assert/strict";
import test from "node:test";

import {
  JSDOM,
} from "jsdom";

import {
  applyDocumentLocalization,
  resolveDocumentLocalization,
} from "../src/document-localization.js";

test(
  "English and unsupported languages resolve deterministically to en and ltr",
  () => {
    for (
      const input
      of [
        "en",
        "en-GB",
        "fr",
        "",
        undefined,
      ]
    ) {
      assert.deepEqual(
        resolveDocumentLocalization(
          input,
        ),
        {
          language:
            "en",
          direction:
            "ltr",
        },
      );
    }
  },
);

test(
  "Arabic input applies ar and rtl at the document boundary",
  () => {
    const dom =
      new JSDOM(
        "<!doctype html><html><body></body></html>",
        {
          url:
            "https://shell.noor.test/",
        },
      );

    try {
      const localization =
        applyDocumentLocalization(
          dom.window.document,
          "ar-SA",
        );

      assert.deepEqual(
        localization,
        {
          language:
            "ar",
          direction:
            "rtl",
        },
      );

      assert.equal(
        dom.window.document.documentElement.lang,
        "ar",
      );

      assert.equal(
        dom.window.document.documentElement.dir,
        "rtl",
      );
    } finally {
      dom.window.close();
    }
  },
);
