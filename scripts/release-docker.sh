#! /bin/bash

set -e

cd `dirname $0`/..
if [ -z "$1" ]; then
    echo "Usage: $0 <VERSION>" >&2
    exit 1
fi

docker pull node:12
docker pull python:3.9-bullseye AS pybuilder
docker pull python:3.9-slim-bullseye
docker build . -t hivdb/clinviro:latest
docker tag hivdb/clinviro:latest hivdb/clinviro:$1

docker push hivdb/clinviro:latest
docker push hivdb/clinviro:$1
