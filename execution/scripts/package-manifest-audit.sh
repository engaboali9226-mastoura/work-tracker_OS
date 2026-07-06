#!/usr/bin/env bash

set -e

echo ""
echo "========================================"
echo "PACKAGE MANIFEST AUDIT"
echo "========================================"
echo ""

FAILED=0

audit() {

    if [ -f "$1/package.json" ]; then

        printf "[OK]  %s\n" "$1"

    else

        printf "[MISS] %s\n" "$1"

        FAILED=1

    fi

}

for dir in packages/* apps/*; do

    [ -d "$dir" ] || continue

    audit "$dir"

done

echo ""

if [ "$FAILED" -eq 0 ]; then

    echo "[PASS] Package Manifest Audit Completed."

else

    echo "[FAIL] Package Manifest Audit Completed."

    exit 1

fi
