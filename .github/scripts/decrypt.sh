#!/bin/sh

gpg --quiet --batch --yes --decrypt --passphrase="$CREDS_PASSPHRASE" --output $HOME/deploy-creds.tar deploy-creds.tar.gpg