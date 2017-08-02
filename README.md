ClinViro
========

ClinViro is an open source **L**aboratory **I**nformation **M**anagement **S**ystem (**LIMS**) which is dedicated to HIV genotypic resistance test for laboratories. The software was primarily created for the Stanford Health Care Virology Laboratory and we believed it might be useful for other virology laboratories.

Build and Installation
----------------------

We used Docker to provide a standardized environment for running ClinViro. To install the latest version of Docker, please follow the "Get Docker" guideline on the [official website](https://www.docker.com/). The minimum version requirement of Docker for this software is 17.05.

Once you installed Docker, you can build the production-level image by simply typing the following command. Don't forget to change the `[YOUR_TEAM_NAME]` to your customized name.

```sh
docker build . -t [YOUR_TEAM_NAME]/clinviro:latest
```
