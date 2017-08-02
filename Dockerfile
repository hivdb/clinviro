FROM node:8 AS builder
ENV LANG C.UTF-8
WORKDIR /app
COPY clinviro-frontend/package*.json /app/
RUN npm install
COPY clinviro-frontend /app
RUN npm run build

FROM ubuntu:xenial
ENV LANG C.UTF-8
COPY requirements.txt /tmp/
ARG BLASTVERSION=2.6.0
ARG LEGOVERSION=0.4.0
RUN apt-get update -q && \
    apt-get install --no-install-recommends texlive -qy && \
    apt-get install -qy \
      python3.5 postgresql-client-9.5 bash cron \
      pandoc nginx-full lmodern \
      git python3.5-dev netcat-traditional \
      build-essential tar \
      libpq-dev xz-utils \
      curl libffi-dev \
      libfreetype6-dev libjpeg-dev libwebp-dev \
      libpng12-dev liblcms2-dev libopenjpeg-dev zlib1g-dev \
      libxml2-dev libxslt1-dev && \
    curl -Ls https://bootstrap.pypa.io/get-pip.py | python3.5 - && \
    pip3.5 install -r /tmp/requirements.txt && \
    rm -r /tmp/requirements.txt && \
    rm -rf /root/.cache && \
    curl -s ftp://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/${BLASTVERSION}/ncbi-blast-${BLASTVERSION}+-x64-linux.tar.gz -o /tmp/blast.tar.gz && \
    cd /tmp; tar xvf blast.tar.gz && \
    cp /tmp/ncbi-blast-${BLASTVERSION}+/bin/blastn /usr/local/bin && \
    cp /tmp/ncbi-blast-${BLASTVERSION}+/bin/makeblastdb /usr/local/bin && \
    rm -rf /tmp/blast.tar.gz /tmp/ncbi-blast-${BLASTVERSION}+ && \
    curl -Ls https://github.com/xenolf/lego/releases/download/v${LEGOVERSION}/lego_linux_amd64.tar.xz -o /tmp/lego.tar.xz && \
    cd /tmp; mkdir -p lego; tar xvf lego.tar.xz -C lego && \
    cp /tmp/lego/lego_linux_amd64 /usr/local/bin/lego && \
    rm -rf /tmp/lego.tar.xz /tmp/lego && \
    mkdir -p /etc/lego && \
    apt-get remove -qy \
      git python3.5-dev \
      build-essential \
      libpq-dev xz-utils \
      curl libffi-dev \
      libfreetype6-dev libjpeg-dev libwebp-dev \
      libpng12-dev liblcms2-dev libopenjpeg-dev zlib1g-dev \
      libxml2-dev libxslt1-dev && \
    apt-get autoremove -qy && \
    rm /etc/nginx/sites-enabled/*
RUN echo "5 */1 * * * /app/crontab-blast.sh" > /tmp/_cron && \
    echo "4 4 * * * /app/crontab-es.sh" > /tmp/_cron && \
    echo "3 3 * * 7 /app/crontab-lego.sh" >> /tmp/_cron && \
    echo "0 0 * * * /app/crontab-logrotate.sh" >> /tmp/_cron && \
    ln -s python3.5 /usr/bin/python && \
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
