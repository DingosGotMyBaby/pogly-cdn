import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function generatePresignedUrl(
    env: Env,
    key: string,
    contentType: string,
    contentLength: number,
    metadata: Record<string, string>
): Promise<string> {
    const S3 = new S3Client({
        region: "auto",
        endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: env.R2_ACCESS_KEY_ID,
            secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        },
    });

    const command = new PutObjectCommand({
        Bucket: env.BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        ContentLength: contentLength,
        Metadata: metadata,
    });

    // URL expires in 10 minutes (600 seconds)
    return await getSignedUrl(S3, command, { expiresIn: 600 });
}
