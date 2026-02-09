# pogly-cdn-worker

A Cloudflare Worker providing a secure CDN upload interface for **[Pogly](https://pogly.gg)**, a realtime collaborative stream overlay. This service manages secure file uploads to Backblaze B2 using its S3-compatible API by generating pre-signed URLs, complete with validation against a D1-backed ban list and strict file-type/size constraints.

**This was written using a fuckton of help from LLMs so feel free to call it AI slop, I'm not gonna shy away from using tools like that.**

## ✨ Features

- **Secure Uploads**: Generates short-lived, pre-signed S3 URLs for direct client-to-B2 uploads.
- **D1 Validation**: Real-time checking of author and module status against a D1 database to prevent unauthorized uploads.
- **Strict Constraints**: Enforces MIME-type filtering (JPEG, PNG, GIF) and file size limits (1MB).
- **OpenAPI 3.1 Documentation**: Auto-generated Swagger UI for interactive API exploration.
- **Custom Metadata**: Automatically attaches `stdbUploader` and `stdbModule` metadata to uploaded B2 objects.

## 🛠️ Technical Stack

- **[Hono](https://hono.dev/)**: Lightweight web framework for Cloudflare Workers.
- **[chanfana](https://github.com/cloudflare/chanfana)**: OpenAPI 3.1 integration for Hono.
- **[Zod](https://zod.dev/)**: Robust schema validation for API requests.
- **Backblaze B2**: S3-compatible object storage.
- **Cloudflare D1**: Distributed SQL database for ban-list management.

## 🚀 Getting Started

### Prerequisites

1.  **Cloudflare Account**: [Sign up](https://workers.dev) for Cloudflare Workers.
2.  **Node.js**: Installed on your local machine.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-repo/pogly-cdn-worker.git
    cd pogly-cdn-worker
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Authenticate with Wrangler:
    ```bash
    npx wrangler login
    ```

### Configuration

1.  **D1 Database**: Create your D1 database:
    ```bash
    npx wrangler d1 create pogly-db
    ```
    Update the `database_id` in `wrangler.jsonc`.
2.  **D1 Schema**: Initialize the database schema:
    ```bash
    npx wrangler d1 execute pogly-db --file=./schema.sql
    ```
3.  **Backblaze B2**: Set up your B2 bucket and generate an Application Key. Then, set the required secrets in Cloudflare:
    ```bash
    npx wrangler secret put S3_ACCESS_KEY_ID
    npx wrangler secret put S3_SECRET_ACCESS_KEY
    npx wrangler secret put BUCKET_NAME
    ```
    Update `S3_REGION` and `S3_ENDPOINT` in `wrangler.jsonc` if they differ from the defaults.
4. **OpenAPI**: Generate the OpenAPI documentation:
    ```bash
    npx chanfana
    ```
    This will create/update `schema.json` for you

### Local Development

1.  Start the local dev server:
    ```bash
    npm run dev
    ```
2.  Open [http://localhost:8787](http://localhost:8787) in your browser to view the **Swagger Documentation** and test endpoints.

## 📦 API Endpoints

### `POST /api/upload`
Generates a pre-signed URL for file upload.

**Request Body:**
```json
{
  "name": "image.png",
  "type": "image/png",
  "size": 524288,
  "authorUUID": "v4-uuid-here",
  "moduleUUID": "v4-uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "uploadUrl": "https://...",
    "objectKey": "module-uuid/unique-id-image.png"
  }
}
```

## 🚢 Deployment

Deploy to Cloudflare Workers with a single command:
```bash
npx wrangler deploy
```
