#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { ExampleStage } from '../lib/index';

const app = new App();

new ExampleStage(app, 'Dev');
