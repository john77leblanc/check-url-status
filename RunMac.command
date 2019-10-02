#!/bin/sh
cd `dirname $0`
cd \.script
clear
node checkUrl
cd ..
cd \links
open link_results.txt