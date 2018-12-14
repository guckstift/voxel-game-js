#!/bin/bash

rollup src/generator.js --file bundles/generator.js --format iife --name generator
rollup src/server.js    --file bundles/server.js    --format iife --name server
