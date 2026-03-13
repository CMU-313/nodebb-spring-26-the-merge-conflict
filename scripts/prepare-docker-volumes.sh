#!/bin/sh
# Helper script to create and set permissions on host directories used by the
# various docker-compose files.  When the project runs with bind-mounted
# volumes under `.docker/database` the directories must already exist and be
# writable by the Docker daemon.  Otherwise users are forced to `chmod` each
# path manually, which is what the student was doing in the example command.

set -e

# list of required directories relative to project root
DIRS="
.docker/database/redis
.docker/database/mongo/data
.docker/database/postgresql/data
.docker/build
.docker/public/uploads
.docker/config
"

for d in $DIRS; do
    if [ ! -d "$d" ]; then
        echo "creating $d"
        mkdir -p "$d"
    fi
    # ensure directory and its parents are writable by all
    chmod o+rw "$d" 2>/dev/null || true
    find "$d" -type d -exec chmod o+rw {} + 2>/dev/null || true
    find "$d" -type f -exec chmod o+r {} + 2>/dev/null || true

    # if this is the redis directory, also set ownership to uid 999 (redis user)
    if [ "$d" = ".docker/database/redis" ]; then
        chown -R 999:999 "$d" 2>/dev/null || true
    fi

done

# make top-level .docker tree readable
chmod o+rx .docker 2>/dev/null || true

echo "docker volume directories are prepared"