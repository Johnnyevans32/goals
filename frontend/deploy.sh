#!/bin/bash

echo "Building frontend for Vercel deployment..."
npm run build

echo "Build completed successfully!"
echo "You can now deploy to Vercel using:"
echo "vercel --prod"