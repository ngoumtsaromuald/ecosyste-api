#!/bin/sh

# Search Indexer Cron Script
# This script runs the search indexing tasks on a schedule

set -e

# Configuration
LOG_FILE="/app/logs/search/indexer-cron-$(date +%Y%m%d).log"
LOCK_FILE="/tmp/search-indexer.lock"
MAX_RUNTIME=3600  # 1 hour max runtime

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Cleanup function
cleanup() {
    if [ -f "$LOCK_FILE" ]; then
        rm -f "$LOCK_FILE"
    fi
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Check if another instance is running
if [ -f "$LOCK_FILE" ]; then
    PID=$(cat "$LOCK_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        log "Another indexer instance is running (PID: $PID). Exiting."
        exit 0
    else
        log "Stale lock file found. Removing."
        rm -f "$LOCK_FILE"
    fi
fi

# Create lock file
echo $$ > "$LOCK_FILE"

log "Starting search indexer cron job"

# Set timeout for the entire operation
timeout "$MAX_RUNTIME" node /app/dist/scripts/run-search-indexer.js 2>&1 | while IFS= read -r line; do
    log "$line"
done

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    log "Search indexer completed successfully"
elif [ $EXIT_CODE -eq 124 ]; then
    log "Search indexer timed out after ${MAX_RUNTIME} seconds"
else
    log "Search indexer failed with exit code: $EXIT_CODE"
fi

# Cleanup old log files (keep last 7 days)
find /app/logs/search -name "indexer-cron-*.log" -mtime +7 -delete 2>/dev/null || true

log "Search indexer cron job finished"

exit $EXIT_CODE