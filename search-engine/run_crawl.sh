#!/bin/bash

DIRNAME=`dirname -- "$0"`
SCRIPT_PATH="$DIRNAME/crawl.js"

(NODE_TLS_REJECT_UNAUTHORIZED=0 node --stack-size=8192 $SCRIPT_PATH $1) > urls.txt
