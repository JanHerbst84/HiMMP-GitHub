#!/usr/bin/env bash
set -euo pipefail

storage_dir="${1:-/var/www/himmp-site/php/contact_submissions}"
owner="${2:-www-data}"
group="${3:-www-data}"

if [[ ! -d "$storage_dir" ]]; then
  echo "Contact storage directory does not exist: $storage_dir" >&2
  exit 1
fi

chown "$owner:$group" "$storage_dir"
chmod 0700 "$storage_dir"
find "$storage_dir" -maxdepth 1 -type f -exec chown "$owner:$group" {} +
find "$storage_dir" -maxdepth 1 -type f -exec chmod 0600 {} +

stat -c '%a %U:%G %n' "$storage_dir"
find "$storage_dir" -maxdepth 1 -type f -printf '%m %u:%g %f\n' | sort
