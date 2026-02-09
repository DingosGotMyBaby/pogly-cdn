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
        region: env.S3_REGION,
        endpoint: env.S3_ENDPOINT,
        credentials: {
            accessKeyId: env.S3_ACCESS_KEY_ID,
            secretAccessKey: env.S3_SECRET_ACCESS_KEY,
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
