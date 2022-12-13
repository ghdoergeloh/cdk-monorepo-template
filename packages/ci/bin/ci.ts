#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Stack } from 'aws-cdk-lib';
import { CiStack } from '../lib/ci-stack';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { resConfig } from './config.res';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export interface CiConfig {
  /**
   * The name of the application. This will prefix the stacks e.g. ApplicationName-Dev-StackName.
   */
  applicationName: string;
  /**
   * The name of the repository that will be generated and where the code will be stored.
   */
  repositoryName: string;
  /**
   * The branch that will be tracked by the ci.
   */
  branch: string;
  /**
   * A secret containing the credentials needed to connect to the sonarqube. It contains the host
   * url, the token, the client certificate and the password for the client certificate. The client
   * certificate must be in the pkcs12 format and encoded with base64, so it can be handled in the
   * json format.
   *
   * You can generate the string as follows: `base64 client-cert.p12 > client-cert.txt`
   *
   * NOTE: Don't forget to set the project name and project specific settings in
   * `sonar-project.properties`
   *
   * The complete json should look like this:
   *
   * @example
   *   {
   *     "SONAR_LOGIN": "<sonarqube token>",
   *     "SONAR_HOST_URL": "<sonarqube url>",
   *     "CLIENT_CERT_KEYSTORE": "<base64 encoded pkcs12 keystore of the client cert>",
   *     "CLIENT_CERT_KEYSTORE_PASSWORD": "<keystore password>"
   *   }
   */
  sonarqubeSecretName: string;
  /**
   * Name of the ECR that provides the sonarsource/sonar-scanner-cli docker image (a copy from the
   * docker-hub) that will be used by the SonarqubeStep.
   */
  sonarscannerEcrName: string;
  /**
   * Domain of the registry, where the non-private packages should be published, or dependencies can
   * be pulled from.
   *
   * NOTE: Don't forget to configure the `.npmrc`. The environment variable CODEARTIFACT_AUTH_TOKEN
   * will be filled by the pipeline and can be referenced in the config file.
   */
  npmRegistryDomain?: string;
  /**
   * Set this to true if you want to publish the non-private packages in this repository. Requires
   * `npmRegistryDomain` to be set.
   */
  publishPublicPackages?: boolean;
}

const app = new cdk.App();

const inputStack = new Stack();
const sonarqubeSecret = Secret.fromSecretNameV2(inputStack, 'SonarqubeSecret', resConfig.sonarqubeSecretName);
const sonarscannerRepo = ecr.Repository.fromRepositoryName(
  inputStack,
  'SonarscannerRepo',
  resConfig.sonarscannerEcrName
);

new CiStack(app, resConfig.applicationName + 'Ci', {
  branch: resConfig.branch,
  applicationName: resConfig.applicationName,
  repositoryName: resConfig.repositoryName,
  sonarqubeSecret: sonarqubeSecret,
  sonarscannerRepo: sonarscannerRepo,
  npmRegistryDomain: resConfig.npmRegistryDomain,
  publishPublicPackages: resConfig.publishPublicPackages,
  configs: {},
  env: {
    region: 'eu-west-1',
  },
});
