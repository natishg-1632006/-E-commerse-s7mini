import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const region = process.env.AWS_REGION || "ap-south-2";
const bucketName = process.env.S3_BUCKET_NAME || "natish-frontend-193615226126";

const s3Client = new S3Client({
  region: region,
});

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
};

async function uploadDir(dirPath, baseDir = dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await uploadDir(fullPath, baseDir);
    } else {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
      const fileBuffer = fs.readFileSync(fullPath);
      const ext = path.extname(entry.name).toLowerCase();
      const contentType = mimeTypes[ext] || "application/octet-stream";

      console.log(`Uploading ${relativePath} (${contentType})...`);

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: relativePath,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await s3Client.send(command);
    }
  }
}

async function run() {
  const distDir = path.join(__dirname, "dist");
  if (!fs.existsSync(distDir)) {
    console.error("dist directory does not exist! Run npm run build first.");
    process.exit(1);
  }
  console.log(`Starting upload of ${distDir} to S3 bucket: ${bucketName}...`);
  await uploadDir(distDir);
  console.log("SUCCESS! All frontend dist files uploaded to S3.");
}

run().catch((err) => {
  console.error("Error uploading to S3:", err);
  process.exit(1);
});
