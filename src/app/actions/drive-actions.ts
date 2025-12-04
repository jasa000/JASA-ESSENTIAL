
'use server';

import { google } from 'googleapis';

function getDriveClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

// Helper to format bytes
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export async function getDriveUsageAction() {
  const drive = getDriveClient();
  try {
    const response = await drive.about.get({
      fields: 'storageQuota',
    });
    const storageQuota = response.data.storageQuota;
    return {
      limit: Number(storageQuota?.limit) || 0,
      usage: Number(storageQuota?.usage) || 0,
      usageInDrive: Number(storageQuota?.usageInDrive) || 0,
    };
  } catch (error) {
    console.error('Error fetching Drive usage:', error);
    throw new Error('Could not fetch Google Drive usage data.');
  }
}

export async function getDriveFilesAction() {
  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_FOLDER_ID || undefined;

  let query = folderId ? `'${folderId}' in parents` : '';
  if (query) {
    query += ' and trashed=false';
  } else {
    query = 'trashed=false';
  }
  

  try {
    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, size, createdTime, webViewLink)',
      orderBy: 'createdTime desc',
      pageSize: 100,
    });

    return (response.data.files || []).map((file) => ({
      id: file.id || '',
      name: file.name || 'Untitled',
      size: file.size ? formatBytes(Number(file.size)) : 'N/A',
      createdTime: file.createdTime || new Date().toISOString(),
      webViewLink: file.webViewLink || '',
    }));
  } catch (error) {
    console.error('Error fetching Drive files:', error);
    throw new Error('Could not fetch files from Google Drive.');
  }
}

export async function deleteDriveFileAction(fileId: string) {
  const drive = getDriveClient();
  try {
    await drive.files.delete({ fileId });
    return { success: true };
  } catch (error) {
    console.error('Error deleting Drive file:', error);
    throw new Error('Could not delete file from Google Drive.');
  }
}
