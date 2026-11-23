#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
prefix="$(git rev-parse --show-prefix)"
git config core.hooksPath "${prefix}.githooks"
