#!/bin/bash

rollup src/generator.js --file src/generator.bundle.js --format iife --name generator
rollup src/server.js --file src/server.bundle.js --format iife --name generator
