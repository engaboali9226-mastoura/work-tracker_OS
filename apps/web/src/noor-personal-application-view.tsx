import {
  createElement,
  useEffect,
  useState,
  type ReactElement,
} from "react";

import {
  fetchNoorPersonalToday,
} from "./noor-personal-today-client.js";

import type {
  NoorPersonalTodayResult,
} from "./noor-personal-today-client.js";

export interface NoorPersonalApplicationViewProps {
  readonly initialResult?:
    NoorPersonalTodayResult;
}

function renderJson(
  value:
    unknown,
):
string {
  return JSON.stringify(
    value,
    null,
    2,
  );
}

function TodayResult(
  result:
    NoorPersonalTodayResult,
):
ReactElement {
  if (
    result.kind
    === "setup-required"
  ) {
    return createElement(
      "p",
      {
        role:
          "status",
      },
      "Noor Personal needs an active location and prayer policy before Today can be created.",
    );
  }

  if (
    result.kind
    === "unavailable"
  ) {
    return createElement(
      "p",
      {
        role:
          "alert",
      },
      "Today is temporarily unavailable.",
    );
  }

  return createElement(
    "section",
    {
      "aria-label":
        "Today dashboard",
    },
    createElement(
      "h2",
      null,
      "Current Today dashboard",
    ),
    createElement(
      "pre",
      {
        "data-noor-personal-today":
          "loaded",
      },
      renderJson(
        result.today,
      ),
    ),
  );
}

export function NoorPersonalApplicationView(
  props:
    NoorPersonalApplicationViewProps = {},
):
ReactElement {
  const [
    result,
    setResult,
  ] =
    useState<
      NoorPersonalTodayResult
      | null
    >(
      props.initialResult
      ?? null,
    );

  useEffect(
    () => {
      if (
        props.initialResult
      ) {
        return;
      }

      let active =
        true;

      void fetchNoorPersonalToday()
        .then(
          value => {
            if (active) {
              setResult(
                value,
              );
            }
          },
        );

      return () => {
        active =
          false;
      };
    },
    [
      props.initialResult,
    ],
  );

  return createElement(
    "section",
    {
      "aria-labelledby":
        "noor-personal-today-title",
    },
    createElement(
      "header",
      null,
      createElement(
        "p",
        null,
        "Noor Personal",
      ),
      createElement(
        "h1",
        {
          id:
            "noor-personal-today-title",
        },
        "Today",
      ),
    ),
    result
      ? TodayResult(
          result,
        )
      : createElement(
          "p",
          {
            role:
              "status",
          },
          "Loading Today from your Noor Personal account.",
        ),
  );
}
