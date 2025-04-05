#!/bin/bash

DIRNAME=`dirname -- "$0"`
SCRIPT_PATH="$DIRNAME/crawl.js"

(node $SCRIPT_PATH $1 $2) > urls.txt
