import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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

  // Fetch profile from Supabase on mount / user change
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('display_name, bio, avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const avatarUrl = data.avatar_url || localStorage.getItem(`profile_photo_${user.id}`);
        if (avatarUrl) localStorage.setItem(`profile_photo_${user.id}`, avatarUrl);
        setProfileData({
          displayName: data.display_name || user.username,
          bio: data.bio || '',
          avatarUrl,
        });
      });
  }, [user?.id]);

  const updatePhoto = async (file: File): Promise<string | null> => {
    if (!user) return null;
    setLoading(true);
    setUploadError(null);

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/avatar.${ext}`;

    // Remove existing file first to avoid upsert issues
    await supabase.storage.from('avatars').remove([path]);

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file);

    if (error) {
      console.error('Avatar upload error:', error);
      setUploadError(error.message);
      setLoading(false);
      return null;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;

    localStorage.setItem(`profile_photo_${user.id}`, avatarUrl);
    setProfileData(prev => ({ ...prev, avatarUrl }));

    await supabase.from('profiles').upsert({
      id: user.id,
      username: user.username,
      avatar_url: data.publicUrl,
      updated_at: new Date().toISOString(),
    });

    setLoading(false);
    return avatarUrl;
  };

  const updateBio = async (bio: string) => {
    if (!user) return;
    setProfileData(prev => ({ ...prev, bio }));
    await supabase.from('profiles').upsert({
      id: user.id,
      username: user.username,
      bio,
      updated_at: new Date().toISOString(),
    });
  };

  const updateDisplayName = async (displayName: string) => {
    if (!user) return;
    setProfileData(prev => ({ ...prev, displayName }));
    await supabase.from('profiles').upsert({
      id: user.id,
      username: user.username,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    });
  };

  return { profileData, loading, uploadError, updatePhoto, updateBio, updateDisplayName };
};
