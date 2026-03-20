import { useState } from 'react';

export interface ActivityItem {
  id: string;
  type: 'follow' | 'like' | 'reply' | 'repost';
  user: string;
  avatar: string;
  time: Date;
  content: string;
}

export const formatActivityTime = (date: Date): string => {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

export const useActivity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activityFilter, setActivityFilter] = useState('All');
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [userFollowers, setUserFollowers] = useState<Record<string, number>>({});

  const pushActivity = (item: Omit<ActivityItem, 'id' | 'time'>) => {
    setActivities(prev => [{ ...item, id: Date.now().toString(), time: new Date() }, ...prev]);
  };

  const handleFollow = (targetUsername: string) => {
    const isFollowing = followingSet.has(targetUsername);
    setFollowingSet(prev => {
      const next = new Set(prev);
      isFollowing ? next.delete(targetUsername) : next.add(targetUsername);
      return next;
    });
    setUserFollowers(prev => ({
      ...prev,
      [targetUsername]: (prev[targetUsername] ?? 74) + (isFollowing ? -1 : 1),
    }));
    if (!isFollowing) {
      pushActivity({
        type: 'follow',
        user: targetUsername,
        avatar: null,
        content: 'started following you',
      });
    }
  };

  return {
    activities,
    activityFilter,
    setActivityFilter,
    followingSet,
    userFollowers,
    pushActivity,
    handleFollow,
  };
};
