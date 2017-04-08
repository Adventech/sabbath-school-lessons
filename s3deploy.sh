#!/bin/bash

aws s3 sync dist/ s3://sabbath-school-stage.adventech.io --acl "public-read" --region us-east-1