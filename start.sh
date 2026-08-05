#!/bin/sh
# Load environment variables from .env.production
if [ -f .env.production ]; then
  export $(grep -v '^#' .env.production | xargs)
fi

# Run the Next.js standalone server
exec node server.js
