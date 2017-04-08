/usr/bin/env sh

aws s3 sync dist/ $1 --acl "public-read" --region us-east-1