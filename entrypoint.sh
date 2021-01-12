node deploy.js -b test ${LANG:+ -l ${LANG}} ${QUARTER:+ -q ${QUARTER}}
cd web && hugo --bind "0.0.0.0" -DF server;