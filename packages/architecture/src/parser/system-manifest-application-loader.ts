import type {
    YamlLoader,
} from "./yaml-loader.js";

import {
    YamlLoader as DefaultYamlLoader,
} from "./yaml-loader.js";

export interface SystemManifestApplication {

    readonly appKey: string;

    readonly name: string;

    readonly description: string;

    readonly iconToken: string;

    readonly route: string;

    readonly status: string;

    readonly requiredEntitlement: {

        readonly action: string;

        readonly resourceType: string;

        readonly resourceId: string;

    };

}

export interface SystemApplicationManifest {

    readonly name: string;

    readonly applications:
    readonly SystemManifestApplication[];

}

interface MutableSystemManifestApplication {

    appKey: string;

    name: string;

    description: string;

    iconToken: string;

    route: string;

    status: string;

    requiredEntitlement: {

        action: string;

        resourceType: string;

        resourceId: string;

    };

}

export class SystemManifestApplicationLoader {

    public constructor(
        private readonly yamlLoader:
        YamlLoader =
            new DefaultYamlLoader(),
    ) {}

    public load(
        manifestPath: string,
    ): SystemApplicationManifest {

        const content =
            this.yamlLoader.load(
                manifestPath,
            );

        return Object.freeze({

            name:
                this.readTopLevelScalar(
                    content,
                    "name",
                ),

            applications:
                Object.freeze(
                    this.readApplications(
                        content,
                    ),
                ),

        });

    }

    private cleanScalar(
        value: string | undefined,
    ): string {

        const scalar =
            value?.trim()
            ?? "";

        if (
            scalar.length >= 2
            && (
                (
                    scalar.startsWith(
                        "\"",
                    )
                    && scalar.endsWith(
                        "\"",
                    )
                )
                || (
                    scalar.startsWith(
                        "'",
                    )
                    && scalar.endsWith(
                        "'",
                    )
                )
            )
        ) {

            return scalar.slice(
                1,
                -1,
            );

        }

        return scalar;

    }

    private createEmptyApplication(
        appKey: string,
    ): MutableSystemManifestApplication {

        return {

            appKey,

            name:
                "",

            description:
                "",

            iconToken:
                "",

            route:
                "",

            status:
                "",

            requiredEntitlement: {

                action:
                    "",

                resourceType:
                    "",

                resourceId:
                    "",

            },

        };

    }

    private freezeApplication(
        application: MutableSystemManifestApplication,
    ): SystemManifestApplication {

        return Object.freeze({

            ...application,

            requiredEntitlement:
                Object.freeze({
                    ...application.requiredEntitlement,
                }),

        });

    }

    private readApplications(
        content: string,
    ): readonly SystemManifestApplication[] {

        const lines =
            content.split(
                /\r?\n/,
            );

        const applicationsStart =
            lines.findIndex(
                line =>
                    line === "applications:",
            );

        if (applicationsStart === -1) {

            return [];

        }

        const applications:
        SystemManifestApplication[] =
            [];

        let current:
        MutableSystemManifestApplication
        | undefined;

        for (
            let index =
                applicationsStart + 1;
            index < lines.length;
            index += 1
        ) {

            const line =
                lines[index]
                ?? "";

            if (
                line.length > 0
                && !line.startsWith(
                    " ",
                )
            ) {

                break;

            }

            const appKeyMatch =
                line.match(
                    /^  - appKey:\s*(.*)$/,
                );

            if (appKeyMatch) {

                if (current) {

                    applications.push(
                        this.freezeApplication(
                            current,
                        ),
                    );

                }

                current =
                    this.createEmptyApplication(
                        this.cleanScalar(
                            appKeyMatch[1],
                        ),
                    );

                continue;

            }

            if (!current) {

                continue;

            }

            const applicationFieldMatch =
                line.match(
                    /^    (name|description|iconToken|route|status):\s*(.*)$/,
                );

            if (applicationFieldMatch) {

                const field =
                    applicationFieldMatch[1] as
                    | "name"
                    | "description"
                    | "iconToken"
                    | "route"
                    | "status";

                current[field] =
                    this.cleanScalar(
                        applicationFieldMatch[2],
                    );

                continue;

            }

            const entitlementFieldMatch =
                line.match(
                    /^      (action|resourceType|resourceId):\s*(.*)$/,
                );

            if (entitlementFieldMatch) {

                const field =
                    entitlementFieldMatch[1] as
                    | "action"
                    | "resourceType"
                    | "resourceId";

                current.requiredEntitlement[field] =
                    this.cleanScalar(
                        entitlementFieldMatch[2],
                    );

            }

        }

        if (current) {

            applications.push(
                this.freezeApplication(
                    current,
                ),
            );

        }

        return applications;

    }

    private readTopLevelScalar(
        content: string,
        key: string,
    ): string {

        const expression =
            new RegExp(
                `^${key}:\\s*(.*)$`,
                "m",
            );

        return this.cleanScalar(
            content.match(
                expression,
            )?.[1],
        );

    }

}
