import { API_BASE_URL } from "@/lib/apiConfig";

/**
 * Uploads a file through the backend upload API.
 * Firebase has been completely removed from this file.
 *
 * @param file The file to upload
 * @param folder The upload folder/category, for example: "songs", "covers", or "general"
 * @param onProgress Optional callback for progress updates from 0 to 100
 * @returns Promise resolving to the uploaded file URL
 */
export async function uploadFile(
  file: File,
  folder: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  console.log(`[STORAGE] Starting backend upload for ${file.name} to ${folder}...`, {
    size: file.size,
    type: file.type,
  });

  try {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("adminToken");

    if (!token) {
      throw new Error("Not authorized, no token provided");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    if (onProgress) onProgress(10);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }

    const uploadedUrl =
      data.url ||
      data.fileUrl ||
      data.file_url ||
      data.path ||
      data.filePath;

    if (!uploadedUrl) {
      console.error("[STORAGE] Upload response missing URL:", data);
      throw new Error("Upload succeeded but no file URL was returned.");
    }

    if (onProgress) onProgress(100);

    console.log(`[STORAGE] Backend upload successful: ${uploadedUrl}`);

    return uploadedUrl;
  } catch (error: any) {
    console.error(`[STORAGE] Backend upload failed for ${file.name}:`, error);
    throw error;
  }
}