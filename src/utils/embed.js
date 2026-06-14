export const extractGoogleDriveFileId = (url) => {
  if (!url) return "";
  
  const patterns = [
    /drive\.google\.com\/file\/d\/([^\/]+)/,
    /drive\.google\.com\/open\?id=([^&]+)/,
    /drive\.google\.com\/uc\?id=([^&]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  
  return "";
};

export const buildEmbedUrl = (sourceType, sourceUrl, customEmbedUrl = "") => {
  if (!sourceUrl && !customEmbedUrl) return "";
  
  if (sourceType === "google_drive") {
    const fileId = extractGoogleDriveFileId(sourceUrl);
    return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : "";
  }
  
  if (sourceType === "facebook") {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
      sourceUrl
    )}&show_text=false&width=1280`;
  }
  
  if (sourceType === "youtube") {
    try {
      const url = new URL(sourceUrl);
      let videoId = "";
  
      if (url.hostname.includes("youtu.be")) {
        videoId = url.pathname.replace("/", "");
      } else {
        videoId = url.searchParams.get("v") || "";
      }
  
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    } catch {
      return "";
    }
  }
  
  if (sourceType === "custom_embed") {
    return customEmbedUrl || sourceUrl;
  }
  
  return "";
};
