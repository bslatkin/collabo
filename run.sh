#!/bin/bash

# To make this work, install the JSX package described here:
# http://facebook.github.io/react/docs/getting-started.html#offline-transform

trap 'kill $(jobs -p)' EXIT

python -m SimpleHTTPServer 8080 . &
jsx --watch src build
