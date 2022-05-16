import { handler } from './example';
import { Context } from 'aws-lambda';

describe('example', () => {
  it('should execute without error', async () => {
    const result = await handler({ test: 'test' }, createLambdaContext());
    expect(result).toEqual('<h1 id="heading">Heading</h1>\n');
  });
});

export function createLambdaContext(override: Partial<Context> = {}): Context {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: '',
    functionVersion: '',
    logGroupName: '',
    logStreamName: '',
    memoryLimitInMB: '',
    done(error?: Error, result?: unknown): void {
      console.log('done', error, result);
    },
    fail(error: Error | string): void {
      console.log('fail', error);
    },
    getRemainingTimeInMillis(): number {
      return 0;
    },
    succeed(message: unknown): void {
      console.log('succeed', message);
    },
    awsRequestId: 'testRequest-0001',
    invokedFunctionArn: 'test-function-name',
    ...override,
  };
}
