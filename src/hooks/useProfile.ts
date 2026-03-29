import { useState, useEffect } from 'react';
import { getProfile, updateProfilePhoto, updateBio, updateDisplayName } from '../lib/api';
import { AuthUser } from './useAuth';

export interface ProfileData {
  displayName: string;
  bio: string;
  avatarUrl: string | null;
}

export const useProfile = (user: AuthUser | null) => {
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: user?.username ?? '',
    bio: '',
    avatarUrl: user ? localStorage.getItem(`profile_photo_${user.id}`) : null,
  });
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then((data) => {
      if (!data) return;
      const avatarUrl = data.avatar_url || localStorage.getItem(`profile_photo_${user.id}`);
      if (avatarUrl) localStorage.setItem(`profile_photo_${user.id}`, avatarUrl);
      setProfileData({
        displayName: data.display_name || user.username,
        bio: data.bio || '',
        avatarUrl: avatarUrl || null,
      });
    }).catch(() => {});
  }, [user?.id]);

  const updatePhoto = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const token = localStorage.getItem('lumina_token');
    if (!token) return null;
    setLoading(true);
    setUploadError(null);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { avatarUrl } = await updateProfilePhoto(token, base64, ext);
      localStorage.setItem(`profile_photo_${user.id}`, avatarUrl);
      setProfileData(prev => ({ ...prev, avatarUrl }));
      return avatarUrl;
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateBioFn = async (bio: string) => {
    if (!user) return;
    const token = localStorage.getItem('lumina_token');
    if (!token) return;
    setProfileData(prev => ({ ...prev, bio }));
    await updateBio(token, bio).catch(() => {});
  };

  const updateDisplayNameFn = async (displayName: string) => {
    if (!user) return;
    const token = localStorage.getItem('lumina_token');
    if (!token) return;
    setProfileData(prev => ({ ...prev, displayName }));
    await updateDisplayName(token, displayName).catch(() => {});
  };

  return {
    profileData,
    loading,
    uploadError,
    updatePhoto,
    updateBio: updateBioFn,
    updateDisplayName: updateDisplayNameFn,
  };
};
