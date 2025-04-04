#!/bin/bash

DIRNAME=`dirname -- "$0"`
SCRIPT_PATH="$DIRNAME/../distribution.js"

NODE_TLS_REJECT_UNAUTHORIZED=0 node --stack-size=8192 --max-old-space-size=8192 $SCRIPT_PATH --ip '127.0.0.1' --port $1
