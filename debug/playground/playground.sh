#!/bin/sh

set -eu

: "${WWW:=wwwroot}"
: "${CLEAN:=}"
: "${HOST:=localhost}"
: "${PORT:=5173}"

npm() {
	printf "[playground] npm %s\n" "$*" >&2
	command npm "$@"
}

cd() {
	printf "\n[playground] cd %s\n" "$*" >&2
	builtin cd "$@"
}

lwc="$(git rev-parse --show-toplevel)"
playground="$(dirname $(readlink -f $0))"

cd "$lwc"
if [ ! -e "$(npm prefix -g)/lib/node_modules/lightweight-charts" ]; then
	npm link >/dev/null 2>&1
fi

cd "$playground"
if [ "$CLEAN" = "1" ]; then
	rm -fr ./node_modules ./package-lock.json
fi

if [ ! -d node_modules ]; then
	npm install --no-audit
	npm link lightweight-charts >/dev/null 2>&1
fi

cd "$WWW"

if [ ! -e index.html ]; then
	cp index.html.example index.html
	cp src/main.ts.example src/main.ts
fi

npm exec vite -- "." \
	--clearScreen=false \
	--logLevel=info \
	--host $HOST \
	--port $PORT
