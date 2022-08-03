#!/bin/bash

echo '<?xml version="1.0" encoding="UTF-8"?>
<testExecutions version="1">'
for f in $@
do
  head -n -1  "$f" | tail -n +3
done
echo '</testExecutions>'
