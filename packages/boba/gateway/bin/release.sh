#!/bin/bash

## Get the latest tag from git

GIT_TAG=$(git tag -l --sort=-creatordate | head -n 1)
echo "$GIT_TAG"

## Remove v from latest tag name

NEW_VERSION="${GIT_TAG:1}"
echo "Latest git tag $NEW_VERSION"

## Load the current version of gateway package.

CURRENT_VERSION=$(node -p "require('./package.json').version");
echo "Current package version  $CURRENT_VERSION"

## Replace the current version tag with new version in package.json
sed -i '' "s/${CURRENT_VERSION}/${NEW_VERSION}/g" ./package.json

UPDATED_VERSION=$(node -p "require('./package.json').version");
echo "Package version updated to  $UPDATED_VERSION"
