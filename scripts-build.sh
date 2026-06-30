#!/usr/bin/env bash

set -e

for dir in packages/* apps/forge
do

    if [ -f "$dir/package.json" ]; then

        echo ""
        echo "Building $dir"

        (
            cd "$dir"
            npm run build
        )

    fi

done
