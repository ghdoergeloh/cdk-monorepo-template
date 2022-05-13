import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { IBucket } from 'aws-cdk-lib/aws-s3';

export interface ExampleLambdaProps {
  bucket: IBucket;
}

export class ExampleLambda extends Construct {
  public constructor(scope: Construct, id: string, props: ExampleLambdaProps) {
    super(scope, id);

    new NodejsFunction(this, 'Example', {
      entry: path.join(__dirname, '../lambda/example.ts'),
      bundling: {
        target: 'node14',
      },
      environment: {
        BUCKET_NAME: props.bucket.bucketName,
      },
    });
  }
}
