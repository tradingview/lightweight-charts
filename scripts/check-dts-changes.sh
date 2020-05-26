#!/bin/bash
set -e

function print_usage {
  local this_filename=$(basename "$0")
  echo "Usage: $this_filename OUT_DIR BASE_GIT_REV COMPARE_GIT_REV"
  echo "       $this_filename ./dts-diff-out v1.0.0 master"
}

function print_step {
  echo ""
  echo "====================" $1 "===================="
}

function generate_dts_for_rev {
  local git_rev=$1
  local dts_filename=$2

  print_step "Checkout to $git_rev"
  git checkout $git_rev

  print_step "Install deps"
  npm install

  print_step "Generate dts to $dts_filename"
  npm run clean
  npm run tsc
  npm run bundle-dts
  mv ./dist/typings.d.ts $dts_filename
}

if [ -z $1 ]; then
  print_usage
  exit 1
fi

if [ -z $2 ]; then
  print_usage
  exit 1
fi

if [ -z $3 ]; then
  print_usage
  exit 1
fi

OUT_DIR=$1
BASE_GIT_REV=$2
COMPARE_GIT_REV=$3

mkdir -p $OUT_DIR

BASE_DTS_FILE=$OUT_DIR/base.d.ts
COMPARE_DTS_FILE=$OUT_DIR/compare.d.ts
DIFF_FILE=$OUT_DIR/changes.diff

generate_dts_for_rev $BASE_GIT_REV $BASE_DTS_FILE
generate_dts_for_rev $COMPARE_GIT_REV $COMPARE_DTS_FILE

print_step "Calcalate diffs"

set +e

# out file is to save diff to storage and use as artifacts
$(git diff --exit-code --no-index $BASE_DTS_FILE $COMPARE_DTS_FILE > $DIFF_FILE)
exit_code=$?

if [ $exit_code -ne 0 ]; then
  print_step "Diff output"
  cat $DIFF_FILE
fi;

exit $exit_code
