#!/usr/bin/env ts-node

import * as fsPromise from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import { getPackages } from '@lerna/project';
import { finished } from 'stream/promises';

interface FileError extends Error {
  code: string;
}

function isFileError(e: unknown): e is FileError {
  return !!e && typeof (e as Record<PropertyKey, unknown>)['code'] === 'string' && e instanceof Error;
}

async function mergeReports(dir: string, targetDir: string, reportFileName: string): Promise<void> {
  try {
    await fsPromise.mkdir(targetDir);
  } catch (e) {
    if (!isFileError(e) || e.code !== 'EEXIST') {
      throw e;
    }
  }
  const completeReportStream = fs.createWriteStream(path.join(targetDir, reportFileName));
  completeReportStream.write('<?xml version="1.0" encoding="UTF-8"?>\n<testExecutions version="1">\n');

  const packages = await getPackages();
  await Promise.all(
    packages.map(async (pkg) => {
      try {
        const report = await fsPromise.readFile(path.join(pkg.location, reportFileName));
        completeReportStream.write(
          report
            .toString()
            .split('\n')
            .slice(2, -1)
            .join('\n')
            .replaceAll(dir + path.sep, '') + '\n'
        );
      } catch (e) {
        if (!isFileError(e) || e.code !== 'ENOENT') {
          throw e;
        }
      }
    })
  );

  completeReportStream.write('</testExecutions>\n');
  completeReportStream.end();
  await finished(completeReportStream);
}

void mergeReports(__dirname, path.join(__dirname, 'reports'), 'test-report.xml');
