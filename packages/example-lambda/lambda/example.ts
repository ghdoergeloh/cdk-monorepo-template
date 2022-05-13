import { Handler } from 'aws-lambda';
import fetch from 'node-fetch';

interface ExampleEvent {
  test: string;
}

export const handler: Handler<ExampleEvent, void> = async () => {
  const example = await fetch('https://example.com');
  console.log(example);
  return;
};
