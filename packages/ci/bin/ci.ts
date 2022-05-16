#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CiStack } from '../lib/ci-stack';

const app = new cdk.App();
new CiStack(app, 'CiStack', {
  pipelinePackageName: 'ci',
  branch: 'master',
  repositoryName: 'cdk-monorepo-template',
  accounts: { dev: '', int: '', prod: '' },
});
