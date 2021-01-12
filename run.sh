#!/bin/bash

while getopts ":l:q:" opt; do
  case $opt in
    l) lang="$OPTARG"
    ;;
    q) quarter="$OPTARG"
    ;;
    \?) echo "Invalid option -$OPTARG" >&2
    ;;
  esac
done

docker build -t adventech-ss .
docker run -i -t -p1313:1313 -v $(pwd)/src:/app/src --env LANG=${lang} --env QUARTER=${quarter} adventech-ss