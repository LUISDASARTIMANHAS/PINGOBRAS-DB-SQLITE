/**
 * This is the main server script that provides the API endpoints
 */

const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false
});

fastify.register(require("fastify-formbody"));

const db = require("./sqlite.js");
const errorMessage =
  "Whoops! Error connecting to the database–please try again!";

// OnRoute hook to list endpoints
const routes = { endpoints: [] };
fastify.addHook("onRoute", routeOptions => {
  routes.endpoints.push(routeOptions.method + " " + routeOptions.path);
});

// Just send some info at the home route
fastify.get("/", (request, reply) => {
  let data = {
    title: "Minimal SQLite",
    intro: "This is a database-backed API with the following endpoints",
    routes: routes.endpoints
  };
  reply.status(200).send(data);
});

// Return the poll options from the database helper script - no auth
fastify.get("/options", async (request, reply) => {
  let data = {};
  // Get the available choices from the database
  data.options = await db.getOptions();
  data.error = data.options ? null : errorMessage;
  console.log(data);
  reply.status(200).send(data);
});

// Add new option (auth)
fastify.post("/option", async (request, reply) => {
  let data = { auth: true };
  if (!authorized(request.headers.admin_key)) data.auth = false;
  else data.success = await db.addOption(request.body.language);
  let status = data.success ? 201 : data.auth ? 400 : 401;
  reply.status(status).send(data);
});

// Update count for an option (auth)
fastify.put("/option", async (request, reply) => {
  let data = { auth: true };
  if (!authorized(request.headers.admin_key)) data.auth = false;
  else
    data.success = await db.updateOption(
      request.body.language,
      request.body.picks
    );
  let status = data.success ? 201 : data.auth ? 400 : 401;
  reply.status(status).send(data);
});

// Delete an option (auth)
fastify.delete("/option", async (request, reply) => {
  let data = { auth: true };
  if (!authorized(request.headers.admin_key)) data.auth = false;
  else data.success = await db.deleteOption(request.body.language);
  let status = data.success ? 201 : data.auth ? 400 : 401;
  reply.status(status).send(data);
});

// Helper function to authenticate the user key
const authorized = key => {
  if (
    !key ||
    key < 1 ||
    !process.env.ADMIN_KEY ||
    key !== process.env.ADMIN_KEY
  )
    return false;
  else return true;
};

// Run the server and report out to the logs
fastify.listen(process.env.PORT, function(err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Your app is listening on ${address}`);
  fastify.log.info(`server listening on ${address}`);
});
