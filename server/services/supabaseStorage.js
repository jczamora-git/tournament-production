const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "jeizi-storage";

let supabase = null;

function getClient() {
  if (!supabase) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    }
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

function makeSafeName(originalname) {
  return originalname
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
}

async function uploadTournamentImage(fileBuffer, mimetype, originalname, type, tournamentId) {
  const client = getClient();
  const safeName = makeSafeName(originalname);
  const folder = tournamentId || "general";
  const filePath = `tournaments/${folder}/${type}-${Date.now()}-${safeName}`;

  const { error } = await client.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType: mimetype,
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = client.storage.from(bucket).getPublicUrl(filePath);

  return { url: data.publicUrl, path: filePath };
}

module.exports = { uploadTournamentImage };
