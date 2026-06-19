const path = require("path");
const fs = require("fs");

const VALID_DRIVERS = new Set(["local", "supabase"]);

const storageDriver =
  process.env.STORAGE_DRIVER ||
  (process.env.VERCEL === "1" ? "supabase" : "local");

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
});

module.exports = { storageDriver, localUploadsDir, uploadImage };
