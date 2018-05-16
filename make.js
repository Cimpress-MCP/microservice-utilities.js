#!/usr/bin/env node

/**
 * Module dependencies
 */
const commander = require('commander');
const fs = require('fs-extra');
const packageMetadata = require('./package.json');
const ci = require('ci-build-tools')(process.env.GIT_TAG_PUSHER);

const version = ci.GetVersion();
commander.version(version);

/**
 * Build
 */
commander
  .command('build')
  .description('Setup require build files for npm package.')
  .action(async () => {
    packageMetadata.version = version;
    await fs.writeJson('./package.json', packageMetadata, { spaces: 2 });

    console.log('Building package %s (%s)', packageMetadata.name, version);
    console.log('');
  });

/**
 * After Build
 */
commander
  .command('after_build')
  .description('Publishes git tags and reports failures.')
  .action(() => {
    console.log('After build package %s (%s)', packageMetadata.name, version);
    console.log('');
    ci.PublishGitTag();
    ci.MergeDownstream('release/', 'master');
  });

commander.parse(process.argv);
