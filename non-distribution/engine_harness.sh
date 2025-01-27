#!/bin/bash

cat /dev/null >crawl_time.log
cat /dev/null >index_time.log

cat /dev/null >d/visited.txt
cat /dev/null >d/global-index.txt
echo https://cs.brown.edu/courses/csci1380/sandbox/1 >d/urls.txt

while read -r url; do

  if [[ "$url" == "stop" ]]; then
    # stop the engine if it sees the string "stop" 
    break;
  fi

  echo "[engine] crawling $url">/dev/stderr
  (time ./crawl.sh "$url" >d/content.txt) &>> crawl_time.log
  echo "[engine] indexing $url">/dev/stderr
  (time ./index.sh d/content.txt "$url") &>> index_time.log

  if  [[ "$(cat d/visited.txt | wc -l)" -ge "$(cat d/urls.txt | wc -l)" ]]; then
      # stop the engine if it has seen all available URLs
      break;
  fi

done < <(tail -f d/urls.txt)
