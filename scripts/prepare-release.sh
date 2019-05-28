#!/bin/bash

set -e

export NODE_ENV=production
export BUILD_TAG=release

echo ">> Cleaning up..."
npm run clean

echo ">> Building a package..."
npm run build

echo ">> Cleaning up a package.json file..."
./node_modules/.bin/clear-package-json package.json --fields private -o package.json

echo "Package is ready to publish"
