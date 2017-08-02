#! /bin/bash

if [[ "$1" == "shell" ]]; then
    bash
    exit
fi

NGINX_SITE_CONF="/app/nginx.vh.clinviro.unsafe.conf.template"
if [[ "$USE_SSL" == "https" ]]; then
    NGINX_SITE_CONF="/app/nginx.vh.clinviro.conf.template"
fi

sleep 2;
while ! echo exit | nc db 5432; do sleep 2; done
flask db upgrade
./crontab-blast.sh
./crontab-es.sh
gunicorn -w 4 -b 127.0.0.1:5000 -D clinviro:app --error-logfile /app/logs/gunicorn-error.log --pid /var/run/gunicorn.pid
/etc/init.d/cron start
cp /app/nginx.conf /etc/nginx/nginx.conf
cat $NGINX_SITE_CONF | sed -e "s#!SERVER_NAME!#${SERVER_NAME}#g" > /etc/nginx/sites-enabled/clinviro.conf
nginx -g "daemon off;"
