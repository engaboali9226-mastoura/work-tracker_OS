export type NoorPersonalTodayResult =
  | {
      readonly kind:
        "success";
      readonly today:
        unknown;
    }
  | {
      readonly kind:
        "setup-required";
    }
  | {
      readonly kind:
        "unavailable";
    };


function isRecord(
  value:
    unknown,
):
value is Record<string, unknown> {
  return (
    typeof value
      === "object"
    && value !== null
    && !Array.isArray(
      value,
    )
  );
}

function isTodayDashboard(
  value:
    unknown,
):
boolean {
  if (!isRecord(value)) {
    return false;
  }

  const required =
    [
      "personalDay",
      "islamicContext",
      "nextPrayer",
      "tasks",
      "habits",
      "automationPending",
    ];

  if (
    required.some(
      key =>
        !Object.hasOwn(
          value,
          key,
        ),
    )
  ) {
    return false;
  }

  return (
    Array.isArray(
      value.tasks,
    )
    && Array.isArray(
      value.habits,
    )
    && typeof value.automationPending
      === "number"
    && Number.isInteger(
      value.automationPending,
    )
    && value.automationPending
      >= 0
  );
}

function isJsonResponse(
  response:
    Response,
):
boolean {
  return response
    .headers
    .get(
      "content-type",
    )
    ?.toLowerCase()
    .startsWith(
      "application/json",
    )
    ?? false;
}

export async function fetchNoorPersonalToday(
  fetcher:
    typeof fetch =
      fetch,
):
Promise<NoorPersonalTodayResult> {
  try {
    const response =
      await fetcher(
        "/api/noor/personal/today",
        {
          method:
            "POST",
          credentials:
            "same-origin",
          cache:
            "no-store",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            "{}",
        },
      );

    if (
      response.status
      === 409
    ) {
      return {
        kind:
          "setup-required",
      };
    }

    if (
      !response.ok
      || !isJsonResponse(
        response,
      )
    ) {
      return {
        kind:
          "unavailable",
      };
    }

    const today =
      await response.json();

    if (
      !isTodayDashboard(
        today,
      )
    ) {
      return {
        kind:
          "unavailable",
      };
    }

    return {
      kind:
        "success",
      today,
    };
  } catch {
    return {
      kind:
        "unavailable",
    };
  }
}
