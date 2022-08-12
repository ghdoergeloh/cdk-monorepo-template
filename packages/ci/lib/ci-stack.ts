import { Aws, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Repository } from 'aws-cdk-lib/aws-codecommit';
import { CodeBuildStep, CodePipeline, CodePipelineSource, ManualApprovalStep } from 'aws-cdk-lib/pipelines';
import {
  BuildEnvironmentVariableType,
  BuildSpec,
  Cache,
  ComputeType,
  LinuxBuildImage,
  LocalCacheMode,
  ReportGroup,
  ReportGroupType,
} from 'aws-cdk-lib/aws-codebuild';
import { ExampleStage } from 'app';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { Grant, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { PipelineNotificationEvents } from 'aws-cdk-lib/aws-codepipeline';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import path from 'path';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export interface CiStackProps extends StackProps {
  repositoryName: string;
  branch: string;
  sonarqubeSecret: ISecret;
  sonarscannerRepo: ecr.IRepository;
  npmRegistryDomain: string;
  configs: {
    dev?: StackProps;
    int?: StackProps;
    prod?: StackProps;
  };
}

export class CiStack extends Stack {
  public constructor(scope: Construct, id: string, props: CiStackProps) {
    super(scope, id, props);

    const directories = __dirname.split(path.sep);
    const pipelinePackageName = directories[directories.lastIndexOf('packages') + 1];

    const repository = new Repository(this, 'Git', {
      repositoryName: props.repositoryName,
    });

    const sourceCode = CodePipelineSource.codeCommit(repository, props.branch, {
      codeBuildCloneOutput: true,
    });

    const codeartifactArn = 'arn:aws:codeartifact:' + Aws.REGION + ':' + Aws.ACCOUNT_ID + ':';

    const testReports = new ReportGroup(this, props.repositoryName + '/TestReports', {
      type: ReportGroupType.TEST,
    });
    const coverageReports = new ReportGroup(this, props.repositoryName + '/CoverageReports', {
      type: ReportGroupType.CODE_COVERAGE,
    });

    const buildAndTestStep = new CodeBuildStep('BuildAndTestStep', {
      input: sourceCode,
      buildEnvironment: {
        buildImage: LinuxBuildImage.STANDARD_6_0,
        computeType: ComputeType.MEDIUM,
      },
      cache: Cache.local(LocalCacheMode.CUSTOM),
      rolePolicyStatements: [
        // see https://docs.aws.amazon.com/codeartifact/latest/ug/auth-and-access-control-iam-identity-based-access-control.html
        new PolicyStatement({
          actions: ['sts:GetServiceBearerToken'],
          resources: ['*'],
          conditions: {
            StringEquals: {
              'sts:AWSServiceName': 'codeartifact.amazonaws.com',
            },
          },
        }),
        new PolicyStatement({
          resources: [
            codeartifactArn + 'domain/' + props.npmRegistryDomain,
            codeartifactArn + 'repository/' + props.npmRegistryDomain + '/*',
            codeartifactArn + 'package/' + props.npmRegistryDomain + '/*',
          ],
          actions: [
            'codeartifact:GetAuthorizationToken',
            'codeartifact:ReadFromRepository',
            'codeartifact:PublishPackageVersion',
          ],
        }),
      ],
      installCommands: ['npm set unsafe-perm true', 'export PATH=$PATH:$(pwd)/node_modules/.bin'],
      commands: [
        'export CODEARTIFACT_AUTH_TOKEN=`aws codeartifact get-authorization-token --domain ' +
          props.npmRegistryDomain +
          ' --query authorizationToken --output text`',
        'npm ci --prefer-offline',
        'npm run build',
        'npm run prettier:check',
        'npm run lint',
        'npm run test',
        'lerna publish from-package --no-private -y',
        'cd packages/' + pipelinePackageName,
        'cdk synth -q',
      ],
      primaryOutputDirectory: 'packages/' + pipelinePackageName + '/cdk.out',
      partialBuildSpec: BuildSpec.fromObject({
        phases: {
          install: {
            'runtime-versions': { nodejs: '16' },
          },
          build: {
            finally: ['cd $CODEBUILD_SRC_DIR', 'npm run collect-reports'],
          },
        },
        reports: {
          [coverageReports.reportGroupArn]: {
            'file-format': 'CLOVERXML',
            files: ['coverage/clover.xml'],
          },
          [testReports.reportGroupArn]: {
            'file-format': 'JUNITXML',
            files: ['**/junit.xml'],
          },
        },
        cache: {
          paths: ['/root/.npm'],
        },
      }),
    });

    const sonarScanStep = new CodeBuildStep('SonarqubeStep', {
      input: sourceCode,
      additionalInputs: {
        reports: buildAndTestStep.addOutputDirectory('reports'),
        'cdk.out': buildAndTestStep,
      },
      buildEnvironment: {
        buildImage: LinuxBuildImage.fromEcrRepository(props.sonarscannerRepo, '4.7'),
        computeType: ComputeType.MEDIUM,
        environmentVariables: {
          SONAR_LOGIN: {
            type: BuildEnvironmentVariableType.SECRETS_MANAGER,
            value: props.sonarqubeSecret.secretName + ':SONAR_LOGIN',
          },
          SONAR_HOST_URL: {
            type: BuildEnvironmentVariableType.SECRETS_MANAGER,
            value: props.sonarqubeSecret.secretName + ':SONAR_HOST_URL',
          },
          CLIENT_CERT_KEYSTORE: {
            type: BuildEnvironmentVariableType.SECRETS_MANAGER,
            value: props.sonarqubeSecret.secretName + ':CLIENT_CERT_KEYSTORE',
          },
          CLIENT_CERT_KEYSTORE_PASSWORD: {
            type: BuildEnvironmentVariableType.SECRETS_MANAGER,
            value: props.sonarqubeSecret.secretName + ':CLIENT_CERT_KEYSTORE_PASSWORD',
          },
        },
      },
      commands: [
        'echo $CLIENT_CERT_KEYSTORE | base64 -d > client-cert.p12',
        'export SONAR_SCANNER_OPTS="-Djavax.net.ssl.keyStore=$(pwd)/client-cert.p12 -Djavax.net.ssl.keyStorePassword=$CLIENT_CERT_KEYSTORE_PASSWORD"',
        'sonar-scanner -Dsonar.login=$SONAR_LOGIN -Dsonar.host.url=$SONAR_HOST_URL',
        'rm ./client-cert.p12',
      ],
      primaryOutputDirectory: 'cdk.out',
    });

    // SelfUpdate Pipeline
    const pipeline = new CodePipeline(this, 'Pipeline', {
      crossAccountKeys: true,
      synth: sonarScanStep,
    });

    // DEV STAGE
    if (props.configs.dev) {
      pipeline.addStage(new ExampleStage(this, 'Dev', props.configs.dev), {});
    }

    // INT STAGE
    if (props.configs.int) {
      pipeline.addStage(new ExampleStage(this, 'Int', props.configs.int), {
        pre: [new ManualApprovalStep('ApproveInt')],
      });
    }

    // PROD STAGE
    if (props.configs.prod) {
      pipeline.addStage(new ExampleStage(this, 'Prod', props.configs.prod), {
        pre: [new ManualApprovalStep('ApproveProd')],
      });
    }

    pipeline.buildPipeline();

    testReports.grantWrite(buildAndTestStep);
    // coverageReports.grantWrite(buildAndTestStep);
    // not working till https://github.com/aws/aws-cdk/issues/21534 is solved. Therefore ->
    Grant.addToPrincipal({
      grantee: buildAndTestStep,
      actions: ['codebuild:CreateReport', 'codebuild:UpdateReport', 'codebuild:BatchPutCodeCoverages'],
      resourceArns: [coverageReports.reportGroupArn],
    });

    const pipelineExecutionFailedTopic = new Topic(this, 'PipelineExecutionFailed', {
      masterKey: pipeline.pipeline.artifactBucket.encryptionKey, // just use the same key for this topic (cheaper)
    });

    // Grant decrypt access to pipeline notifications
    pipeline.pipeline.artifactBucket.encryptionKey?.grant(
      new ServicePrincipal('codestar-notifications.amazonaws.com'),
      'kms:GenerateDataKey*',
      'kms:Decrypt'
    );

    pipeline.pipeline.notifyOn('NotifyFailedExecution', pipelineExecutionFailedTopic, {
      events: [PipelineNotificationEvents.PIPELINE_EXECUTION_FAILED],
    });
  }
}
