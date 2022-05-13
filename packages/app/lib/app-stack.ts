import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { ExampleWebappDeployment } from 'example-webapp-deployment';
import { ExampleLambda } from 'example-lambda';

export class AppStack extends Stack {
  public constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const webBucket = new Bucket(this, 'WebBucket');
    new ExampleWebappDeployment(this, 'WebAppDeployment', {
      websiteBucket: webBucket,
    });

    new ExampleLambda(this, 'MyLambda', {
      bucket: webBucket,
    });
  }
}
