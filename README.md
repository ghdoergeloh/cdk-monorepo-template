# Project Name

## Description

This is a Template for a cdk based project. The idea is based on the descriptions in this
[best practices guide from AWS](https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html).
As this guide says a cdk app is seperated into packages which each consists of cdk construct libraries
or which again are build out of other construct libraries.

![structure](https://docs.aws.amazon.com/cdk/v2/guide/images/code-organization.jpg)

The purpose of this template is to give you the possibility to organize your apps and libraries.
As the guide says you should start with an app build out of constructs and extract them as needed
and fitting to the code lifecycle and team ownership.

To make the extraction as easy as possible and to decouple the packages in the beginning this template
is created as a multi package repository. Each package either exports a cdk construct as a package or
it is a cdk app that can be published.

Each **repo** should have one ci package which is a cdk app that deploys a CodeCommit repository and
a CodePipeline.

Furthermore:

- each **app-repo** should have at least one app that will be deployed by the pipeline.
- each **library-repo** should have at least one construct library package that will be published
  by the pipeline to an artifactory.

## Working with this template

This project uses lerna to manage this multi-package-/mono-repository. If you need more information,
have a look at [the Github documentation](https://github.com/lerna/lerna).

### install

To start working with this project, you can install all dependencies:

```shell
npm ci
npm run bootstrap
```

This will also run all prepublish scripts, which means, it will build the code, so packages can be used.
If you just want to install the dependencies run:

```shell
npm run install-deps
```

### overview

To get an overview of all packages in this repository managed by lerna (which are also sub packages
like a react app), you can run this command:

```shell
npm run list
```

### compile

To build the code run:

```shell
npm run build
```

If you are working on the code of a package you can automatically compile every change, so that the
referencing package can use the .js and .d.ts files.

```shell
npm run watch
```

### format

We recommend to use prettier to format everything in the same way on each developer system.
You can run prettier to format the code or to check if everything is formatted correctly in the pipeline.

```shell
npm run prettier:write
npm run prettier:check
```

### lint

The root package also includes a predefined eslint configuration. This will be executed on each package,
if it is not listed in `.eslintignore` or has its own eslint configuration
(which could also be an extension). You can run it by executing this command:

```shell
npm run lint
```

### test

Each package defines its own tests and can use its own testing library. The test scripts of a package
should be executable by a `npm run test`. Each test should also generate a json coverage report on the
sub path `coverage/coverage-final.json`. You can run all tests by executing the following command
in the root folder:

```shell
npm run test
```

The coverage then can be merged in a single file by running this command:

```shell
npm run merge-coverage
```

This will copy all `coverage-final.json` files into `./.nyc_output` and merge everything in the
`/coverage/coverage-final.json` at root level.

### update

If you need to update the external dependencies of all packages at once to the newest version
you can use this command:

```shell
npm run update-packages
```

This will update the package.json interactively. But to update the package-lock.json to the newest
versions you need to run this command:

```shell
npm run update-packagelock
```

Afterwards you can install the dependencies again as described above.
