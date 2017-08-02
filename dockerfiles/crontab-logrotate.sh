#! /bin/bash

set -e

FOLDER=$(date +"%Y-%m")
TODAY=$(date +"%Y-%m-%d")

cd /app/logs
mkdir -p $FOLDER
mv nginx-access.log $FOLDER/nginx-access.$TODAY.log
mv nginx-error.log $FOLDER/nginx-error.$TODAY.log
kill -USR1 `cat /var/run/nginx.pid`
mv gunicorn-error.log $FOLDER/gunicorn-error.$TODAY.log
kill -USR1 `cat /var/run/gunicorn.pid`
sleep 1
gzip $FOLDER/nginx-access.$TODAY.log
gzip $FOLDER/nginx-error.$TODAY.log
gzip $FOLDER/gunicorn-error.$TODAY.log
