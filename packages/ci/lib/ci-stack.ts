import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Repository } from 'aws-cdk-lib/aws-codecommit';
import { CodeBuildStep, CodePipeline, CodePipelineSource, ManualApprovalStep } from 'aws-cdk-lib/pipelines';
import { BuildSpec } from 'aws-cdk-lib/aws-codebuild';
import { ExampleStage } from 'app';

export interface CiStackProps extends StackProps {
  repositoryName: string;
  branch: string;
  pipelinePackageName: string;
  accounts: {
    dev?: string;
    int?: string;
    prod?: string;
  };
}

export class CiStack extends Stack {
  public constructor(scope: Construct, id: string, props: CiStackProps) {
    super(scope, id, props);

    const repository = new Repository(this, 'Git', {
      repositoryName: props.repositoryName,
    });

    // SelfUpdate Pipeline
    const pipeline = new CodePipeline(this, 'Pipeline', {
      crossAccountKeys: true,
      synth: new CodeBuildStep('SynthStep', {
        input: CodePipelineSource.codeCommit(repository, props.branch),
        installCommands: ['npm set unsafe-perm true', 'npm install -g aws-cdk@2'],
        commands: [
          'npm ci',
          'npm run bootstrap',
          'npm run prettier:check',
          'npm run lint',
          'npm run test',
          'cd packages/' + props.pipelinePackageName,
          'cdk synth',
        ],
        partialBuildSpec: BuildSpec.fromObject({
          phases: {
            build: {
              finally: ['npm run merge-coverage'],
            },
          },
          reports: {
            coverage: {
              'file-format': 'CLOVERXML',
              files: ['coverage/clover.xml'],
            },
            tests: {
              'file-format': 'JUNITXML',
              files: ['**/junit.xml'],
            },
          },
        }),
      }),
    });

    // DEV STAGE
    if (props.accounts.dev) {
      pipeline.addStage(
        new ExampleStage(this, 'Dev', {
          env: {
            account: props.accounts.dev,
          },
        }),
        {}
      );
    }

    // INT STAGE
    if (props.accounts.int) {
      pipeline.addStage(
        new ExampleStage(this, 'Int', {
          env: {
            account: props.accounts.int,
          },
        }),
        {
          pre: [new ManualApprovalStep('ApproveInt')],
        }
      );
    }

    // PROD STAGE
    if (props.accounts.prod) {
      pipeline.addStage(
        new ExampleStage(this, 'Prod', {
          env: {
            account: props.accounts.prod,
          },
        }),
        {
          pre: [new ManualApprovalStep('ApproveProd')],
        }
      );
    }
  }
}
