clinviro-frontend/build: $(shell find clinviro-frontend -not -path "clinviro-frontend/build/*" -a -not -path "clinviro-frontend/node_modules/*" -a -type f)
	@cd clinviro-frontend && npm install && npm run build

force-build:
	@docker build . --force-rm --no-cache -t hivdb/clinviro:latest

build:
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

deves:
	@docker rm -f clinviro-deves 2>/dev/null || true
	@docker run \
		-d --name=clinviro-deves \
		--publish 127.0.0.1:9200:9200 \
		--publish 127.0.0.1:9300:9300 \
		elasticsearch:5-alpine

sync-deves:
	@FLASK_APP=clinviro/__init__.py flask patients create_index --autoremove

sync-blastdb:
	@FLASK_APP=clinviro/__init__.py flask makeblastdb

sync-schema:
	@FLASK_APP=clinviro/__init__.py flask export_relay_schema clinviro-frontend/schema.json
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
	@FLASK_APP=clinviro/__init__.py flask makeblastdb

shell:
	@FLASK_APP=clinviro/__init__.py flask shell

run-frontend: sync-schema
	@cd clinviro-frontend; npm start

_run:
	@gunicorn -w 4 -b 127.0.0.1:5000 --worker-class aiohttp.worker.GunicornWebWorker clinviro:aioapp

run: sync-blastdb sync-schema _run

.PHONY: force-build build console devdb psql-devdb dumpdb psql-devdb-migrate dumpdb-without-patients blastdb shell run _run
