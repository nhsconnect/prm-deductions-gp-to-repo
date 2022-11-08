# prm-deductions-gp-to-repo 
### This repository is now archived. It was previously used to enable transferring health records from a GP practice to repository, however this functionality now lives within [EHR Transfer Service](https://github.com/nhsconnect/prm-repo-ehr-transfer-service).

This component is responsible for the deduction functionality.
When the patient becomes deducted from their previous practice and their health record becomes Orphaned/Stranded, the repository receives and stores the digital copy of it.

## Prerequisites

Follow the links to download

- [Node](https://nodejs.org/en/download/package-manager/#nvm) - version 14.x
- [Docker](https://docs.docker.com/install/)
- [kudulab/dojo](https://github.com/kudulab/dojo#installation)

In order to run npm install locally on your host, you'll need to install postgresql:
```
brew install postgresql
```

### AWS helpers

This repository imports shared AWS helpers from [prm-deductions-support-infra](https://github.com/nhsconnect/prm-deductions-support-infra/).
They can be found `utils` directory after running any task from `tasks` file.


## Directories

| Directory         | Description                                       |
| :---------------- | :------------------------------------------------ |
| /docs             | Contains documentation such as Plantuml diagrams  |
| /test/docker      | Contains smoke test for docker                    |
| /test/functional  | Contains end-to-end tests                         |
| /gocd             | Contains the GoCD pipeline files                  |
| /src              | The source code                                   |
| /terraform        | Terraform to deploy app as a Fargate task in AWS  |
| /scripts          | Useful scripts (e.g. for sending canary messages) |
| /utils            | Contains aws-helpers                              |


## Starting the app

### Locally

1. Run `npm install` to install all node dependencies.
2. Configure local environment variables:
   - enter `dojo`
   - run `./tasks _setup_test_integration_local`
3. Run `npm run start:local`
4. If successful, you will be able to reach the Swagger docs: [http://localhost:3000/swagger/](http://localhost:3000/swagger/)

Note: `npm run start:nodemon` can be used to build the app before launching the Express server on port `3000` using [nodemon](https://www.npmjs.com/package/nodemon) - it will watch and reload the server upon any file changes.

### Environment variables

Below are the environment variables that are automatically set:

- `NHS_ENVIRONMENT` - is set to the current environment in which the container is deployed. It is populated by the pipeline.gocd.yml
- `SERVICE_URL` - This is pre-populated by `tasks` and will configure it to service URL according to environment.
- `REPOSITORY_URI` - This is pre-populated by `tasks` (based on `IMAGE_REPO_NAME`)
- `AUTHORIZATION_KEYS` - a comma-separated list of Authorization keys. These are automatically taken from AWS Parameters Store in the 'dev' and 'test' environments.

### Debugging and testing the app docker image

A Docker image can be built locally with:

1. Run `./tasks build`
2. Run `./tasks build_docker_local`. This builds the docker containers `deductions/<component-name>:<commit-no>` and `deductions/<component-name>:latest` with the app in
3. Run `./tasks test_docker_local` to ensure the image has been built correctly
4. If the above fails, `./tasks run_docker_local` to debug production build

## Swagger

The swagger documentation for the app can be found at [http://localhost:3000/swagger](http://localhost:3000/swagger). To update it, change the
`src/swagger.json` file. You can use [this editor](https://editor.swagger.io/) which will validate your changes.

## Tests

### Run Test Locally

Make sure your IDE has all the required environment variables configured.
Use the test Dojofile with the preconfigured dependencies:
- enter `dojo -c Dojofile-itest`
- run `./tasks _test_unit` or `_test_integration` or `_test_functional`

Note: you can also run your rest directly from your IDE provided you configure your local environment variables first:
- enter `dojo`
- run `./tasks _setup_test_integration_local`

### Unit tests

Run the unit tests with `npm run test:unit` (or `npm test` to run it with lint)

### Integration tests
Enter `dojo -c Dojofile-itest`
Run `./tasks test_integration` to run within Dojo.

### Coverage tests
Runs the coverage tests (unit test and integration test) and collects coverage metrics.

Enter `dojo -c Dojofile-itest`
Run `./tasks test_coverage` to run within Dojo.

### Local Docker tests

Run `./tasks test_docker_local`. Make sure you have followed the steps to start the app in production mode beforehand.

### Functional tests

Run `./tasks test_functional`. This will run the end to end tests within [./test/functional](./test/functional). (Note you may need to be connected to VPN).

## Pre-commit Checks

Before committing, ensure you run the following tests:

1. Unit tests
2. Integration tests
3. Coverage tests
4. Local docker test

## Access to AWS from CLI

In order to get sufficient access to work with terraform or AWS CLI, please follow the instructions on this [confluence pages](https://gpitbjss.atlassian.net/wiki/spaces/TW/pages/11384160276/AWS+Accounts+and+Roles)
and [this how to?](https://gpitbjss.atlassian.net/wiki/spaces/TW/pages/11286020174/How+to+set+up+access+to+AWS+from+CLI)

As a note, this set-up is based on the README of assume-role [tool](https://github.com/remind101/assume-role)

## Assume role with elevated permissions

### Install `assume-role` locally:
`brew install remind101/formulae/assume-role`

Run the following command with the profile configured in your `~/.aws/config`:

`assume-role admin`

### Run `assume-role` with dojo:
Run the following command with the profile configured in your `~/.aws/config`:

`eval $(dojo "echo <mfa-code> | assume-role admin"`

Run the following command to confirm the role was assumed correctly:

`aws sts get-caller-identity`


## AWS SSM Parameters Design Principles

When creating the new ssm keys, please follow the agreed convention as per the design specified below:

* all parts of the keys are lower case
* the words are separated by dashes (`kebab case`)
* `env` is optional

### Design:
Please follow this design to ensure the ssm keys are easy to maintain and navigate through:

| Type               | Design                                  | Example                                               |
| -------------------| ----------------------------------------| ------------------------------------------------------|
| **User-specified** |`/repo/<env>?/user-input/`               | `/repo/${var.environment}/user-input/db-username`     |
| **Auto-generated** |`/repo/<env>?/output/<name-of-git-repo>/`| `/repo/output/prm-deductions-base-infra/root-zone-id` |
