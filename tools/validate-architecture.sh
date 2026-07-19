#!/usr/bin/env bash

set -e

FAILED=0

echo ""
echo "========================================="
echo "Architecture Validation"
echo "========================================="
echo ""

FILES=(
architecture/system.manifest.yaml
architecture/component-dependencies.yaml
architecture/component-ports.yaml
)

for file in "${FILES[@]}"
do
    if [ -f "$file" ]; then
        echo "✔ $file"
    else
        echo "✘ $file"
        FAILED=1
    fi
done

echo ""

if [ ! -d components ]; then
    echo "✘ components directory"
    FAILED=1
else
    for component_path in components/*
    do
        [ -d "$component_path" ] || continue

        component="$(basename "$component_path")"

        echo "Checking $component"

        if [ -f "$component_path/component.yaml" ]; then
            echo "  ✔ component.yaml"
        else
            echo "  ✘ component.yaml"
            FAILED=1
        fi

        if [ -f "$component_path/specification/SPECIFICATION.md" ]; then
            echo "  ✔ specification/SPECIFICATION.md"
        else
            echo "  ✘ specification/SPECIFICATION.md"
            FAILED=1
        fi

        if [ -d "$component_path/contracts" ]; then
            if [ -f "$component_path/contracts/CONTRACT.md" ]; then
                echo "  ✔ contracts/CONTRACT.md"
            else
                echo "  ✘ contracts/CONTRACT.md"
                FAILED=1
            fi
        else
            echo "  - contracts directory not present"
        fi

        if [ -d "$component_path/docs" ]; then
            if [ -f "$component_path/docs/README.md" ]; then
                echo "  ✔ docs/README.md"
            else
                echo "  ✘ docs/README.md"
                FAILED=1
            fi
        else
            echo "  - docs directory not present"
        fi

    done
fi

echo ""

for dir in packages/* apps/*
do
    [ -d "$dir" ] || continue

    if [ -f "$dir/package.json" ]; then
        echo "✔ $dir"
    else
        echo "✘ $dir/package.json"
        FAILED=1
    fi
done

echo ""

if [ "$FAILED" -ne 0 ]; then
    echo "========================================="
    echo "Architecture Structural Validation Failed"
    echo "========================================="
    exit 1
fi

echo "========================================="
echo "Architecture Structural Validation Passed"
echo "========================================="
echo ""

echo "========================================="
echo "Architecture CLI Validation"
echo "========================================="
echo ""

node --import tsx packages/architecture/src/cli/main.ts validate

echo ""
echo "========================================="
echo "Architecture Validation Passed"
echo "========================================="

# CONTRACTS_BOUNDARY_VALIDATION_BEGIN
echo
echo "========================================="
echo "Contracts Boundary Validation"
echo "========================================="

CONTRACTS_BOUNDARY_REPOSITORY_ROOT="${WORKSPACE_ROOT:-${REPO_ROOT:-${ROOT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}}}"

node "$(cd "$(dirname "$0")/.." && pwd)/tools/validate-contracts-boundary.mjs"     "$CONTRACTS_BOUNDARY_REPOSITORY_ROOT"

echo
echo "========================================="
echo "Contracts Boundary Validation Passed"
echo "========================================="
# CONTRACTS_BOUNDARY_VALIDATION_END
