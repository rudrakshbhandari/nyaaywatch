FROM postgres:16

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY infra/azure/production/restore-entrypoint.sh /usr/local/bin/restore-entrypoint.sh
RUN chmod 0755 /usr/local/bin/restore-entrypoint.sh
