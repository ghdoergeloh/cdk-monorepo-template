import type { CiConfig } from './ci';

export const resConfig: CiConfig = {
  repositoryName: 'cdk-monorepo-template',
  branch: 'master',
  sonarqubeSecretName: 'sonarqube-secret',
  sonarscannerEcrName: 'sonarsource/sonar-scanner-cli',
  npmRegistryDomain: 'my-aws-registry',
};
