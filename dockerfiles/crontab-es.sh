#! /bin/bash

set -e

if echo exit | nc db 5432; then
    if echo 'malformed' | nc es 9200 > /dev/null; then
        flask patients create-index --autoremove
    fi
fi
