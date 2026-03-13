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
done

# make them writable by everyone; binder mount will inherit the mode
chmod -R o+rw .docker

echo "docker volume directories are prepared"