FROM postgres:16

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY infra/azure/production/relay-entrypoint.sh /usr/local/bin/relay-entrypoint.sh
RUN chmod 0755 /usr/local/bin/relay-entrypoint.sh
