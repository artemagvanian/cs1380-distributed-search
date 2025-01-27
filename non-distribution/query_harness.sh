#!/bin/bash

cat /dev/null >query_time.log

terms=(
    "centuri instanc"
    "check stuff"
    "govern agenc research"
    "moscow west"
    "zone"
)

for term in "${terms[@]}"; do
  echo "[query] querying $term">/dev/stderr
  (time ./query.js "$term") &>> query_time.log
done
