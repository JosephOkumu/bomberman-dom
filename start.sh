#!/bin/bash

# Start the WebSocket server in the background
node server.js &

# Start the http-server in the background
npx http-server &

# Open the browser (this command might vary depending on your OS)
# For macOS: open http://localhost:8081
# For Linux: xdg-open http://localhost:8081
# For Windows: start http://localhost:8081

xdg-open http://localhost:8081
