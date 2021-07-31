#!/bin/bash

while getopts ":l:q:r:" opt; do
  case $opt in
    l) lang="$OPTARG"
    ;;
    q) quarter="$OPTARG"
    ;;
    r) rebuild="true"
    ;;
    \?) echo "Invalid option -$OPTARG" >&2
    ;;
  esac
done

if [ ! -z "$rebuild" ]
  then
    docker build -t adventech-ss .
fi

docker run -i -t -p1313:1313 -v $(pwd)/src:/app/src --env LANG=${lang} --env QUARTER=${quarter} adventech-ss