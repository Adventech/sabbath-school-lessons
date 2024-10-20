#!/bin/bash

find ./dist/port/ss/*/ss/*/assets -type f -name "cover.png" -ignore_readdir_race | while read -r cover_image; do
  cover_dir=$(dirname "$cover_image")

  echo $cover_image

  ./runners/overlay/overlay.sh square "$cover_image" "$cover_dir"
  ./runners/overlay/overlay.sh landscape "$cover_image" "$cover_dir"

  echo "Processed $cover_image and saved the result in $cover_dir"
done