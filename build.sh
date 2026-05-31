#!/bin/bash
set -e

composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --working-dir=app

npm ci

npm run build
