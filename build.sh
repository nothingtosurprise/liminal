#!/bin/bash
set -e

curl -sS https://getcomposer.org/installer | php -- --quiet
php composer.phar install --no-dev --optimize-autoloader --no-interaction --prefer-dist --working-dir=app

npm ci

npm run build
