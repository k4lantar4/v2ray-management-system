#!/bin/sh

# Install required type definitions
npm install --save-dev \
  @types/react@18.2.0 \
  @types/react-dom@18.2.0 \
  @types/node@18.0.0 \
  @types/stylis@4.2.0 \
  @types/next@9.0.0 \
  @types/next-intl@2.0.0 \
  @types/mui__material@5.14.0 \
  @types/mui__icons-material@5.14.0

# Create types directory if it doesn't exist
mkdir -p src/types

# Create next-env.d.ts if it doesn't exist
if [ ! -f next-env.d.ts ]; then
  echo "Creating next-env.d.ts..."
  cat > next-env.d.ts << 'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
EOF
fi

# Make the script executable
chmod +x scripts/install-types.sh
