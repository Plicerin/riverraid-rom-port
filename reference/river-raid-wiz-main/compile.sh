#!/bin/sh

rm rom.a26

wiz -o rom.a26 src/main.wiz

if sha1sum --status -c <<<"40329780402f8247f294fe884ffc56cc3da0c62d *rom.a26"; then
    echo "REV0 Ok!"
else
    echo "REV0 Diff :/"
fi
