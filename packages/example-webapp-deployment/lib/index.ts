import { Construct } from 'constructs';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';
import { IBucket } from 'aws-cdk-lib/aws-s3';

export interface ExampleWebappDeploymentProps {
  websiteBucket: IBucket;
}

export class ExampleWebappDeployment extends Construct {
  public constructor(scope: Construct, id: string, props: ExampleWebappDeploymentProps) {
    super(scope, id);

    new BucketDeployment(this, 'DeployWebsite', {
      sources: [Source.asset(path.join(__dirname, '../web/build'))],
      destinationBucket: props.websiteBucket,
    });
  }
}
