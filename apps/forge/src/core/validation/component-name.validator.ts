import { RESERVED_COMPONENT_NAMES }
from "../constants/reserved-component-names.js";

const COMPONENT_NAME_PATTERN =
    /^[a-z]+(?:-[a-z]+)*$/;

export function validateComponentName(
    name: string,
): void {

    if (
        !COMPONENT_NAME_PATTERN.test(
            name,
        )
    ) {

        throw new Error(
            `"${name}" is not a valid component name. Component names must use lowercase kebab-case.`,
        );

    }

    if (
        RESERVED_COMPONENT_NAMES.includes(
            name as never,
        )
    ) {

        throw new Error(
            `"${name}" is a reserved package name.`,
        );

    }

}
