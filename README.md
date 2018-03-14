ClinViro
========

ClinViro is an open source **L**aboratory **I**nformation **M**anagement **S**ystem (**LIMS**) for HIV genotypic resistance testing. ClinViro is designed for laboratories that use the Stanford HIV Drug Resistance Database (HIVDB) genotypic resistance interpretation system that wish to (1) store the program's results locally and (2) link their sequences and resistance reports to additional data such as sample data, demographic data, clinic/physician name, and clinical trial. ClinViro uses Sierra web service 2.0 to send sequences to the [Stanford HIVDB webserver](https://hivdb.stanford.edu/page/release-notes/) where the data are analyzed and returned in JSON format but not stored. ClinViro compares each new sequence to previous sequences from the same person and to each of the other sequences in the database. These comparisons make it possible to detect PCR contamination and sample mix-up thereby helping labs identify potential critical errors prior to data analysis and reporting. 

Prerequisites
-------------

We used Docker to provide a standardized environment for running ClinViro. To install the latest version of Docker, please follow the "Get Docker" guideline on the [official website](https://www.docker.com/). The minimum version requirement of Docker for this software is 17.05.

The latest Docker image can be found at [hub.docker.com](https://hub.docker.com/r/hivdb/clinviro/). The current latest version is 0.3.2. If you are following the [next section](#deployment) to deploy ClinViro, you don't have to do anything to download the image manually.

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

| Path                                  | Description                                    |
|---------------------------------------|------------------------------------------------|
| `/app/logs`                           | Location of website access and error logs      |
| `/app/depotdata`                      | Location of report files stored                |
| `/etc/lego`                           | Location of SSL certification stored           |
| `/etc/nginx/snippets/clinviro.*.conf` | Location for extra site configurations (nginx) |

The volume in `db` container:

| Path                     | Description                   |
|--------------------------|-------------------------------|
| /var/lib/postgresql/data | Location of raw database data |

In the same folder of `docker-compose.yml` file, type following command to start service:

```sh
docker-compose up -d
```

Wait for about 1-2 minutes automatic initialization, then open the `SERVER_NAME` you previously configured. You should be able to see the login window.

You can configure PostgreSQL and/or ElasticSearch by adding environment variables to `db` and `es` containers. The documents of the two images used by the containers can be found at:

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

### Merge two physician records

```sql
SELECT [TARGET_PHYSICIAN_ID] as physician_id INTO TEMP TABLE target_physician;
SELECT [PHYSICIAN_ID_1] as physician_id INTO TEMP TABLE physician_to_be_merged;

-- if you have more physicians
INSERT INTO physician_to_be_merged (physician_id) VALUES ([PHYSICIAN_ID_2]);
INSERT INTO physician_to_be_merged (physician_id) VALUES ([PHYSICIAN_ID_3]);

UPDATE tbl_patient_samples s
  SET physician_id=t.physician_id
  FROM target_physician t, physician_to_be_merged m
  WHERE m.physician_id=s.physician_id;

DELETE FROM tbl_physicians WHERE id IN (SELECT physician_id FROM physician_to_be_merged);

-- optional
UPDATE tbl_physicians p
  SET
     lastname=[NEW_LAST_NAME],
     firstname=[NEW_FIRST_NAME]
  FROM target_physician t
  WHERE p.id=t.physician_id;
```

### Merge two patient records

It is possible to merge two patient records to a single one.

#### Step 1: Specify target ptnum and ptnum(s) to be merged:

```sql
SELECT [TARGET_PTNUM] as ptnum INTO TEMP TABLE target_ptnum;
SELECT [PTNUM_1] as ptnum INTO TEMP TABLE ptnum_to_be_merged;

-- if you have more ptnums
INSERT INTO ptnum_to_be_merged (ptnum) VALUES (PTNUM_2);
INSERT INTO ptnum_to_be_merged (ptnum) VALUES (PTNUM_3);
...
```

#### Step 2: Update `tbl_medical_records`:

```sql
INSERT INTO "tbl_medical_records"
  (mrid, ptnum)
  SELECT mrid, t.ptnum FROM target_ptnum t, tbl_medical_records mr
  WHERE
    EXISTS (
      SELECT 1 FROM ptnum_to_be_merged d
      WHERE d.ptnum=mr.ptnum
    ) AND
    NOT EXISTS (
      SELECT 1 FROM tbl_medical_records mr2
      WHERE mr2.mrid=mr.mrid AND mr2.ptnum=t.ptnum
    );
```

#### Step 3: Update `tbl_patient_visits`:

```sql
UPDATE "tbl_patient_visits" v
  SET ptnum=t.ptnum
  FROM target_ptnum t
  WHERE
    v.ptnum IN (SELECT ptnum FROM ptnum_to_be_merged) AND
    NOT EXISTS (
      SELECT 1 FROM tbl_patient_visits v2
      WHERE
        v.collected_at=v2.collected_at AND
        v2.ptnum=t.ptnum
    );
```

#### Step 4: Update `tbl_patient_samples`:

```sql
UPDATE "tbl_patient_samples" s
  SET patient_visit_id=v.id
  FROM target_ptnum t, tbl_patient_visits v, tbl_patient_visits v2
  WHERE
    v.ptnum=t.ptnum AND v2.id=patient_visit_id AND
    v.collected_at=v2.collected_at AND
    v2.ptnum IN (SELECT ptnum FROM ptnum_to_be_merged);
```

#### Step 5: Delete redundant records

```sql
DELETE FROM "tbl_patient_samples" s WHERE EXISTS (SELECT 1 FROM tbl_patient_visits v, ptnum_to_be_merged d WHERE v.id=s.patient_visit_id AND v.ptnum=d.ptnum);
DELETE FROM "tbl_patient_visits" v WHERE v.ptnum IN (SELECT ptnum FROM ptnum_to_be_merged);
DELETE FROM "tbl_medical_records" mr WHERE mr.ptnum IN (SELECT ptnum FROM ptnum_to_be_merged);
DELETE FROM "tbl_patients" p WHERE p.ptnum IN (SELECT ptnum FROM ptnum_to_be_merged);
```

### Delete patient records

#### Step 1: Specify target ptnum(s):

```sql
SELECT [PTNUM_1] as ptnum INTO TEMP TABLE ptnum_to_be_deleted;

-- if you have more ptnums
INSERT INTO ptnum_to_be_deleted (ptnum) VALUES (PTNUM_2);
INSERT INTO ptnum_to_be_deleted (ptnum) VALUES (PTNUM_3);
...
```

#### Step 2: Store foreign keys:

```sql
SELECT v.id as id
  INTO TEMP TABLE visit_to_be_deleted
  FROM "tbl_patient_visits" v, "ptnum_to_be_deleted" d
  WHERE v.ptnum=d.ptnum;

SELECT s.id as id
  INTO TEMP TABLE sample_to_be_deleted
  FROM "tbl_patient_samples" s, "visit_to_be_deleted" vd
  WHERE s.patient_visit_id=vd.id;

SELECT sr.report_id as id
  INTO TEMP TABLE report_to_be_deleted
  FROM "tbl_patient_sample_reports" sr, "sample_to_be_deleted" sd
  WHERE sr.patient_sample_id=sd.id;

SELECT s.sequence_id as id
  INTO TEMP TABLE seq_to_be_deleted
  FROM "tbl_patient_samples" s, "sample_to_be_deleted" sd
  WHERE s.id=sd.id;
```

#### Step 3: Remove relationship

```sql
UPDATE "tbl_patient_samples" s
  SET sequence_id=null
  WHERE EXISTS (SELECT 1 FROM "sample_to_be_deleted" sd WHERE sd.id=s.id);
```

#### Step 4: Deletion

```sql
DELETE FROM "tbl_patient_sample_reports" sr WHERE
  EXISTS (
    SELECT 1 FROM "sample_to_be_deleted" sd WHERE sd.id=sr.patient_sample_id
  );

DELETE FROM "tbl_reports" r WHERE
  EXISTS (SELECT 1 FROM "report_to_be_deleted" rd WHERE rd.id=r.id);

DELETE FROM "tbl_sequences" seq WHERE
  EXISTS (SELECT 1 FROM "seq_to_be_deleted" sqd WHERE sqd.id=seq.id);

DELETE FROM "tbl_patient_samples" s WHERE
  EXISTS (SELECT 1 FROM "sample_to_be_deleted" sd WHERE sd.id=s.id);

DELETE FROM "tbl_patient_visits" v WHERE
  EXISTS (SELECT 1 FROM "visit_to_be_deleted" vd WHERE vd.id=v.id);

DELETE FROM "tbl_medical_records" mr WHERE
  EXISTS (SELECT 1 FROM "ptnum_to_be_deleted" pd WHERE pd.ptnum=mr.ptnum);

DELETE FROM "tbl_patients" p WHERE
  EXISTS (SELECT 1 FROM "ptnum_to_be_deleted" pd WHERE pd.ptnum=p.ptnum);
```

Copyright and Disclaimer
------------------------

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program.  If not, see http://www.gnu.org/licenses/.

Donation
--------

If you find ClinViro useful and wish to donate to the HIVDB team, you can do
so through [Stanford Make a Gift][donation] form. Your contribution will be
greatly appreciated.

[donation]: https://giving.stanford.edu/goto/shafergift
