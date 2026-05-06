/**
 * Uploads a file through the backend upload API.
 * Firebase has been completely removed from this file.
 *
 * @param file The file to upload
 * @param folder The upload folder/category, for example: "songs" or "covers"
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
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    if (onProgress) onProgress(10);

    const token = localStorage.getItem("token");

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }

    if (onProgress) onProgress(100);

    console.log(`[STORAGE] Backend upload successful: ${data.url}`);

    return data.url;
  } catch (error: any) {
    console.error(`[STORAGE] Backend upload failed for ${file.name}:`, error);
    throw error;
  }
}