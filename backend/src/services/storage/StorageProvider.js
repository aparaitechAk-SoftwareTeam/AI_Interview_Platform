class StorageProvider {
  async uploadFile(fileBuffer, originalName, mimeType) {
    throw new Error('Not implemented');
  }

  async deleteFile(filePath) {
    throw new Error('Not implemented');
  }
}

export default StorageProvider;
