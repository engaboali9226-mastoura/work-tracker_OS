#!/usr/bin/env bash

set -eu
set -o pipefail

SCRIPT_DIR="$(
    CDPATH= cd "$(dirname "$0")" &&
        pwd -P
)"

REPOSITORY_ROOT="$(
    CDPATH= cd "$SCRIPT_DIR/../.." &&
        pwd -P
)"

CURRENT_DIRECTORY="$(pwd -P)"

if [ "$CURRENT_DIRECTORY" != "$REPOSITORY_ROOT" ]; then
    echo "ERROR: Node.js 24 parity must run from the repository root."
    exit 64
fi

if ! git diff --cached --quiet; then
    echo "ERROR: The repository index must be clean before parity execution."
    exit 65
fi

CANDIDATE_REFERENCE="${1-HEAD}"

CANDIDATE_COMMIT="$(
    git rev-parse \
        --verify \
        "${CANDIDATE_REFERENCE}^{commit}"
)"

CANDIDATE_TREE="$(
    git rev-parse \
        "${CANDIDATE_COMMIT}^{tree}"
)"

TOTAL_RUNS="3"
RUN_NUMBER="1"
PASSED_RUNS="0"
FAILED_RUNS="0"

TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"

SUMMARY_TSV="/tmp/noor-node24-parity-runs-${TIMESTAMP}.tsv"
SUMMARY_JSON="/tmp/noor-node24-parity-summary-${TIMESTAMP}.json"
OVERLAY_MANIFEST="/tmp/noor-node24-parity-overlay-${TIMESTAMP}.tsv"

ORIGINAL_PUBLISHED_TAG="platform-user-context-foundation-v1.0.0"
PROPOSED_RECOVERY_TAG="platform-user-context-foundation-ci-reliability-fix-v1.0.0"

REQUIREMENTS_REPORT="reports/phase2-step-404-user-context-ci-reliability-fix-requirements.md"
DESIGN_REPORT="reports/phase2-step-406-user-context-ci-reliability-fix-design.md"
WORKFLOW_PATH=".github/workflows/architecture-validation.yml"
DRIVER_PATH="tools/ci/run-architecture-validation.sh"
PARITY_PATH="tools/ci/run-node24-parity.sh"
TEST_PATH="packages/architecture/tests/ci-reliability-boundary.spec.ts"

: > "$SUMMARY_TSV"
: > "$OVERLAY_MANIFEST"

for OVERLAY_PATH in \
    "$REQUIREMENTS_REPORT" \
    "$DESIGN_REPORT" \
    "$WORKFLOW_PATH" \
    "$DRIVER_PATH" \
    "$PARITY_PATH" \
    "$TEST_PATH"
do
    if [ ! -f "$OVERLAY_PATH" ]; then
        echo "ERROR: Required parity overlay path is missing:"
        echo "  $OVERLAY_PATH"
        exit 66
    fi

    OVERLAY_BLOB="$(
        git hash-object \
            --no-filters \
            "$OVERLAY_PATH"
    )"

    printf '%s\t%s\n' \
        "$OVERLAY_PATH" \
        "$OVERLAY_BLOB" \
        >> "$OVERLAY_MANIFEST"
done

OVERLAY_MANIFEST_HASH="$(
    git hash-object \
        --no-filters \
        "$OVERLAY_MANIFEST"
)"

echo "============================================================"
echo " NODE.JS 24 CLEAN-PARITY VALIDATION"
echo "============================================================"
echo
echo "Candidate reference:"
echo "  $CANDIDATE_REFERENCE"
echo
echo "Candidate commit:"
echo "  $CANDIDATE_COMMIT"
echo
echo "Candidate tree:"
echo "  $CANDIDATE_TREE"
echo
echo "Node package:"
echo "  node@24"
echo
echo "npm package:"
echo "  npm@11"
echo
echo "Clean runs:"
echo "  $TOTAL_RUNS"
echo
echo "Snapshot source:"
echo "  git archive"
echo
echo "Original published tag:"
echo "  $ORIGINAL_PUBLISHED_TAG"
echo
echo "Proposed recovery tag:"
echo "  $PROPOSED_RECOVERY_TAG"
echo
echo "Overlay manifest:"
echo "  $OVERLAY_MANIFEST"
echo
echo "Overlay manifest hash:"
echo "  $OVERLAY_MANIFEST_HASH"

