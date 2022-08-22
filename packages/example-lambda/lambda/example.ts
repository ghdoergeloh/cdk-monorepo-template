import type { Context } from 'aws-lambda';
import { marked } from 'marked';

/**
 * @see import('@types/aws-lambda').Handler
 */
export type Handler<TEvent, TResult> = (event: TEvent, context: Context) => Promise<TResult>;

interface ExampleEvent {
  test: string;
}

export const handler: Handler<ExampleEvent, string> = async () => {
  const example = marked('# Heading');
  return Promise.resolve(example);
};
