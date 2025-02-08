import { UserRole } from '@/lib/types/permission';
import { ModeratorData } from '@/lib/types/user';
import {
  canPerformWithRole,
  groupModeratorsByFeed,
} from '@/lib/utils/permission';
import { SupabaseInstance } from '@/repos/supabase';
import { Feed } from '@atproto/api/dist/client/types/app/bsky/feed/describeFeedGenerator';
import { getBulkProfileDetails } from '@/repos/profile';
import { createModerationLog } from '@/repos/logs';
import { ModAction } from '@/lib/types/moderation';

export const setFeedRole = async (
  targetUserDid: string,
  uri: string,
  role: UserRole,
  setByUserDid: string,
  feedName: string
): Promise<boolean> => {
  const canSetRole = await canPerformAction(setByUserDid, 'mod_promote', uri);
  console.log({
    user_did: targetUserDid,
    uri,
    feed_name: feedName,
    role: role,
    created_by: setByUserDid,
    created_at: new Date().toISOString(),
  });
  debugger;
  if (!canSetRole) {
    console.error('Permission denied to set feed role:', {
      setByUserDid,
      uri,
    });
    return false;
  }

  try {
    const { error } = await SupabaseInstance.from('feed_permissions').upsert({
      user_did: targetUserDid,
      uri,
      feed_name: feedName,
      role: role,
      created_by: setByUserDid,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error upserting feed role:', error);
      return false;
    }

    await createModerationLog({
      uri,
      performed_by: setByUserDid,
      action: role === 'mod' ? 'mod_promote' : 'mod_demote', // TODO: Extend to all actions
      target_user_did: targetUserDid,
      metadata: { role, feed_name: feedName },
    });

    return true;
  } catch (error) {
    console.error('Error setting feed role:', error);
    return false;
  }
};

export const getFeedRole = async (
  userDid: string,
  uri: string
): Promise<UserRole> => {
  const { data, error } = await SupabaseInstance.from('feed_permissions')
    .select('role')
    .eq('user_did', userDid)
    .eq('uri', uri)
    .single();

  if (error || !data) return 'user';
  return data.role;
};

export const canPerformAction = async (
  userDid: string,
  action: ModAction,
  uri: string | null
): Promise<boolean> => {
  if (!userDid || !uri) return false;
  const feedRole = await getFeedRole(userDid, uri);

  return canPerformWithRole(feedRole, action);
};

export const getModeratorsByFeeds = async (feeds: Feed[]) => {
  if (!feeds.length) return [];

  try {
    const feedUris = feeds.map((feed) => feed.uri);
    const { data: permissions } = await SupabaseInstance.from(
      'feed_permissions'
    )
      .select('uri, user_did, role')
      .in('uri', feedUris)
      .eq('role', 'mod');

    if (!permissions) {
      return feeds.map((feed) => ({ feed, moderators: [] }));
    }

    const moderatorsByFeedUri = groupModeratorsByFeed(permissions);

    return await Promise.all(
      feeds.map(async (feed) => {
        const feedModerators = moderatorsByFeedUri[feed.uri] || [];
        const userDids = feedModerators.map(
          (mod: { user_did: string }) => mod.user_did
        );
        const profiles = await getBulkProfileDetails(userDids);

        const moderators = profiles.map((profile, index) => ({
          ...profile,
          role: feedModerators[index].role,
        }));

        return { feed, moderators };
      })
    );
  } catch (error) {
    console.error('Error fetching moderators by feeds:', error);
    throw error;
  }
};

export const getAllModeratorsForAdmin = async (adminDid: string) => {
  try {
    const { data: adminFeeds, error: feedsError } = await SupabaseInstance.from(
      'feed_permissions'
    )
      .select('uri')
      .eq('user_did', adminDid)
      .eq('role', 'admin');

    if (feedsError) throw feedsError;
    if (!adminFeeds?.length) return [];

    const { data: moderators, error: modsError } = (await SupabaseInstance.from(
      'feed_permissions'
    )
      .select(
        `
        user_did,
        uri,
        feed_name,
        role,
        profiles!feed_permissions_user_did_fkey (
          did,
          handle,
          displayName,
          avatar
        )
      `
      )
      .in(
        'uri',
        adminFeeds.map((f) => f.uri)
      )
      .in('role', ['mod', 'admin'])) as unknown as {
      data: ModeratorData[];
      error: unknown;
    };

    if (modsError) throw modsError;
    if (!moderators) return [];

    return Array.from(
      new Map(
        moderators.map((mod) => [
          mod.profiles.did,
          {
            ...mod.profiles,
            role: mod.role,
          },
        ])
      ).values()
    );
  } catch (error) {
    console.error('Error fetching moderators for admin:', error);
    throw error;
  }
};

export const getHighestRoleForUser = async (
  userDid: string | undefined
): Promise<UserRole> => {
  if (!userDid) return 'user';
  const { data, error } = await SupabaseInstance.from('feed_permissions')
    .select('role')
    .eq('user_did', userDid);

  if (error || !data) return 'user';

  if (data.some((element) => element.role === 'admin')) return 'admin';
  if (data.some((element) => element.role === 'mod')) return 'mod';
  return 'user';
};
