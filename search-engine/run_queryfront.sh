#!/bin/bash

DIRNAME=`dirname -- "$0"`
SCRIPT_PATH="$DIRNAME/queryfront.js"

node $SCRIPT_PATH $1
