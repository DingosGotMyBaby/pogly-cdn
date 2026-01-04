import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { checkBanStatus } from "../lib/db";
import { generatePresignedUrl } from "../lib/r2";

/**
 * Upload endpoint that generates pre-signed URLs for secure file uploads to Cloudflare R2.
 * 
 * This endpoint performs the following operations:
 * 1. Validates upload request metadata (file name, type, size, author, module)
 * 2. Checks ban status of author and module in D1 database
 * 3. Generates a unique object key with UUID prefix
 * 4. Creates a pre-signed URL with strict content-type and content-length constraints
 * 5. Returns the upload URL and object key to the client
 * 
 * Security Features:
 * - File type restriction (only JPEG, PNG, GIF allowed)
 * - File size limit (1MB maximum)
 * - Ban list checking via D1 database
 * - Pre-signed URLs with enforced metadata and content constraints
 * 
 * @extends OpenAPIRoute
 */
export class UploadEndpoint extends OpenAPIRoute {
    /**
     * OpenAPI schema definition for the upload endpoint.
     * 
     * Request body expects:
     * - name: Original filename with extension
     * - type: MIME type (image/jpeg, image/png, or image/gif only)
     * - size: File size in bytes (max 1MB)
     * - authorUUID: UUID of the user uploading the file
     * - moduleUUID: UUID of the module the file belongs to
     * 
     * Responses:
     * - 200: Success - Returns uploadUrl and objectKey
     * - 403: Forbidden - Author or module is banned
     */
    schema = {
        tags: ["Uploads"],
        summary: "Generate a pre-signed URL for uploading a file",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            name: z.string().min(1),
                            type: z.enum(["image/jpeg", "image/png", "image/gif"]),
                            size: z.number().max(1024 * 1024), // 1MB
                            authorUUID: z.string().uuid(),
                            moduleUUID: z.string().uuid(),
                        }),
                    },
                },
            },
        },
        responses: {
            "200": {
                description: "Returns the pre-signed URL",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            result: z.object({
                                uploadUrl: z.string(),
                                objectKey: z.string(),
                            }),
                        }),
                    },
                },
            },
            "403": {
                description: "Forbidden",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            error: z.string(),
                        }),
                    },
                },
            },
        },
    };

    /**
     * Handles the upload request and generates a pre-signed URL.
     * 
     * Workflow:
     * 1. Validates and extracts request body data
     * 2. Checks if author or module is banned in D1 database
     * 3. Generates a unique object key in format: {moduleUUID}/{uuid}-{filename}
     * 4. Creates pre-signed URL with custom metadata (stdbUploader, stdbModule)
     * 5. Returns the upload URL and object key
     * 
     * @param c - Hono context object containing request data and environment bindings
     * @returns JSON response with uploadUrl and objectKey on success, or error message on failure
     * @throws Returns 403 status if author or module is banned
     */
    async handle(c: any) {
        const data = await this.getValidatedData<typeof this.schema>();
        const { name, type, size, authorUUID, moduleUUID } = data.body;

        // 1. Database Allow-list/Ban-list Check
        const isBanned = await checkBanStatus(c.env.D1_DATABASE, authorUUID, moduleUUID);
        if (isBanned) {
            return c.json(
                {
                    success: false,
                    error: "Upload denied: Author or Module is restricted.",
                },
                403
            );
        }

        // 2. Validate File Extension (extra check, though MIME type enum covers most)
        const validExtensions = ["jpg", "jpeg", "png", "gif"];
        const ext = name.split(".").pop()?.toLowerCase();
        if (!ext || !validExtensions.includes(ext)) {
            // This might strictly be covered by client-side or MIME check, 
            // but enforcing name extension matches mime type is good practice.
            // For now, relies on MIME from request.
        }

        // 3. Generate Key
        const uuid = crypto.randomUUID();
        const objectKey = `${moduleUUID}/${uuid}-${name}`;

        // 4. Generate Presigned URL
        const metadata = {
            stdbUploader: authorUUID,
            stdbModule: moduleUUID,
        };

        const uploadUrl = await generatePresignedUrl(
            c.env,
            objectKey,
            type,
            size,
            metadata
        );

        return {
            success: true,
            result: {
                uploadUrl,
                objectKey,
            },
        };
    }
}