while [ "$RUN_NUMBER" -le "$TOTAL_RUNS" ]; do
    RUN_SNAPSHOT="$(
        mktemp -d \
            "/tmp/noor-node24-parity-${TIMESTAMP}-run${RUN_NUMBER}-XXXXXX"
    )"

    RUN_NPM_CACHE="$(
        mktemp -d \
            "/tmp/noor-node24-cache-${TIMESTAMP}-run${RUN_NUMBER}-XXXXXX"
    )"

    RUN_LOG="/tmp/noor-node24-parity-${TIMESTAMP}-run${RUN_NUMBER}.txt"

    echo
    echo "============================================================"
    echo " NODE.JS 24 PARITY RUN $RUN_NUMBER OF $TOTAL_RUNS"
    echo "============================================================"
    echo
    echo "Snapshot:"
    echo "  $RUN_SNAPSHOT"
    echo
    echo "npm cache:"
    echo "  $RUN_NPM_CACHE"
    echo
    echo "Log:"
    echo "  $RUN_LOG"

    git archive "$CANDIDATE_COMMIT" |
        (
            cd "$RUN_SNAPSHOT"
            tar -xf -
        )

    tar -cf - \
        "$REQUIREMENTS_REPORT" \
        "$DESIGN_REPORT" \
        "$WORKFLOW_PATH" \
        "$DRIVER_PATH" \
        "$PARITY_PATH" \
        "$TEST_PATH" |
        (
            cd "$RUN_SNAPSHOT"
            tar -xf -
        )

    test -f "$RUN_SNAPSHOT/$DRIVER_PATH"
    test -f "$RUN_SNAPSHOT/$PARITY_PATH"
    test -f "$RUN_SNAPSHOT/$TEST_PATH"
    test -f "$RUN_SNAPSHOT/$WORKFLOW_PATH"
    test ! -e "$RUN_SNAPSHOT/node_modules"

    set +e

    (
        cd "$RUN_SNAPSHOT"

        export CI="true"
        export NPM_CONFIG_CACHE="$RUN_NPM_CACHE"

        npx \
            --yes \
            --package=node@24 \
            --package=npm@11 \
            -c \
            'printf "PARITY_NODE_VERSION="; node --version; printf "PARITY_NPM_VERSION="; npm --version; bash tools/ci/run-architecture-validation.sh'
    ) 2>&1 |
        tee "$RUN_LOG"

    RUN_STATUS="${PIPESTATUS[0]}"

    set -e

    RUN_NODE_VERSION="$(
        sed -n \
            's/^PARITY_NODE_VERSION=//p' \
            "$RUN_LOG" |
            tail -n 1
    )"

    RUN_NPM_VERSION="$(
        sed -n \
            's/^PARITY_NPM_VERSION=//p' \
            "$RUN_LOG" |
            tail -n 1
    )"

    if ! printf '%s\n' "$RUN_NODE_VERSION" |
        grep -Eq '^v24\.'
    then
        echo "ERROR: Parity run did not resolve Node.js major 24."
        RUN_STATUS="90"
    fi

    if ! printf '%s\n' "$RUN_NPM_VERSION" |
        grep -Eq '^11\.'
    then
        echo "ERROR: Parity run did not resolve npm major 11."
        RUN_STATUS="91"
    fi

    RUN_LOG_HASH="$(
        git hash-object \
            --no-filters \
            "$RUN_LOG"
    )"

    if [ "$RUN_STATUS" -eq 0 ]; then
        RUN_RESULT="PASS"
        PASSED_RUNS="$((PASSED_RUNS + 1))"
    else
        RUN_RESULT="FAIL"
        FAILED_RUNS="$((FAILED_RUNS + 1))"
    fi

    printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
        "$RUN_NUMBER" \
        "$RUN_RESULT" \
        "$RUN_STATUS" \
        "$RUN_NODE_VERSION" \
        "$RUN_NPM_VERSION" \
        "$RUN_SNAPSHOT" \
        "$RUN_NPM_CACHE" \
        "$RUN_LOG" \
        "$RUN_LOG_HASH" \
        >> "$SUMMARY_TSV"

    rm -rf \
        "$RUN_SNAPSHOT" \
        "$RUN_NPM_CACHE"

    RUN_NUMBER="$((RUN_NUMBER + 1))"
done

if [ "$FAILED_RUNS" -eq 0 ]; then
    FINAL_RESULT="PASS"
    FINAL_CLASSIFICATION="LOCAL_PARITY_ACCEPTED_PENDING_REMOTE_CI"
else
    FINAL_RESULT="FAIL"
    FINAL_CLASSIFICATION="LOCAL_PARITY_COMMAND_FAILURE"
fi

