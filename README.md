# Users App

a RESTful API that allows users to create, retrieve, update, and delete data in a PostgreSQL database

## Project Dependencies

* Node.js
* Express.js
* TypeORM
* PostgreSQL

## Project Tooling (Optional)

* Visual Studio Code
* GitHub
* Postman or Swagger

## Steps to run the app:

* Clone the repo
* Navigate to the `users-app` directory
* Run `npm install` command
* Uncomment and edit the `prod` or `dev` settings inside the `.env` file
* Run `npm run start` or `npm run dev` command
* Navigate to http://localhost:8080/v1/api-docs/ or refer to `openapi.yaml` for usage, options, and a list of available APIs

## Steps to test the app:

* Uncomment and edit the `test` database settings inside the `.env` file
* Run `npm run test` command
* Navigate to http://localhost:8080/v1/api-spec/ for usage, options, and a list of available APIs

## Author

Susan M Lister

## Version History

* v1
    * Final Submission

## Known Issues
* `npm run test` currently using a temporary workaround to prevent open handles from keeping jest from exiting
