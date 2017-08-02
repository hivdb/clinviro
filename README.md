ClinViro
========

ClinViro is an open source **L**aboratory **I**nformation **M**anagement **S**ystem (**LIMS**) for HIV genotypic resistance testing. ClinViro is designed for laboratories that use the Stanford HIV Drug Resistance Database (HIVDB) genotypic resistance interpretation system that wish to (1) store the program's results locally and (2) link their sequences and resistance reports to additional data such as sample data, demographic data, clinic/physician name, and clinical trial. ClinViro uses Sierra web service 2.0 to send sequences to the [Stanford HIVDB webserver](https://hivdb.stanford.edu/page/release-notes/) where the data are analyzed and returned in JSON format but not stored. ClinViro compares each new sequence to previous sequences from the same person and to each of the other sequences in the database. These comparisons make it possible to detect PCR contamination and sample mix-up thereby helping labs identify potential critical errors prior to data analysis and reporting. 

Prerequisites
-------------

We used Docker to provide a standardized environment for running ClinViro. To install the latest version of Docker, please follow the "Get Docker" guideline on the [official website](https://www.docker.com/). The minimum version requirement of Docker for this software is 17.05.

The latest Docker image can be found at [hub.docker.com](https://hub.docker.com/r/hivdb/clinviro/). The current latest version is 0.3.0. If you are following the [next section](#deployment) to deploy ClinViro, you don't have to do anything to download the image manually.

Deployment
----------

To start running ClinViro, you just need to create a `docker-compose.yml` file on your server which Docker installed. Here is an example of the `docker-compose.yml` file. The environment variables will be explained after the example.

```yaml
version: '2'

services:
  web:
    image: hivdb/clinviro:latest
    ports:
      - "80:80"
      - "443:443"
    environment:
      SERVER_NAME: clinviro.example.com
      SECRET_KEY: SPAM_SPAM_SPAM_SPAM_SPAM_BAKED_BEANS
      USE_SSL: https
      AWS_ACCESS_KEY_ID: YOUR_AWS_ACCESS_KEY_ID
      AWS_SECRET_ACCESS_KEY: YOUR_AWS_SECRET_ACCESS_KEY
      AWS_REGION: us-west-1
      LEGO_EMAIL: email@example.com
    volumes:
      - /home/clinviro/logs:/app/logs
      - /home/clinviro/depotdata:/app/depotdata
      - /home/clinviro/lego:/etc/lego
  db:
    image: postgres:9.6
    volumes:
      - /home/clinviro/data:/var/lib/postgresql/data
  es:
    image: elasticsearch:5.4-alpine
```

The varibles:

| Name                    | Value Type | Required? | Default Value                               | Description                                                                |
|-------------------------|------------|-----------|---------------------------------------------|----------------------------------------------------------------------------|
| `SERVER_NAME`           | String     | Yes       | -                                           | Specify the domain you are going to use to access ClinViro                 |
| `SECRET_KEY`            | String     | Yes       | -                                           | A unique key you generated to protect user cookie data                     |
| `USE_SSL`               | String     | No        | -                                           | Specify lowercase string "https" to enable SSL support                     |
| `AWS_ACCESS_KEY_ID`     | String     | No        | -                                           | The AWS access key, required by `USE_SSL=https`                            |
| `AWS_SECRET_ACCESS_KEY` | String     | No        | -                                           | The AWS secret key, required by `USE_SSL=https`                            |
| `AWS_REGION`            | String     | No        | -                                           | The AWS region, required by `USE_SSL=https`                                |
| `LEGO_EMAIL`            | String     | No        | -                                           | Email address used to fetch SSL certification, required by `USE_SSL=https` |
| `DATABASE_URI`          | String     | Yes       | `postgrsql+psycopg2://postgres@db/postgres` | SQLAlchemy-compatible URI to access the database                           |
| `ELASTICSEARCH_HOST`    | String     | Yes       | `es:9200`                                   | URI to access Elasticsearch                                                |

The volumes in `web` container:

| Path             | Description                               |
|------------------|-------------------------------------------|
| `/app/logs`      | Location of website access and error logs |
| `/app/depotdata` | Location of report files stored           |
| `/etc/lego`      | Location of SSL certification stored      |

The volume in `db` container:

| Path                     | Description                   |
|--------------------------|-------------------------------|
| /var/lib/postgresql/data | Location of raw database data |

In the same folder of `docker-compose.yml` file, type following command to start service:

```sh
docker-compose up -d
```

Wait for about 1-2 minutes automatic initialization, then open the `SERVER_NAME` you previously configured. You should be able to see the login window.

You can configure PostgreSQL and/or ElasticSearch by add environment variables to `db` and `es` containers. The documents of the two images used by the containers can be found at:

- https://hub.docker.com/_/postgres/
- https://hub.docker.com/_/elasticsearch/


### SSL Support

The Docker image provides automatic SSL support (HTTPS) by using DNS-01 challenge of [Let's Encrypt](https://letsencrypt.org/). To enable the SSL support, you need to have an AWS account and have the domain specified in `SERVER_NAME` managed by [AWS Route 53](https://aws.amazon.com/route53/). Please ensure your IAM user was configured with [this IAM policy](https://github.com/xenolf/lego#aws-route-53).

FAQ
---

### Access database console

Once the service started, you can use this command to access PostgreSQL console. No password is needed if you didn't configure `postgres` image.

```sh
docker exec -it clinviro_db_1 psql -Upostgres
```

### Create/update a ClinViro user

ClinViro currently doesn't have any admin interface for managing users. You have to use SQL query to create a user to access the system. You also need to use a command to generate a hashed password for that user.

#### Step 1: generate hashed password

```python
python -c 'import crypt; print(crypt.crypt("PASSWORD","ST"))'
```

Replace `"PASSWORD"` to the password you want to use. Replace the hash salt `"ST"` to any 2 letters string.

#### Step 2a: Add the new user

To add a new user you need to insert a new record to the table `tbl_users`:

```sql
INSERT INTO "tbl_users"
    (email, password, created_at) VALUES
    ('user@example.com', 'hashed_password', CURRENT_TIMESTAMP);
```

Replace `'user@example.com'` to the new user's email address, and `'hashed_password'` to the hashed password you retrieved at step 1.

#### Step 2b: Update an user's password

```sql
UPDATE "tbl_users"
    SET password='hashed_password'
    WHERE email='user@example.com';
```

Copyright and Disclaimer
------------------------

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program.  If not, see http://www.gnu.org/licenses/.
