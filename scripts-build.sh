#!/usr/bin/env bash

set -euo pipefail

for dir in packages/* apps/*
do
    [ -d "$dir" ] || continue
    [ -f "$dir/package.json" ] || continue

    if node - "$dir/package.json" <<'NODE'
const fs = require("fs");

const file = process.argv[2];
const pkg = JSON.parse(
    fs.readFileSync(file, "utf8")
);

process.exit(
    pkg.scripts && pkg.scripts.build
        ? 0
        : 1
);
NODE
    then
        echo ""
        echo "Building $dir"

        (
            cd "$dir"
            npm run build
        )
    fi
done
