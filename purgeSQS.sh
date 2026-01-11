#!/bin/bash

# Usage: ./purge_queues.sh "regex-pattern"

REGEX=$1

if [ -z "$REGEX" ]; then
  echo "Usage: $0 <regex-pattern>"
  exit 1
fi

# List all queues, filter with regex, purge them
aws sqs list-queues --output text --query 'QueueUrls[]' | tr '\t' '\n' | while read -r URL; do
  NAME=$(basename "$URL")
  if [[ "$NAME" =~ $REGEX ]]; then
    echo "Purging queue: $NAME ($URL)"
    aws sqs purge-queue --queue-url "$URL"
  fi
done
