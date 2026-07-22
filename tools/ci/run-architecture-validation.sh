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
    echo "ERROR: Canonical architecture validation must run from the repository root."
    echo "Expected:"
    echo "  $REPOSITORY_ROOT"
    echo "Actual:"
    echo "  $CURRENT_DIRECTORY"
    exit 64
fi

if [ ! -f "package.json" ] || [ ! -f "package-lock.json" ]; then
    echo "ERROR: Repository package metadata is missing."
    exit 65
fi

print_command() {
    printf 'Command:'

    for ARGUMENT in "$@"; do
        printf ' %s' "$ARGUMENT"
    done

    printf '\n'
}

run_step() {
    STEP_LABEL="$1"
    shift

    echo
    echo "============================================================"
    echo " BEGIN STEP — $STEP_LABEL"
    echo "============================================================"
    echo

    print_command "$@"

    set +e
    "$@"
    STEP_STATUS="$?"
    set -e

    if [ "$STEP_STATUS" -ne 0 ]; then
        echo
        echo "============================================================"
        echo " FAILED STEP — $STEP_LABEL"
        echo "============================================================"
        echo
        echo "Exit code:"
        echo "  $STEP_STATUS"

        return "$STEP_STATUS"
    fi

    echo
    echo "============================================================"
    echo " END STEP — $STEP_LABEL"
    echo "============================================================"
}

echo "============================================================"
echo " CANONICAL ARCHITECTURE VALIDATION"
echo "============================================================"
echo
echo "Repository root:"
echo "  $REPOSITORY_ROOT"
echo
echo "Operating system:"
uname -srm
echo
echo "Shell:"
echo "  ${SHELL-unset}"
echo
echo "Bash:"
bash --version | sed -n '1p'
echo
echo "Node.js:"
node --version
echo
echo "npm:"
npm --version
echo
echo "npm cache:"
npm config get cache
echo
echo "CI:"
echo "  ${CI-unset}"
echo
echo "RUNNER_OS:"
echo "  ${RUNNER_OS-unset}"
echo
echo "RUNNER_ARCH:"
echo "  ${RUNNER_ARCH-unset}"

run_step \
    "Install dependencies" \
    npm ci

run_step \
    "Validate architecture" \
    npm run validate:architecture

run_step \
    "Run tests" \
    npm test

echo
echo "============================================================"
echo " CANONICAL ARCHITECTURE VALIDATION PASS"
echo "============================================================"