PARITY_SUMMARY_TSV="$SUMMARY_TSV" \
PARITY_SUMMARY_JSON="$SUMMARY_JSON" \
PARITY_CANDIDATE_COMMIT="$CANDIDATE_COMMIT" \
PARITY_CANDIDATE_TREE="$CANDIDATE_TREE" \
PARITY_TOTAL_RUNS="$TOTAL_RUNS" \
PARITY_PASSED_RUNS="$PASSED_RUNS" \
PARITY_FAILED_RUNS="$FAILED_RUNS" \
PARITY_FINAL_RESULT="$FINAL_RESULT" \
PARITY_FINAL_CLASSIFICATION="$FINAL_CLASSIFICATION" \
PARITY_OVERLAY_MANIFEST="$OVERLAY_MANIFEST" \
PARITY_OVERLAY_MANIFEST_HASH="$OVERLAY_MANIFEST_HASH" \
node <<'CREATE_PARITY_SUMMARY'
"use strict";

const fs = require("node:fs");

const rows =
    fs.readFileSync(
        process.env.PARITY_SUMMARY_TSV,
        "utf8",
    )
        .trim()
        .split(/\r?\n/u)
        .filter(Boolean)
        .map(line => {
            const [
                run,
                result,
                exitCode,
                nodeVersion,
                npmVersion,
                snapshotPath,
                npmCachePath,
                logPath,
                logHash,
            ] = line.split("\t");

            return {
                run:
                    Number(run),
                result,
                exitCode:
                    Number(exitCode),
                nodeVersion,
                npmVersion,
                snapshotPath,
                npmCachePath,
                snapshotRemoved:
                    !fs.existsSync(snapshotPath),
                npmCacheRemoved:
                    !fs.existsSync(npmCachePath),
                log: {
                    path:
                        logPath,
                    hash:
                        logHash,
                },
            };
        });

const summary = {
    step:
        "NODE24_PARITY",
    result:
        process.env.PARITY_FINAL_RESULT,
    classification:
        process.env.PARITY_FINAL_CLASSIFICATION,
    candidate: {
        commit:
            process.env.PARITY_CANDIDATE_COMMIT,
        tree:
            process.env.PARITY_CANDIDATE_TREE,
        snapshotMethod:
            "git archive",
        overlayManifest: {
            path:
                process.env.PARITY_OVERLAY_MANIFEST,
            hash:
                process.env.PARITY_OVERLAY_MANIFEST_HASH,
        },
    },
    toolchain: {
        requestedNode:
            "node@24",
        requestedNpm:
            "npm@11",
        exactPatchPinned:
            false,
        resolvedVersionsRecorded:
            true,
    },
    totalRuns:
        Number(process.env.PARITY_TOTAL_RUNS),
    passedRuns:
        Number(process.env.PARITY_PASSED_RUNS),
    failedRuns:
        Number(process.env.PARITY_FAILED_RUNS),
    runs:
        rows,
    isolation: {
        uniqueSnapshots:
            new Set(
                rows.map(row => row.snapshotPath),
            ).size === rows.length,
        uniqueNpmCaches:
            new Set(
                rows.map(row => row.npmCachePath),
            ).size === rows.length,
        snapshotsRemoved:
            rows.every(row => row.snapshotRemoved),
        npmCachesRemoved:
            rows.every(row => row.npmCacheRemoved),
    },
    repositoryMutation:
        false,
    indexMutation:
        false,
    commitMutation:
        false,
    tagMutation:
        false,
    pushMutation:
        false,
    remoteMutation:
        false,
    findings:
        [],
};

fs.writeFileSync(
    process.env.PARITY_SUMMARY_JSON,
    `${JSON.stringify(summary, null, 2)}\n`,
);
CREATE_PARITY_SUMMARY

SUMMARY_HASH="$(
    git hash-object \
        --no-filters \
        "$SUMMARY_JSON"
)"

echo
echo "============================================================"
echo " NODE.JS 24 PARITY RESULT"
echo "============================================================"
echo
echo "Result:"
echo "  $FINAL_RESULT"
echo
echo "Classification:"
echo "  $FINAL_CLASSIFICATION"
echo
echo "Total runs:"
echo "  $TOTAL_RUNS"
echo
echo "Passed runs:"
echo "  $PASSED_RUNS"
echo
echo "Failed runs:"
echo "  $FAILED_RUNS"
echo
echo "Summary:"
echo "  $SUMMARY_JSON"
echo
echo "Summary hash:"
echo "  $SUMMARY_HASH"
echo
echo "PARITY_SUMMARY_JSON=$SUMMARY_JSON"
echo "PARITY_SUMMARY_HASH=$SUMMARY_HASH"

if command -v code >/dev/null 2>&1; then
    set +e

    code \
        "$SUMMARY_JSON" \
        /tmp/noor-node24-parity-"${TIMESTAMP}"-run*.txt \
        >/dev/null 2>&1

    set -e
fi

if [ "$FAILED_RUNS" -ne 0 ]; then
    exit 1
fi
