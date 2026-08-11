import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import StorageProvider from './StorageProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LocalStorageProvider extends StorageProvider {
  constructor() {
    super();
    // Path points to AI-Interview-Website/backend/uploads
    this.uploadDir = path.resolve(__dirname, '../../../uploads');
  }

  async init() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('[LocalStorage] Failed to create uploads directory:', error);
    }
  }

  async uploadFile(fileBuffer, originalName, mimeType) {
    await this.init();
    const ext = path.extname(originalName);
    const basename = path.basename(originalName, ext);
    const uniqueName = `${basename}-${Date.now()}-${Math.floor(Math.random() * 10000)}${ext}`;
    const fullPath = path.join(this.uploadDir, uniqueName);

    try {
      await fs.writeFile(fullPath, fileBuffer);
      console.log(`[LocalStorage] File uploaded to: ${fullPath}`);
      
      // Return details
      return {
        filename: uniqueName,
        path: `/uploads/${uniqueName}`, // Web accessible path
        fullPath: fullPath,
        url: `http://localhost:4000/uploads/${uniqueName}`,
      };
    } catch (error) {
      console.error('[LocalStorage] Upload failed:', error);
      throw error;
    }
  }

  async deleteFile(filePath) {
    const filename = path.basename(filePath);
    const fullPath = path.join(this.uploadDir, filename);
    try {
      await fs.unlink(fullPath);
      console.log(`[LocalStorage] Deleted file: ${fullPath}`);
      return true;
    } catch (error) {
      console.warn(`[LocalStorage] Could not delete file: ${fullPath}. It may not exist.`);
      return false;
    }
  }
}

export default LocalStorageProvider;
