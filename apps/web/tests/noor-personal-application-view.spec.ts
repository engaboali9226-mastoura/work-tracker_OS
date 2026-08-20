import assert from "node:assert/strict";
import test from "node:test";

import {
  createElement,
} from "react";
import {
  renderToStaticMarkup,
} from "react-dom/server";

import {
  NoorPersonalApplicationView,
} from "../src/noor-personal-application-view.js";

test(
  "Noor Personal view renders a truthful accessible Today surface without fabricated domain data",
  () => {
    const html =
      renderToStaticMarkup(
        createElement(
          NoorPersonalApplicationView,
        ),
      );

    assert.match(
      html,
      /aria-labelledby="noor-personal-today-title"/u,
    );

    assert.match(
      html,
      /<h1 id="noor-personal-today-title">Today<\/h1>/u,
    );

    assert.match(
      html,
      /Noor Personal application is connected/u,
    );

    assert.match(
      html,
      /Today data is not available yet/u,
    );

    assert.doesNotMatch(
      html,
      /\d{4}-\d{2}-\d{2}|Fajr|Dhuhr|Asr|Maghrib|Isha|next prayer|tasks|habits|Hijri/iu,
    );
  },
);
