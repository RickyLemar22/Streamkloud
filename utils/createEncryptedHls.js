import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

const createEncryptedHls = (inputFilePath) => {
  return new Promise((resolve, reject) => {
    const songFolder = uuidv4();

    const outputDir = path.join(
      process.cwd(),
      'protected_streams',
      songFolder
    );

    fs.mkdirSync(outputDir, { recursive: true });

    const key = crypto.randomBytes(16);
    const iv = crypto.randomBytes(16).toString('hex');

    const keyPath = path.join(outputDir, 'stream.key');
    const keyInfoPath = path.join(outputDir, 'key_info.txt');
    const outputManifest = path.join(outputDir, 'master.m3u8');

    fs.writeFileSync(keyPath, key);

    fs.writeFileSync(
      keyInfoPath,
      `stream.key\n${keyPath}\n${iv}`
    );

    execFile(
      'ffmpeg',
      [
        '-i',
        inputFilePath,
        '-codec:a',
        'aac',
        '-b:a',
        '128k',
        '-hls_time',
        '6',
        '-hls_playlist_type',
        'vod',
        '-hls_key_info_file',
        keyInfoPath,
        '-hls_segment_filename',
        path.join(outputDir, 'segment_%03d.ts'),
        outputManifest,
      ],
      (error) => {
        try {
          if (fs.existsSync(keyInfoPath)) {
            fs.unlinkSync(keyInfoPath);
          }
        } catch {}

        if (error) {
          return reject(error);
        }

        resolve({
          hlsPath: `protected_streams/${songFolder}`,
          encryptionKey: key,
          iv,
        });
      }
    );
  });
};

export default createEncryptedHls;