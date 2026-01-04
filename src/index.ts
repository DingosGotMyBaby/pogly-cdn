import { fromHono } from "chanfana";
import { Hono } from "hono";
import { UploadEndpoint } from "./endpoints/upload";


// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/",
});

// Register OpenAPI endpoints
openapi.post("/api/upload", UploadEndpoint);

// Export the Hono app
export default app;
