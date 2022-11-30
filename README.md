# Project Name

## Description

...

## Repository basics

This repository is based on a Template for cdk. The idea is based on the descriptions in this
[best practices guide from AWS](https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html). As this guide says a cdk
app is seperated into packages which each consists of one cdk app or cdk construct libraries which again are build out
of other construct libraries.

![Image from AWS best practices guide](https://docs.aws.amazon.com/cdk/v2/guide/images/code-organization.jpg)

The purpose of this template is to give you the possibility to organize your apps and libraries. As the guide says you
should start with an app build out of constructs and extract them as needed and fitting to the code lifecycle and team
ownership.

To make the extraction as easy as possible and to decouple the packages from the beginning, this template is created as
a multi package repository. Each package either exports a cdk construct as a package or it is a cdk app that can be
published.

Each **repo** should have one ci package which is a cdk app that deploys a CodeCommit repository and a CodePipeline.

Furthermore:

- each **app-repo** should have at least one app that will be deployed by the pipeline.
- each **library-repo** should have at least one construct library package that will be published by the pipeline to an
  artifactory.

## Working with this repository

This project uses lerna to manage this multi-package-/mono-repository. If you need more information, have a look at
[the Github documentation](https://github.com/lerna/lerna).

It is recommended to install lerna. You can also use it from the dependency installation by referencing the right path,
e.g.:

```shell
node_modules/.bin/lerna bootstrap
```

### install

To start working with this project, you can install all dependencies:

```shell
npm ci
```

### overview

To get an overview of all packages in this repository managed by lerna (which are also sub packages like a react app),
you can run this command:

```shell
npm run list
```

### compile

To build the code run:

```shell
npm run build
```

If you are working on the code of a package you can automatically compile every change, so that the referencing package
can use the .js and .d.ts files.

```shell
npm run watch
```

### format

We recommend to use prettier to format everything in the same way on each developer system. You can run prettier to
format the code or to check if everything is formatted correctly in the pipeline.

```shell
npm run prettier:write
npm run prettier:check
```

### lint

The root package also includes a predefined eslint configuration. This will be executed on each package, if it is not
listed in `.eslintignore` or has its own eslint configuration (which could also be an extension). You can run it by
executing this command:

```shell
npm run lint
```

### test

Each package defines its own tests and can use its own testing library. The test scripts of a package should be
executable by a `npm run test`. Each test should also generate a json coverage report on the sub path
`coverage/coverage-final.json`. You can run all tests by executing the following command in the root folder:

```shell
npm run test
```

The coverage then can be merged in a single file by running this command:

```shell
npm run collect-reports
```

This will copy all `coverage-final.json` files into `./.nyc_output`, run a merged report for the whole repository,
create a merged unit test report and collect them in the `reports` folder.

### commit

This template uses [conventional commits](https://www.conventionalcommits.org/) to resolve the next version bump and to
generate the changelogs. When you run `npm install` it will install a git hook using husky to run a prettier check
before each commit and to lint the commit message using `commitlint`. a conventional commit uses this pattern:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

The type is one of these:

| Commit Type | Title                    | Description                                                                                                 | Emoji |
| ----------- | ------------------------ | ----------------------------------------------------------------------------------------------------------- | :---: |
| `feat`      | Features                 | A new feature                                                                                               |  ✨   |
| `fix`       | Bug Fixes                | A bug fix                                                                                                   |  🐛   |
| `docs`      | Documentation            | Documentation only changes                                                                                  |  📚   |
| `style`     | Styles                   | Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)      |  💎   |
| `refactor`  | Code Refactoring         | A code change that neither fixes a bug nor adds a feature                                                   |  📦   |
| `perf`      | Performance Improvements | A code change that improves performance                                                                     |  🚀   |
| `test`      | Tests                    | Adding missing tests or correcting existing tests                                                           |  🚨   |
| `build`     | Builds                   | Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)         |   🛠   |
| `ci`        | Continuous Integrations  | Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs) |  ⚙️   |
| `chore`     | Chores                   | Other changes that don't modify src or test files                                                           |  ♻️   |
| `revert`    | Reverts                  | Reverts a previous commit                                                                                   |   🗑   |

If you have a breaking change, you need to add a `!` after the type or add `BREAKING CHANGE: <explanation>` as a footer.
Some IDEs have plugins to support conventional commits and commitlint.

IntelliJ:

- [Conventional Commit](https://plugins.jetbrains.com/plugin/13389-conventional-commit)
- [Commitlint Conventional Commit](https://plugins.jetbrains.com/plugin/14046-commitlint-conventional-commit)

### update

If you need to update the external dependencies of all packages at once to the newest version you can use this command:

```shell
npm run update-packages
```

This will update the package.json interactively. But to update the package-lock.json to the newest versions you need to
run this command:

```shell
npm run update-packagelock
```

Afterwards you can install the dependencies again as described above.

### add a new dependency

To add package A as a new dependency of package B, you can use lerna. `A` can be a public package from a repository or
the name of a package in this repository that is known to lerna (see [overview](#overview)).

```shell
lerna add <package-name-A> --scope=<package-name-B>
```

### add a new package

To add a new package you can follow these steps:

- Create a new folder under packages
- Init CDK in this new folder
  - Use `app` if you want to create a deployable app that uses libs.
  - Use `lib` if you want to create a construct library that can be used in other libs or apps.

```shell
mkdir packages/<package-name>
cd packages/<package-name>
cdk init <lib|app> --language typescript
```

#### optional:

- Now you can update the dependencies of new packages by using the [update scripts](#update).
- You can use the predefined `tsconfig.json` by simply extending it. Replace the content with:

```json
{
  "extends": "../../tsconfig.json",
  "include": ["bin", "src", "lib", "test"]
}
```

- You can also replace the `jest.config.js` with this improved typescript version as `jest.config.ts`, that won't make
  trouble with compiled js files, adds the coverage and junit reporter and is compatible with commonjs and ES-modules.
  For the junit reporter you also need to install. `jest-junit` and `jest-sonar-reporter`.

```typescript
import { defaults } from 'jest-config';
import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'], // or other folders if you want to place the test next to the tested unit
  testMatch: ['**/?(*.)+(spec|test).+(ts|tsx|mts)'],
  modulePathIgnorePatterns: ['.*__mocks__.*\\.m?jsx?$'], // to ignore compiled mocks
  moduleFileExtensions: ['mts', 'ts', 'tsx', ...defaults.moduleFileExtensions], // to make sure that ts files are preferred
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.m?[tj]sx?$': '$1', // to fix jest module resolution with TS + ESM
  },
  extensionsToTreatAsEsm: ['.mts'], // to enable ESM for TS (like top level await)
  clearMocks: true,
  restoreMocks: true,
  collectCoverage: true,
  reporters: ['default', 'jest-junit'],
  testResultsProcessor: 'jest-sonar-reporter',
  // setupFiles: ['<rootDir>/jest.env.ts'], // if you want to define env vars for the test
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: false }],
    '^.+\\.mtsx?$': ['ts-jest', { useESM: true }],
  },
  transformIgnorePatterns: ['node_modules/.*'],
};
export default config;
```
