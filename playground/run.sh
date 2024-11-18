#!/bin/sh

set -eu

if [ ! -d dist ]; then
  npm run build
fi

npm link

cd playground

if [ ! -d node_modules ]; then
  npm install
fi

npm link lightweight-charts

exec npm exec vite >&2
