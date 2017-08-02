#! /bin/bash

set -e

if [[ $USE_SSL == "https" ]]; then
    cd /etc/lego
    lego --path="`pwd`" --email="$LEGO_EMAIL" --domains="$SERVER_NAME" --dns="route53" --accept-tos run
    kill -HUP $(cat /var/run/nginx.pid)
fi
