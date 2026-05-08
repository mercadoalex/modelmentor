#!/bin/bash

VITE_TEMP="node_modules/.vite-temp"
if [ -L "$VITE_TEMP" ]; then
    rm "$VITE_TEMP"
    mkdir -p "$VITE_TEMP"
elif [ ! -e "$VITE_TEMP" ]; then
    mkdir -p "$VITE_TEMP"
fi

# Use a local dist folder instead of /workspace/.dist (CI-only path)
OUTDIR="node_modules/.vite-temp/dist"
mkdir -p "$OUTDIR"

OUTPUT=$(npx vite build --minify false --logLevel error --outDir "$OUTDIR" 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo "$OUTPUT"
fi

exit $EXIT_CODE
