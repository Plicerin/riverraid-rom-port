#!/bin/sh

if [ $# -eq 0 ]; then
        echo 'Missing byte count'
        exit
fi

BYTES=$1

dcc6502/dcc6502 -m $BYTES baserom.a26 | sed '/^;/d' | cut -c 8- > baserom.dasm
dcc6502/dcc6502 -m $BYTES rom.a26 | sed '/^;/d' | cut -c 8- > rom.dasm

diff -u baserom.dasm rom.dasm
