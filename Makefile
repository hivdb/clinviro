clinviro-frontend/build: $(shell find clinviro-frontend -not -path "clinviro-frontend/build/*" -a -not -path "clinviro-frontend/node_modules/*" -a -type f)
	@cd clinviro-frontend && yarn install && yarn build

force-build:
	@docker build . --force-rm --no-cache -t hivdb/clinviro:latest

build: requirements.txt
	@docker build . -t hivdb/clinviro:latest

# following are development commands, do not use them in production
# use docker image instead!
console:
	@docker run --rm -it hivdb/clinviro:latest shell

devdb:
	$(eval volumes = $(shell docker inspect -f '{{ range .Mounts }}{{ .Name }}{{ end }}' clinviro-devdb))
	@mkdir -p initdb.d
	@docker rm -f clinviro-devdb 2>/dev/null || true
	@docker volume rm $(volumes) 2>/dev/null || true
	@docker run \
		-d --name=clinviro-devdb \
		--publish 127.0.0.1:5435:5432 \
		--volume=$(shell pwd)/initdb.d:/docker-entrypoint-initdb.d \
		postgres:9.6

init_devdb:
	@pipenv run flask db upgrade

deves:
	@docker rm -f clinviro-deves 2>/dev/null || true
	@docker run \
		-d --name=clinviro-deves \
		--publish 127.0.0.1:9200:9200 \
		--publish 127.0.0.1:9300:9300 \
		elasticsearch:5-alpine

sync-deves:
	@pipenv run flask patients create-index --autoremove

sync-blastdb:
	@pipenv run flask makeblastdb

sync-schema:
	@pipenv run flask export-relay-schema clinviro-frontend/schema.json
	@rm -r clinviro-frontend/node_modules/.cache 2>/dev/null || true

psql-devdb:
	@psql -h localhost -p 5435 -U postgres

dumpdb:
	@mkdir -p local/
	@docker exec clinviro-devdb pg_dump -h localhost -U postgres -t "tbl_*" -t "alembic_*" -c postgres > local/clinviro_dump.sql
	@echo '`local/clinviro_dump.sql` created.'

dumpdb-without-patients:
	@mkdir -p local/
	@docker exec clinviro-devdb pg_dump -h localhost -U postgres -a -t tbl_clinics -t tbl_physicians > local/clinviro_dump-without_patients.sql
	@echo '`local/clinviro_dump-without_patients.sql` created.'

blastdb:
	@pipenv run flask makeblastdb

shell:
	@pipenv run flask shell

run-frontend: sync-schema
	@cd clinviro-frontend; yarn start

_run:
	@pipenv run gunicorn -w 4 -b 127.0.0.1:5000 --worker-class aiohttp.worker.GunicornWebWorker clinviro:aioapp

requirements.txt: Pipfile Pipfile.lock
	@pipenv lock --requirements > requirements.txt

run: sync-blastdb sync-schema _run

.PHONY: force-build build console devdb psql-devdb dumpdb psql-devdb-migrate dumpdb-without-patients blastdb shell run _run init_devdb
