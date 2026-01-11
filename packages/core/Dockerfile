FROM postgres:17.5

# Install pgvector extension
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-17-pgvector \
    && rm -rf /var/lib/apt/lists/*

# Entrypoint for PostgreSQL
CMD ["docker-entrypoint.sh", "postgres"]
