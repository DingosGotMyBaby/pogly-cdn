import { env, createExecutionContext, waitOnExecutionContext, runWorker } from "cloudflare:test";
import { describe, it, expect, vi } from "vitest";
import worker from "../src/index";

// Mock the checkBanStatus function
vi.mock("../src/lib/db", () => {
    return {
        checkBanStatus: vi.fn(),
    };
});

import { checkBanStatus } from "../src/lib/db";

// Mock the generatePresignedUrl function
vi.mock("../src/lib/r2", () => {
    return {
        generatePresignedUrl: vi.fn().mockResolvedValue("https://fake-r2-url.com/some-key"),
    };
});


describe("Upload Endpoint", () => {
    it("should return 403 if author is banned", async () => {
        // Mock database check to return true (banned)
        vi.mocked(checkBanStatus).mockResolvedValue(true);

        const request = new Request("http://example.com/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "test.png",
                type: "image/png",
                size: 1024,
                authorUUID: "00000000-0000-0000-0000-000000000001",
                moduleUUID: "00000000-0000-0000-0000-000000000002",
            }),
        });

        const ctx = createExecutionContext();
        const response = await worker.fetch(request, env, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(403);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toBe("Upload denied: Author or Module is restricted.");
    });

    it("should return 200 on valid request", async () => {
        // Mock database check to return false (not banned)
        vi.mocked(checkBanStatus).mockResolvedValue(false);

        const request = new Request("http://example.com/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "test.png",
                type: "image/png",
                size: 1024,
                authorUUID: "00000000-0000-0000-0000-000000000001",
                moduleUUID: "00000000-0000-0000-0000-000000000002",
            }),
        });

        const ctx = createExecutionContext();
        const response = await worker.fetch(request, env, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.result).toHaveProperty("uploadUrl");
        expect(body.result).toHaveProperty("objectKey");
    });

    it("should return 400 for invalid input (missing fields)", async () => {
        const request = new Request("http://example.com/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                // Missing name, type, etc.
                authorUUID: "00000000-0000-0000-0000-000000000001",
            }),
        });

        const ctx = createExecutionContext();
        const response = await worker.fetch(request, env, ctx);
        await waitOnExecutionContext(ctx);

        // Zod validation should fail
        expect(response.status).toBe(400); // Bad Request
    });
});
