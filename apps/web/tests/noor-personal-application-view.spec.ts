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
  "Noor Personal view renders actual Today payload supplied by the privileged client",
  () => {
    const html =
      renderToStaticMarkup(
        createElement(
          NoorPersonalApplicationView,
          {
            initialResult: {
              kind:
                "success",
              today: {
                personalDay: {
                  id:
                    "day-real",
                },
                automationPending:
                  2,
              },
            },
          },
        ),
      );

    assert.match(
      html,
      /aria-labelledby="noor-personal-today-title"/u,
    );

    assert.match(
      html,
      /data-noor-personal-today="loaded"/u,
    );

    assert.match(
      html,
      /day-real/u,
    );

    assert.match(
      html,
      /automationPending/u,
    );
  },
);

test(
  "Noor Personal view is truthful for setup-required and does not fabricate prayer data",
  () => {
    const html =
      renderToStaticMarkup(
        createElement(
          NoorPersonalApplicationView,
          {
            initialResult: {
              kind:
                "setup-required",
            },
          },
        ),
      );

    assert.match(
      html,
      /needs an active location and prayer policy/u,
    );

    assert.doesNotMatch(
      html,
      /Fajr|Dhuhr|Asr|Maghrib|Isha/iu,
    );
  },
);
