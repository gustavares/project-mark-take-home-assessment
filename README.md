# How to run

## Prerequisites

- [Node.js](https://nodejs.org/)
- [Yarn](https://yarnpkg.com/)
- [Docker](https://docs.docker.com/engine/install/)

The database is SQLite, it runs inside the container. Run the following command to run the app and database together:
```
make dev-setup
make run
```

## How to run the tests

#### Unit
```
make test-unit
```
#### Integration
It will run a SQLite db inside a docker container
```
make test-integration
```

### TO DO

- Fix integration testing run

- Authentication
- Delete operations
- Validation
- Custom Algorithm for path finding