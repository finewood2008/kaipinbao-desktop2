#!/bin/bash

# Define the name of the executable
EXE_NAME="YourAppName"

# Change to the project directory
cd "./path-to-your-react-app"

# Install dependencies
npm install

# Build the React app
npm run build

# Move to the build directory
cd build

# Package the Electron app
npm run package

echo "Build and packaging completed."
