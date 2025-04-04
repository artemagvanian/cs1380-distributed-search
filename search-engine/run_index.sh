#!/bin/bash

DIRNAME=`dirname -- "$0"`
SCRIPT_PATH="$DIRNAME/index.js"

(NODE_TLS_REJECT_UNAUTHORIZED=0 node --stack-size=8192 --max-old-space-size=16384 $SCRIPT_PATH $1) < urls.txt
