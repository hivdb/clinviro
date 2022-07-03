FROM node:12 AS builder
ENV LANG=C.UTF-8 DEBIAN_FRONTEND=noninteractive
WORKDIR /app
COPY clinviro-frontend/package.json clinviro-frontend/yarn.lock /app/
RUN yarn install
COPY clinviro-frontend /app
RUN yarn build

FROM python:3.9-bullseye AS pybuilder
ENV LANG=C.UTF-8 DEBIAN_FRONTEND=noninteractive
COPY requirements.txt /tmp/
RUN apt-get update -q && \
    apt-get install -qy \
      postgresql-client-13 \
      git build-essential tar \
      libpq-dev xz-utils curl libffi-dev \
      libfreetype6-dev libjpeg-dev libwebp-dev \
      libpng-dev liblcms2-dev libopenjp2-7-dev zlib1g-dev \
      libxml2-dev libxslt1-dev
RUN pip3.9 wheel -r /tmp/requirements.txt

FROM python:3.9-slim-bullseye
ENV LANG=C.UTF-8 DEBIAN_FRONTEND=noninteractive
COPY requirements.txt /tmp/
ARG BLASTVERSION=2.7.1
ARG LEGOVERSION=1.0.1
RUN apt-get update -q && \
    apt-get install --no-install-recommends texlive -qy && \
    apt-get install -qy \
      postgresql-client-13 bash cron \
      pandoc nginx-full lmodern netcat-traditional \
      git tar curl
RUN curl -s ftp://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/${BLASTVERSION}/ncbi-blast-${BLASTVERSION}+-x64-linux.tar.gz -o /tmp/blast.tar.gz && \
    cd /tmp; tar xvf blast.tar.gz && \
    cp /tmp/ncbi-blast-${BLASTVERSION}+/bin/blastn /usr/local/bin && \
    cp /tmp/ncbi-blast-${BLASTVERSION}+/bin/makeblastdb /usr/local/bin && \
    rm -rf /tmp/blast.tar.gz /tmp/ncbi-blast-${BLASTVERSION}+ && \
    curl -Ls https://github.com/xenolf/lego/releases/download/v${LEGOVERSION}/lego_v${LEGOVERSION}_linux_amd64.tar.gz -o /tmp/lego.tar.gz && \
    cd /tmp; mkdir -p lego; tar xvf lego.tar.gz -C lego && \
    cp /tmp/lego/lego /usr/local/bin/lego && \
    rm -rf /tmp/lego.tar.gz /tmp/lego && \
    mkdir -p /etc/lego && \
    rm /etc/nginx/sites-enabled/*
COPY --from=pybuilder /root/.cache /root/.cache
RUN pip3.9 install -r /tmp/requirements.txt && \
    rm -r /tmp/requirements.txt && \
    rm -rf /root/.cache
RUN echo "5 */1 * * * /app/crontab-blast.sh" > /tmp/_cron && \
    echo "4 4 * * * /app/crontab-es.sh" >> /tmp/_cron && \
    echo "3 3 * * 7 /app/crontab-lego.sh" >> /tmp/_cron && \
    echo "0 0 * * * /app/crontab-logrotate.sh" >> /tmp/_cron && \
    ln -s python3.9 /usr/bin/python && \
    cat /tmp/_cron | crontab - && rm /tmp/_cron && \
    mkdir -p /app/logs
WORKDIR /app
VOLUME /etc/lego
COPY dockerfiles/* /app/
COPY clinviro /app/clinviro
COPY --from=builder /app/build /app/html
ENV FLASK_APP=/app/clinviro/__init__.py \
    DATABASE_URI=postgresql+psycopg2://postgres@db/postgres \
    ELASTICSEARCH_HOST=es:9200 \
    DEPOT_STORAGE_PATH=/app/depotdata
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["prod"]
