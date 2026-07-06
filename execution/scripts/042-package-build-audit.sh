#!/usr/bin/env bash

set -e

echo ""
echo "====================================="
echo "WORKTRACKER OS"
echo "STEP 042"
echo "Package Build Audit"
echo "====================================="

FAILED=0

for dir in packages/* apps/*
do

    [ -d "$dir" ] || continue

    if [ ! -f "$dir/package.json" ]; then
        continue
    fi

    printf "%-35s" "$dir"

    if grep -q "\"build\"" "$dir/package.json"; then
        echo "[BUILD]"
    else
        echo "[MISS]"
        FAILED=1
    fi

done

echo ""

if [ "$FAILED" -eq 0 ]; then

    echo "[PASS] Package Build Audit Completed."

else

    echo "[FAIL] Some packages do not define a build script."
    exit 1

fi

