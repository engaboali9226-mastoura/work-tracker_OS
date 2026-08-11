import type {
  ApplicationCatalog,
  ApplicationKey,
} from "@worktracker/core";
import type {
  ReactElement,
} from "react";

export type ApplicationViewFactory<View> =
  () => View;

export type ReactApplicationViewFactory =
  ApplicationViewFactory<ReactElement>;

export type ApplicationViewRegistration<View> =
Readonly<{
  appKey:
    ApplicationKey;
  factory:
    ApplicationViewFactory<View>;
}>;

export interface ApplicationViewRegistry<View> {
  find(
    appKey: ApplicationKey,
  ): ApplicationViewFactory<View> | undefined;
}

export type ApplicationViewRegistrationErrorCode =
  | "DUPLICATE_APPLICATION"
  | "UNKNOWN_APPLICATION"
  | "NON_MOUNTABLE_APPLICATION";

export class ApplicationViewRegistrationError
extends Error {
  public readonly code:
    ApplicationViewRegistrationErrorCode;

  public constructor(
    code: ApplicationViewRegistrationErrorCode,
    appKey: string,
  ) {
    super(
      `Invalid Application View registration for ${appKey}: ${code}.`,
    );

    this.name =
      "ApplicationViewRegistrationError";

    this.code =
      code;
  }
}

export function createApplicationViewRegistry<View>(
  catalog: ApplicationCatalog,
  registrations:
    readonly ApplicationViewRegistration<View>[],
): ApplicationViewRegistry<View> {
  const factories =
    new Map<
      ApplicationKey,
      ApplicationViewFactory<View>
    >();

  for (const registration of registrations) {
    const application =
      catalog.findByKey(
        registration.appKey,
      );

    if (!application) {
      throw new ApplicationViewRegistrationError(
        "UNKNOWN_APPLICATION",
        registration.appKey,
      );
    }

    if (application.status !== "experimental") {
      throw new ApplicationViewRegistrationError(
        "NON_MOUNTABLE_APPLICATION",
        registration.appKey,
      );
    }

    if (factories.has(application.appKey)) {
      throw new ApplicationViewRegistrationError(
        "DUPLICATE_APPLICATION",
        registration.appKey,
      );
    }

    factories.set(
      application.appKey,
      registration.factory,
    );
  }

  const registry: ApplicationViewRegistry<View> = {
    find:
      appKey =>
        factories.get(
          appKey,
        ),
  };

  return Object.freeze(
    registry,
  );
}
