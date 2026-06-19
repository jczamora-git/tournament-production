const path = require("path");
const fs = require("fs");

const VALID_DRIVERS = new Set(["local", "supabase", "r2"]);

const storageDriver =
  process.env.STORAGE_DRIVER ||
  (process.env.VERCEL === "1" ? "r2" : "local");

if (!VALID_DRIVERS.has(storageDriver)) {
  throw new Error(
    `[storage] Invalid STORAGE_DRIVER "${storageDriver}". Allowed: ${[...VALID_DRIVERS].join(", ")}`
  );
}

const localUploadsDir = path.resolve(
  process.env.LOCAL_UPLOADS_DIR || path.join(__dirname, "..", "uploads")
);

let _supabase = null;

function getSupabaseClient() {
  if (_supabase) return _supabase;
  const { createClient } = require("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase Storage is not configured.");
  }
  _supabase = createClient(url, key);
  return _supabase;
}

let _r2Client = null;

function getR2Client() {
  if (_r2Client) return _r2Client;
  const { S3Client } = require("@aws-sdk/client-s3");
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY."
    );
  }
  _r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _r2Client;
}

async function uploadImage({ file, folder, filename, mimetype }) {
  if (storageDriver === "local") {
    const dir = path.join(localUploadsDir, folder);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), file);
    return {
      url: `/uploads/${folder}/${filename}`,
      path: `${folder}/${filename}`,
      driver: "local",
    };
  }

  if (storageDriver === "r2") {
    const { PutObjectCommand } = require("@aws-sdk/client-s3");
    const client = getR2Client();
    const bucket = process.env.R2_BUCKET_NAME || "cmo-tournament-assets";
    const key = `${folder}/${filename}`;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: mimetype,
      })
    );

    const publicUrl = process.env.R2_PUBLIC_BASE_URL;
    if (!publicUrl) {
      throw new Error("R2_PUBLIC_BASE_URL must be set for public access.");
    }

    return {
      url: `${publicUrl.replace(/\/+$/, "")}/${key}`,
      path: key,
      driver: "r2",
    };
  }

  const client = getSupabaseClient();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "jeizi-storage";
  const storagePath = `${folder}/${filename}`;

  const { error } = await client.storage
    .from(bucket)
    .upload(storagePath, file, { contentType: mimetype, upsert: true });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = client.storage.from(bucket).getPublicUrl(storagePath);

  return {
    url: data.publicUrl,
    path: storagePath,
    driver: "supabase",
  };
}

console.log("[storage]", {
  driver: storageDriver,
  localDirectory: storageDriver === "local" ? localUploadsDir : undefined,
  supabaseConfigured:
    storageDriver === "supabase"
      ? Boolean(
          process.env.SUPABASE_URL &&
            (process.env.SUPABASE_SECRET_KEY ||
              process.env.SUPABASE_SERVICE_ROLE_KEY)
        )
      : undefined,
  r2Configured:
    storageDriver === "r2"
      ? Boolean(
          process.env.R2_ACCOUNT_ID &&
            process.env.R2_ACCESS_KEY_ID &&
            process.env.R2_SECRET_ACCESS_KEY
        )
      : undefined,
});

module.exports = { storageDriver, localUploadsDir, uploadImage };
