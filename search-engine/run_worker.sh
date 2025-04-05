#!/bin/bash

DIRNAME=`dirname -- "$0"`
SCRIPT_PATH="$DIRNAME/../distribution.js"
INSPECT_PORT="1$1"

node --inspect=$INSPECT_PORT $SCRIPT_PATH --ip '127.0.0.1' --port $1
