import {
  createElement,
  type ReactElement,
} from "react";

export function NoorPersonalApplicationView():
ReactElement {
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
    createElement(
      "p",
      null,
      "Your Noor Personal application is connected.",
    ),
    createElement(
      "p",
      null,
      "Today data is not available yet because the Personal runtime operation is not connected.",
    ),
  );
}
