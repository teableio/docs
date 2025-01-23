---
description: Install teable with cloud or docker-compose
---

# Install Teable

## Overview

## Image Edition

Teable images are available in two editions: Enterprise Edition (EE) and Community Edition (CE). To switch between versions, simply add the "-ee" suffix to the image name.

### EE

{% hint style="info" %}
Enterprise Edition is now in the preview test, mail to support@teable.io we will give a 1-month trial license
{% endhint %}

```sh
# app
ghcr.io/teableio/teable-ee:latest
# migration
ghcr.io/teableio/teable-db-migrate-ee:latest
```

The Enterprise Edition offers free access to all features included in the Community Edition. It also supports the use of a License to subscribe to exclusive Enterprise features, which can be reviewed on the [~~pricing page~~](#user-content-fn-1)[^1]. Data in the Enterprise Edition is compatible with the Community Edition, allowing for interchangeable switching between versions.

### CE

```sh
# app
ghcr.io/teableio/teable:latest
# migration
ghcr.io/teableio/teable-db-migrate:latest
```

The Community Edition is an image built from open-source code and does not include any features of the Enterprise Edition. Data is compatible with the Enterprise Edition, allowing for seamless switching to the Enterprise version at any time.

### Migrate from the CE

{% content-ref url="migrating-from-docker-standalone-to-teable-enterprise.md" %}
[migrating-from-docker-standalone-to-teable-enterprise.md](migrating-from-docker-standalone-to-teable-enterprise.md)
{% endcontent-ref %}

Details

***

## One-Click Cloud Deployment

#### EE

{% hint style="info" %}
Enterprise Edition offers all of the Community Edition features for free. To activate Enterprise features:

* Deploy and copy the `Instance Id`
* Email support@teable.io with the `Instance Id` to get a trial LICENSE
{% endhint %}

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/NtH5uD?referralCode=rE4BjB)

