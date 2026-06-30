#!/usr/bin/env bash

set -e

FAILED=0

echo ""
echo "========================================="
echo "Architecture Validation"
echo "========================================="
echo ""

###############################################################################
# Manifest
###############################################################################

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

###############################################################################
# Components
###############################################################################

COMPONENTS=(
workday
attendance
tasks
notifications
reports
dashboard
analytics
integrations
)

for component in "${COMPONENTS[@]}"
do

    echo "Checking $component"

    test -d components/$component || FAILED=1
    test -f components/$component/specification/SPECIFICATION.md || FAILED=1
    test -f components/$component/contracts/CONTRACT.md || FAILED=1
    test -f components/$component/docs/README.md || FAILED=1

done

echo ""

###############################################################################
# Packages
###############################################################################

PACKAGES=(
runtime
domain
application
infrastructure
core
contracts
events
shared
testing
)

for package in "${PACKAGES[@]}"
do

    test -d packages/$package || FAILED=1
done

echo ""

###############################################################################
# Applications
###############################################################################

test -d apps/forge || FAILED=1
test -d apps/web || FAILED=1

echo ""

###############################################################################
# Result
###############################################################################

if [ "$FAILED" -eq 0 ]; then

    echo "========================================="
    echo "Architecture Validation Passed"
    echo "========================================="

else

    echo "========================================="
    echo "Architecture Validation Failed"
    echo "========================================="

    exit 1

fi

