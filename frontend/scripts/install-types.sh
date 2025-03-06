#!/bin/sh

# Install required type definitions
npm install --save-dev \
  @types/react@18.2.0 \
  @types/react-dom@18.2.0 \
  @types/node \
  @types/stylis \
  @types/stylis-plugin-rtl \
  @types/next

# Install MUI type definitions
npm install --save-dev \
  @mui/types \
  @mui/material \
  @mui/x-date-pickers

# Install other necessary type definitions
npm install --save-dev \
  @types/next-intl \
  @types/notistack

# Create types directory if it doesn't exist
mkdir -p src/types

# Create environment.d.ts if it doesn't exist
if [ ! -f src/types/environment.d.ts ]; then
  echo "Creating environment.d.ts..."
  cat > src/types/environment.d.ts << 'EOF'
/// <reference types="next" />
/// <reference types="react" />
/// <reference types="@mui/material" />
/// <reference types="@mui/x-date-pickers" />
/// <reference types="next-intl" />
/// <reference types="notistack" />
/// <reference types="stylis" />
/// <reference types="stylis-plugin-rtl" />
EOF
fi

# Make the script executable
chmod +x scripts/install-types.sh
