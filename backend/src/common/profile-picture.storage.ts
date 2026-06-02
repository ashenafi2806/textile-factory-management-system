import * as fs from 'fs';
import * as path from 'path';

const PROFILE_PIC_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

/** Monorepo root (parent of `backend/`). Works from `src/` and compiled `dist/`. */
export function getRepoRoot(): string {
  return path.resolve(__dirname, '..', '..', '..');
}

export function getProfilePicturesDir(): string {
  return path.join(getRepoRoot(), 'frontend', 'public', 'profile-pics');
}

export function normalizeProfilePictureExt(originalName?: string): string {
  const ext = path.extname(originalName || '').toLowerCase();
  if (PROFILE_PIC_EXTENSIONS.includes(ext)) {
    return ext;
  }
  return '.jpg';
}

export function findProfilePictureUrl(userId: string): string | null {
  const picsDir = getProfilePicturesDir();
  if (!fs.existsSync(picsDir)) {
    return null;
  }

  for (const ext of PROFILE_PIC_EXTENSIONS) {
    const filePath = path.join(picsDir, `${userId}${ext}`);
    if (fs.existsSync(filePath)) {
      return `/profile-pics/${userId}${ext}`;
    }
  }

  const match = fs
    .readdirSync(picsDir)
    .find(
      (file) =>
        file.toLowerCase().startsWith(`${userId.toLowerCase()}.`) &&
        PROFILE_PIC_EXTENSIONS.some((ext) =>
          file.toLowerCase().endsWith(ext),
        ),
    );

  return match ? `/profile-pics/${match}` : null;
}

export function saveProfilePicture(
  userId: string,
  buffer: Buffer,
  originalName?: string,
): string {
  const uploadDir = getProfilePicturesDir();
  fs.mkdirSync(uploadDir, { recursive: true });

  const ext = normalizeProfilePictureExt(originalName);
  const filename = `${userId}${ext}`;
  const dest = path.join(uploadDir, filename);

  for (const oldExt of PROFILE_PIC_EXTENSIONS) {
    if (oldExt === ext) continue;
    const oldPath = path.join(uploadDir, `${userId}${oldExt}`);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  fs.writeFileSync(dest, buffer);
  return `/profile-pics/${filename}`;
}
