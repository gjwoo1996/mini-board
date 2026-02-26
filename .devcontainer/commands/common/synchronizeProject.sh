#!/usr/bin/env bash

if [ "$ENABLE_AUTO_SYNC" = false ]; then
    echo "🔄 Auto sync is disabled"
    exit 0
fi

echo "🔄 Installing dependencies"
yarn

echo "🔄 Initializing Projen"
yarn projen

echo "✅ Synchronization is complete"