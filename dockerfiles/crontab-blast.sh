#! /bin/bash

set -e

if echo exit | nc db 5432; then
    flask makeblastdb
fi
