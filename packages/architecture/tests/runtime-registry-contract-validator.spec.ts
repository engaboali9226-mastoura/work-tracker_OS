import assert from "node:assert/strict";

import {
    readFileSync,
    statSync,
} from "node:fs";

import {
    join,
    resolve,
} from "node:path";

import test from "node:test";

import {
    RuntimeRegistryContractValidator,
} from "../src/registry/index.js";

const workspaceRoot =
    resolve(
        import.meta.dirname,
        "../../..",
    );

const registryPath =
    join(
        workspaceRoot,
        "runtime",
        "component-registry.json",
    );

type MutableRegistry =
    Record<string, any>;

function loadRegistry(): MutableRegistry {

    return JSON.parse(
        readFileSync(
            registryPath,
            "utf8",
        ),
    ) as MutableRegistry;

}

function clone<T>(
    value: T,
): T {

    return JSON.parse(
        JSON.stringify(
            value,
        ),
    ) as T;

}

function validate(
    value: unknown,
) {

    return new RuntimeRegistryContractValidator()
        .validate(
            value,
        );

}

function assertInvalidWith(
    value: unknown,
    code: string,
): void {

    const report =
        validate(
            value,
        );

    assert.equal(
        report.valid,
        false,
    );

    assert.equal(
        report.issues.some(
            issue =>
                issue.code === code,
        ),
        true,
        `Expected issue code ${code}, got ${report.issues
            .map(issue => issue.code)
            .join(", ")}`,
    );

}

test(
    "RuntimeRegistryContractValidator accepts the current runtime registry",
    () => {

        const report =
            new RuntimeRegistryContractValidator()
                .validateFile(
                    registryPath,
                );

        assert.equal(
            report.valid,
            true,
        );

        assert.deepEqual(
            report.issues,
            [],
        );

    },
);

test(
    "RuntimeRegistryContractValidator does not modify the registry file",
    () => {

        const beforeContent =
            readFileSync(
                registryPath,
                "utf8",
            );

        const beforeModifiedAt =
            statSync(
                registryPath,
            )
                .mtimeMs;

        const report =
            new RuntimeRegistryContractValidator()
                .validateFile(
                    registryPath,
                );

        const afterContent =
            readFileSync(
                registryPath,
                "utf8",
            );

        const afterModifiedAt =
            statSync(
                registryPath,
            )
                .mtimeMs;

        assert.equal(
            report.valid,
            true,
        );

        assert.equal(
            afterContent,
            beforeContent,
        );

        assert.equal(
            afterModifiedAt,
            beforeModifiedAt,
        );

    },
);

test(
    "RuntimeRegistryContractValidator rejects invalid top-level registry shapes",
    () => {

        assertInvalidWith(
            null,
            "REG-001",
        );

        const missingGeneratedAt =
            loadRegistry();

        delete missingGeneratedAt.generatedAt;

        assertInvalidWith(
            missingGeneratedAt,
            "REG-002",
        );

        const nonStringGeneratedAt =
            loadRegistry();

        nonStringGeneratedAt.generatedAt = 123;

        assertInvalidWith(
            nonStringGeneratedAt,
            "REG-003",
        );

        const invalidGeneratedAt =
            loadRegistry();

        invalidGeneratedAt.generatedAt = "not-a-date";

        assertInvalidWith(
            invalidGeneratedAt,
            "REG-003",
        );

        const missingComponents =
            loadRegistry();

        delete missingComponents.components;

        assertInvalidWith(
            missingComponents,
            "REG-004",
        );

        const nonArrayComponents =
            loadRegistry();

        nonArrayComponents.components = {};

        assertInvalidWith(
            nonArrayComponents,
            "REG-005",
        );

    },
);

test(
    "RuntimeRegistryContractValidator rejects invalid component identity and path fields",
    () => {

        const duplicate =
            loadRegistry();

        duplicate.components.push(
            clone(
                duplicate.components[0],
            ),
        );

        assertInvalidWith(
            duplicate,
            "REG-006",
        );

        const nonObjectEntry =
            loadRegistry();

        nonObjectEntry.components[0] = "bad";

        assertInvalidWith(
            nonObjectEntry,
            "REG-007",
        );

        const missingName =
            loadRegistry();

        delete missingName.components[0].name;

        assertInvalidWith(
            missingName,
            "REG-008",
        );

        const emptyName =
            loadRegistry();

        emptyName.components[0].name = "";

        assertInvalidWith(
            emptyName,
            "REG-008",
        );

        const missingManifest =
            loadRegistry();

        delete missingManifest.components[0].manifest;

        assertInvalidWith(
            missingManifest,
            "REG-009",
        );

        const invalidManifest =
            loadRegistry();

        invalidManifest.components[0].manifest = "bad";

        assertInvalidWith(
            invalidManifest,
            "REG-009",
        );

        const optionalPathAbsent =
            loadRegistry();

        delete optionalPathAbsent.components.find(
            (component: MutableRegistry) =>
                component.name === "kernel",
        ).specification;

        const optionalPathAbsentReport =
            validate(
                optionalPathAbsent,
            );

        assert.equal(
            optionalPathAbsentReport.issues.some(
                issue =>
                    issue.code === "REG-010",
            ),
            false,
        );

        const invalidOptionalPath =
            loadRegistry();

        invalidOptionalPath.components[0].contracts = 123;

        assertInvalidWith(
            invalidOptionalPath,
            "REG-010",
        );

    },
);

