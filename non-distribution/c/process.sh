#!/bin/bash

# Convert input to a stream of non-stopword terms
# Usage: ./process.sh < input > output

# Convert each line to one word per line, **remove non-letter characters**, make lowercase, convert to ASCII; then remove stopwords (inside d/stopwords.txt)
# Commands that will be useful: tr, iconv, grep

while read -r line 
do
    for word in $(echo "$line" | grep -o -E "[A-Za-z]+")
    do
        trimmed=$(echo "$word" | tr -cd "[:alpha:]" | tr "[:upper:]" "[:lower:]" | iconv -f UTF8 -t ASCII)
        if ! grep -q -w "$trimmed" "d/stopwords.txt"
        then
            echo "$trimmed"
        fi
    done
done