[![Deploy on Sealos](https://raw.githubusercontent.com/labring-actions/templates/main/Deploy-on-Sealos.svg)](https://cloud.sealos.io/?openapp=system-template%3FtemplateName%3Dteable)

> Sealos supports deployment in China



#### CE

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/wada5e?referralCode=rE4BjB)

[![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/QF8695)

[![Deploy to RepoCloud](https://d16t0pc4846x52.cloudfront.net/deploylobe.svg)](https://repocloud.io/details/?app\_id=273)

[![Deploy on Elestio](https://elest.io/images/logos/deploy-to-elestio-btn.png)](https://elest.io/open-source/teable)

### Next steps

[Configure email service](docker-compose.md#qi-yong-you-jian-fu-wu)

***

## Docker Compose

Requirement

Ensure your server meets the following basic requirements:

* **Operating System**: Recommended to use a Linux distribution, such as Ubuntu 20.04 LTS.
* **Memory**: At least 4GB RAM.
* **CPU**: Minimum of 2 cores.
* **Disk Space**: At least 40GB of available space.
* **Network**: Stable internet connection with access to necessary ports.

Before you begin, make sure you have:

* Basic understanding of Docker and containerization principles.
* Docker and Docker Compose installed on your machine. Refer to the official Docker documentation for installation guides.

### **Install Docker**

```bash
curl -fsSL https://get.docker.com | bash


# verify
docker --version
docker-compose --version
```

### Install Teable

#### 1. create docker-compose YAML

Enter the server, create and navigate to the teable folder

```bash
mkdir teable

cd teable
```

Create a docker-compose.yaml file and a .env file, then paste the following content.

```sh
vim docker-compose.yaml
```

#### Minimum dependencies\*\*：\*\*

{% tabs %}
{% tab title="EE" %}
docker-compose.yaml:

```yaml
version: '3.9'

services:
  teable:
    image: ghcr.io/teableio/teable-ee:latest
    restart: always
    ports:
      - '3000:3000'
    volumes:
      - teable-data:/app/.assets:rw
    env_file:
      - .env
    environment:
      - NEXT_ENV_IMAGES_ALL_REMOTE=true
    networks:
      - teable
    depends_on:
      teable-db-migrate:
        condition: service_completed_successfully
      teable-cache:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      start_period: 5s
      interval: 5s
      timeout: 3s
      retries: 3

  teable-db:
    image: postgres:15.4
    restart: always
    ports:
      - '42345:5432'
    volumes:
      - teable-db:/var/lib/postgresql/data:rw
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    networks:
      - teable
    healthcheck:
      test: ['CMD-SHELL', "sh -c 'pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}'"]
      interval: 10s
      timeout: 3s
      retries: 3

  teable-db-migrate:
    image: ghcr.io/teableio/teable-db-migrate-ee:latest
    environment:
      - PRISMA_DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
    networks:
      - teable
    depends_on:
      teable-db:
        condition: service_healthy

  teable-cache:
    image: redis:7.2.4
    restart: always
    expose:
      - '6379'
    volumes:
      - teable-cache:/data:rw
    networks:
      - teable
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    healthcheck:
      test: ['CMD', 'redis-cli', '--raw', 'incr', 'ping']
      interval: 10s
      timeout: 3s
      retries: 3

networks:
  teable:
    name: teable-network

volumes:
  teable-db: {}
  teable-data: {}
  teable-cache: {}

```

.env:

```bash
# replace the default password
POSTGRES_PASSWORD=replace_this_password
REDIS_PASSWORD=replace_this_password
SECRET_KEY=replace_this_secret_key

# replace the following with a publicly accessible address
PUBLIC_ORIGIN=http://127.0.0.1:3000

# ---------------------

# Postgres
POSTGRES_HOST=teable-db
POSTGRES_PORT=5432
POSTGRES_DB=teable
POSTGRES_USER=teable

# Redis
REDIS_HOST=teable-cache
REDIS_PORT=6379
REDIS_DB=0

# App
PRISMA_DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
BACKEND_CACHE_PROVIDER=redis
BACKEND_CACHE_REDIS_URI=redis://default:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}
```
{% endtab %}

{% tab title="CE" %}
{% hint style="info" %}
Note: The minimum deployment of the Community Edition lacks Redis and cannot be directly upgraded to the Enterprise Edition. It is recommended to add the Redis component (see solution below).
{% endhint %}

**Without Redis**

docker-compose.yaml:

```yaml
version: '3.9'

services:
  teable:
    image: ghcr.io/teableio/teable:latest
    restart: always
    ports:
      - '3000:3000'
    volumes:
      - teable-data:/app/.assets:rw
    env_file:
      - .env
    environment:
      - NEXT_ENV_IMAGES_ALL_REMOTE=true
    networks:
      - teable
    depends_on:
      teable-db-migrate:
        condition: service_completed_successfully
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      start_period: 5s
      interval: 5s
      timeout: 3s
      retries: 3

  teable-db:
    image: postgres:15.4
    restart: always
    ports:
      - '42345:5432'
    volumes:
      - teable-db:/var/lib/postgresql/data:rw
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    networks:
      - teable
    healthcheck:
      test: ['CMD-SHELL', "sh -c 'pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}'"]
      interval: 10s
      timeout: 3s
      retries: 3

  teable-db-migrate:
    image: ghcr.io/teableio/teable-db-migrate:latest
    environment:
      - PRISMA_DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
    networks:
      - teable
    depends_on:
      teable-db:
        condition: service_healthy

networks:
  teable:
    name: teable-network

volumes:
  teable-db: {}
  teable-data: {}

```

.env:

```bash
# replace the default password
POSTGRES_PASSWORD=replace_this_password
SECRET_KEY=replace_this_secret_key

# replace the following with a publicly accessible address
PUBLIC_ORIGIN=http://127.0.0.1:3000

# ---------------------

# Postgres
POSTGRES_HOST=teable-db
POSTGRES_PORT=5432
POSTGRES_DB=teable
POSTGRES_USER=teable

# App
PRISMA_DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}

```

***

**Include Redis (Recommend)**

docker-compose-yaml\*\*:\*\*

```yaml
version: '3.9'

services:
  teable:
    image: ghcr.io/teableio/teable:latest
    restart: always
    ports:
      - '3000:3000'
    volumes:
      - teable-data:/app/.assets:rw
    env_file:
      - .env
    environment:
      - NEXT_ENV_IMAGES_ALL_REMOTE=true
    networks:
      - teable
    depends_on:
      teable-db-migrate:
        condition: service_completed_successfully
      teable-cache:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      start_period: 5s
      interval: 5s
      timeout: 3s
      retries: 3

  teable-db:
    image: postgres:15.4
    restart: always
    ports:
      - '42345:5432'
    volumes:
      - teable-db:/var/lib/postgresql/data:rw
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    networks:
      - teable
    healthcheck:
      test: ['CMD-SHELL', "sh -c 'pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}'"]
      interval: 10s
      timeout: 3s
      retries: 3

  teable-db-migrate:
    image: ghcr.io/teableio/teable-db-migrate:latest
    environment:
      - PRISMA_DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
    networks:
      - teable
    depends_on:
      teable-db:
        condition: service_healthy

  teable-cache:
    image: redis:7.2.4
    restart: always
    expose:
      - '6379'
    volumes:
      - teable-cache:/data:rw
    networks:
      - teable
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    healthcheck:
      test: ['CMD', 'redis-cli', '--raw', 'incr', 'ping']
      interval: 10s
      timeout: 3s
      retries: 3

networks:
  teable:
    name: teable-network

volumes:
  teable-db: {}
  teable-data: {}
  teable-cache: {}

```

env:

```bash
# replace the default password
POSTGRES_PASSWORD=replace_this_password
REDIS_PASSWORD=replace_this_password
SECRET_KEY=replace_this_secret_key

# replace the following with a publicly accessible address
PUBLIC_ORIGIN=http://127.0.0.1:3000

# ---------------------

# Postgres
POSTGRES_HOST=teable-db
POSTGRES_PORT=5432
POSTGRES_DB=teable
POSTGRES_USER=teable

# Redis
REDIS_HOST=teable-cache
REDIS_PORT=6379
REDIS_DB=0

# App
PRISMA_DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
BACKEND_CACHE_PROVIDER=redis
BACKEND_CACHE_REDIS_URI=redis://default:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}

```
{% endtab %}
{% endtabs %}

**Adding Storage Service (Optional):**

By default, Teable uses local storage to manage attachment resources. You can add MinIO or cloud storage for a more powerful and stable service.

{% tabs %}
{% tab title="docker-compose minio" %}
MinIO provides an additional storage management interface (port 9001) and a more robust and stable file service.

docker-compose.yaml:

```yaml
version: '3.9'

services:
  # ...previous content
  teable-storage:
    image: minio/minio:RELEASE.2024-02-17T01-15-57Z
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
    volumes:
      - teable-storage:/data:rw
    networks:
      - teable
    command: server /data --console-address ":9001"
  createbuckets:
    image: minio/mc
    networks:
      - teable
    entrypoint: >
      /bin/sh -c "
      /usr/bin/mc alias set teable-storage http://teable-storage:9000 ${MINIO_ACCESS_KEY} ${MINIO_SECRET_KEY};
      /usr/bin/mc mb teable-storage/public;
      /usr/bin/mc anonymous set public teable-storage/public;
      /usr/bin/mc mb teable-storage/private;
      exit 0;
      "
    depends_on:
      teable-storage:
        condition: service_started

networks:
  teable:
    name: teable-network

volumes:
  teable-db: {}
  teable-cache: {}
  # Add an extra volume
  teable-storage: {}

```

.env:

```bash
# replace the default password
POSTGRES_PASSWORD=replace_this_password
REDIS_PASSWORD=replace_this_password
SECRET_KEY=replace_this_secret_key

# if enabled https please replace it
PROTOCAL=http
# Please set PUBLIC_HOST to the IP address or domain name of the currently deployed host. You cannot use localhost or 127.0.0.1.
PUBLIC_HOST=192.168.x.x
# Please modify the final port to the port of the official access address. If it's 80 or 443, you can remove the : and port number.
PUBLIC_ORIGIN=${PROTOCAL}://${PUBLIC_HOST}:3000

# ---------------------

# Postgres
POSTGRES_HOST=teable-db
POSTGRES_PORT=5432
POSTGRES_DB=teable
POSTGRES_USER=teable

# Redis
REDIS_HOST=teable-cache
REDIS_PORT=6379
REDIS_DB=0


# Minio
MINIO_ACCESS_KEY=teable_minio_access
MINIO_SECRET_KEY=${SECRET_KEY}

# App
PRISMA_DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
BACKEND_CACHE_PROVIDER=redis
BACKEND_CACHE_REDIS_URI=redis://default:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}
BACKEND_STORAGE_PROVIDER=minio
BACKEND_STORAGE_PUBLIC_BUCKET=public
BACKEND_STORAGE_PRIVATE_BUCKET=private
BACKEND_STORAGE_MINIO_USE_SSL=false # if https enabled please change it to true
BACKEND_STORAGE_MINIO_ENDPOINT=${PUBLIC_HOST}
BACKEND_STORAGE_MINIO_PORT=9000
BACKEND_STORAGE_MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
BACKEND_STORAGE_MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
BACKEND_STORAGE_MINIO_INTERNAL_ENDPOINT=teable-storage
BACKEND_STORAGE_MINIO_INTERNAL_PORT=9000
STORAGE_PREFIX=${PROTOCAL}://${PUBLIC_HOST}:${BACKEND_STORAGE_MINIO_PORT}
```
{% endtab %}

{% tab title="External minio" %}
You need to create two buckets on MinIO. One public bucket for storing avatars and form header images, and one private bucket for storing attachment contents.

.env:

```sh
# ...previous content
# minio provider
BACKEND_STORAGE_PROVIDER=minio
# public bucket name
BACKEND_STORAGE_PUBLIC_BUCKET=public
# private bucket name
BACKEND_STORAGE_PRIVATE_BUCKET=private
# minio endpoint ip or domain
BACKEND_STORAGE_MINIO_ENDPOINT=minio.example.com
# minio port
BACKEND_STORAGE_MINIO_PORT=443
# minio access key
BACKEND_STORAGE_MINIO_ACCESS_KEY=_minio_access_key_
# minio secret key
BACKEND_STORAGE_MINIO_SECRET_KEY=_minio_secret_key_
# full external address
STORAGE_PREFIX=https://minio.example.com
```
{% endtab %}

{% tab title="S3" %}
You need to create two buckets on S3. One public bucket for storing avatars and form header images, and one private bucket for storing attachment content.

.env:

```sh
# ...previous content
# use s3 standard provider
BACKEND_STORAGE_PROVIDER: s3
# region name
BACKEND_STORAGE_S3_REGION: us-east-2
# endpoint，protocal is required (https)
BACKEND_STORAGE_S3_ENDPOINT: https://s3.us-east-2.amazonaws.com
# access key
BACKEND_STORAGE_S3_ACCESS_KEY: access_key
# secret key
BACKEND_STORAGE_S3_SECRET_KEY: secret_key
# public bucket
BACKEND_STORAGE_PUBLIC_BUCKET: your-public-bucket
# private bucket
BACKEND_STORAGE_PRIVATE_BUCKET: your-private-bucket

```

The above process can be applied to most cloud providers, not just Amazon S3.
{% endtab %}
{% endtabs %}

**Starting the Application**

Execute the application launch command in the current directory. Once the startup is complete, access 127.0.0.1:3000 to enter the application.

{% hint style="info" %}
Note that if HTTPS is not configured, you won't be able to use the copy and paste functions within the tables.
{% endhint %}

```bash
docker-compose pull

docker-compose up -d
```

**Using a Hosted Database (Optional)**

If you wish to use a hosted database, you can further streamline the deployment process:

1. Remove `services.teable-db`
2. Remove `service.teable-db-migrate.depends_on`
3. Remove `volumes.teable-db`
4. Update the `.env` file, replacing it with the configuration for your hosted database

**Full example**

`docker-compose.yaml`

{% tabs %}
{% tab title="EE" %}
```sh
version: '3.9'

services:
  teable:
    image: ghcr.io/teableio/teable-ee:latest
    restart: always
    ports:
      - '3000:3000'
    env_file:
      - .env
    environment:
      - NEXT_ENV_IMAGES_ALL_REMOTE=true
    networks:
      - teable
    depends_on:
      teable-db-migrate:
        condition: service_completed_successfully
      teable-cache:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      start_period: 5s
      interval: 5s
      timeout: 3s
      retries: 3

  teable-db-migrate:
    image: ghcr.io/teableio/teable-db-migrate-ee:latest
    environment:
      - PRISMA_DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
    networks:
      - teable

  teable-cache:
    image: redis:7.2.4
    restart: always
    expose:
      - '6379'
    volumes:
      - teable-cache:/data:rw
    networks:
      - teable
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    healthcheck:
      test: ['CMD', 'redis-cli', '--raw', 'incr', 'ping']
      interval: 10s
      timeout: 3s
      retries: 3
networks:
  teable:
    name: teable-network
    driver: bridge

volumes:
  teable-cache: {}

```
{% endtab %}

{% tab title="CE" %}
```shell
version: '3.9'

services:
  teable:
    image: ghcr.io/teableio/teable:latest
    restart: always
    ports:
      - '3000:3000'
    env_file:
      - .env
    environment:
      - NEXT_ENV_IMAGES_ALL_REMOTE=true
    networks:
      - teable
    depends_on:
      teable-db-migrate:
        condition: service_completed_successfully
      teable-cache:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      start_period: 5s
      interval: 5s
      timeout: 3s
      retries: 3

  teable-db-migrate:
    image: ghcr.io/teableio/teable-db-migrate-ee:latest
    environment:
      - TZ=${TIMEZONE}
      - PRISMA_DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
    networks:
      - teable

  teable-cache:
    image: redis:7.2.4
    restart: always
    expose:
      - '6379'
    volumes:
      - teable-cache:/data:rw
    networks:
      - teable
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    healthcheck:
      test: ['CMD', 'redis-cli', '--raw', 'incr', 'ping']
      interval: 10s
      timeout: 3s
      retries: 3
networks:
  teable:
    name: teable-network
    driver: bridge

volumes:
  teable-cache: {}

```
{% endtab %}
{% endtabs %}

**.env**

Fill in the database parameters with the connection parameters for your hosted database.

```sh
POSTGRES_HOST=your-database.com
POSTGRES_PORT=5432
POSTGRES_DB=teable
POSTGRES_USER=teable
```

{% hint style="info" %}
Note that `127.0.0.1` is the internal network of the container. If you want to connect to a database deployed on your local machine, do not use `127.0.0.1` for `POSTGRES_HOST`. Instead, use `host.docker.internal` as the local address, otherwise, the connection will fail.
{% endhint %}

**The same principle applies if you're using an externally hosted Redis:**

* Remove service.teable-cache
* Remove service.teable.depends\_on.teable-cache
* Remove volumes.teable-cache
* Update the .env file, replacing it with the configuration for your hosted Redis

### Next steps

[Configure email service](docker-compose.md#qi-yong-you-jian-fu-wu)

[Configure external database connection for base](docker-compose.md#qi-yong-wai-bu-shu-ju-ku-lian-jie-gong-neng)

***

## Enabling email service

Enabling the email service allows for in-site email notifications, user self-service password changes, and other features. Please configure the following environment variables according to your email service provider's information to enable the email service:

```
BACKEND_MAIL_HOST=mail.example.com
BACKEND_MAIL_PORT=465
BACKEND_MAIL_SECURE=true
BACKEND_MAIL_SENDER=noreply@company.com
BACKEND_MAIL_SENDER_NAME=noreply
BACKEND_MAIL_AUTH_USER=username
BACKEND_MAIL_AUTH_PASS=usertoken
```

## Enabling external database connection for base

<figure><img src="../.gitbook/assets/image (31).png" alt="" width="563"><figcaption></figcaption></figure>

Teable can automatically create database roles within the application to allow secure access to table data from external applications. To enable this feature, you need to additionally configure the `PUBLIC_DATABASE_PROXY` environment variable.

This parameter should be set to an externally accessible database IP or domain + port number. If you're using the docker-compose deployment method mentioned earlier, the external access port would be 45432. For other deployment methods, please configure according to your specific setup.

```
PUBLIC_DATABASE_PROXY=db-proxy.example.com:port
```

## Environment variables

[Environment variables table](docker-compose.md#environment-variables)

***

## Support and Feedback

If you encounter any issues during the deployment process, please contact our support team at [support@teable.io](mailto:support@teable.io) or submit an [issue](https://github.com/teableio/teable/issues).

## License

The Teable Community Edition is open-source under the AGPL-3.0 license. For the Enterprise Edition, please contact us to obtain a commercial license.

[^1]: Not yet released
