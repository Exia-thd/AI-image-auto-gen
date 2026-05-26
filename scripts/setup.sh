#!/bin/bash
echo "Setting up Chibi Event App..."
npm install
cd client && npm install
cd ..
mkdir -p server/data/cache
echo "Setup complete! Run: npm run dev"