test(
    "RuntimeRegistryContractValidator rejects invalid metadata",
    () => {

        const missingMetadata =
            loadRegistry();

        delete missingMetadata.components[0].metadata;

        assertInvalidWith(
            missingMetadata,
            "REG-011",
        );

        const nonObjectMetadata =
            loadRegistry();

        nonObjectMetadata.components[0].metadata = "bad";

        assertInvalidWith(
            nonObjectMetadata,
            "REG-012",
        );

        const missingManifestName =
            loadRegistry();

        delete missingManifestName.components[0].metadata.manifestName;

        assertInvalidWith(
            missingManifestName,
            "REG-012",
        );

        const emptyDescription =
            loadRegistry();

        emptyDescription.components[0].metadata.description = "";

        assertInvalidWith(
            emptyDescription,
            "REG-012",
        );

        const manifestNameMismatch =
            loadRegistry();

        manifestNameMismatch.components[0].metadata.manifestName = "wrong";

        assertInvalidWith(
            manifestNameMismatch,
            "REG-013",
        );

    },
);

test(
    "RuntimeRegistryContractValidator rejects invalid ports",
    () => {

        const missingPorts =
            loadRegistry();

        delete missingPorts.components[0].ports;

        assertInvalidWith(
            missingPorts,
            "REG-014",
        );

        const nonObjectPorts =
            loadRegistry();

        nonObjectPorts.components[0].ports = "bad";

        assertInvalidWith(
            nonObjectPorts,
            "REG-015",
        );

        const missingInputs =
            loadRegistry();

        delete missingInputs.components[0].ports.inputs;

        assertInvalidWith(
            missingInputs,
            "REG-015",
        );

        const nonArrayInputs =
            loadRegistry();

        nonArrayInputs.components[0].ports.inputs = "bad";

        assertInvalidWith(
            nonArrayInputs,
            "REG-015",
        );

        const nonStringInput =
            loadRegistry();

        nonStringInput.components[0].ports.inputs.push(
            123,
        );

        assertInvalidWith(
            nonStringInput,
            "REG-016",
        );

        const missingOutputs =
            loadRegistry();

        delete missingOutputs.components[0].ports.outputs;

        assertInvalidWith(
            missingOutputs,
            "REG-015",
        );

        const nonArrayOutputs =
            loadRegistry();

        nonArrayOutputs.components[0].ports.outputs = "bad";

        assertInvalidWith(
            nonArrayOutputs,
            "REG-015",
        );

        const nonStringOutput =
            loadRegistry();

        nonStringOutput.components[0].ports.outputs.push(
            123,
        );

        assertInvalidWith(
            nonStringOutput,
            "REG-017",
        );

    },
);

test(
    "RuntimeRegistryContractValidator validates current workspace component contracts",
    () => {

        const missingRequiredComponent =
            loadRegistry();

        missingRequiredComponent.components =
            missingRequiredComponent.components.filter(
                (component: MutableRegistry) =>
                    component.name !== "workday",
            );

        assertInvalidWith(
            missingRequiredComponent,
            "REG-018",
        );

        const invalidAttendance =
            loadRegistry();

        invalidAttendance.components.find(
            (component: MutableRegistry) =>
                component.name === "attendance",
        ).ports.inputs =
            [
                "CheckIn",
            ];

        assertInvalidWith(
            invalidAttendance,
            "REG-019",
        );

        const invalidTasks =
            loadRegistry();

        invalidTasks.components.find(
            (component: MutableRegistry) =>
                component.name === "tasks",
        ).ports.inputs =
            [
                "StartTask",
            ];

        assertInvalidWith(
            invalidTasks,
            "REG-020",
        );

        const invalidKernelPaths =
            loadRegistry();

        invalidKernelPaths.components.find(
            (component: MutableRegistry) =>
                component.name === "kernel",
        ).contracts = "components/kernel/contracts";

        assertInvalidWith(
            invalidKernelPaths,
            "REG-021",
        );

        const invalidKernelPorts =
            loadRegistry();

        invalidKernelPorts.components.find(
            (component: MutableRegistry) =>
                component.name === "kernel",
        ).ports.outputs =
            [
                "Registration Result",
            ];

        assertInvalidWith(
            invalidKernelPorts,
            "REG-021",
        );

    },
);
