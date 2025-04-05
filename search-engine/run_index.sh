#!/bin/bash

DIRNAME=`dirname -- "$0"`
SCRIPT_PATH="$DIRNAME/index.js"

(node $SCRIPT_PATH $1) < urls.txt
