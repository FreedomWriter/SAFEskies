'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { usePaginatedFeed } from '@/hooks/usePaginatedFeed';
import { MODAL_INSTANCE_IDS } from '@/enums/modals';
import { useModal } from '@/contexts/modal-context';
import { GenericErrorModal } from '@/components/modals/generic-error-modal';
import { LiveRegion } from '@/components/live-region';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { IconButton } from '@/components/button/icon-button';
import { Post } from '@/components/post';
import { PostView } from '@atproto/api/dist/client/types/app/bsky/feed/defs';
import { HydratedPostModal } from '../modals/hydrated-post';
import { VisualIntent } from '@/enums/styles';
import { ModMenuModal } from '../modals/mod-menu';
import { ReportPostModal } from '../modals/report-post';
import { ReportOption } from '@/lib/types/moderation';
import { useToast } from '@/contexts/toast-context';
import {
  MODERATION_SERVICES,
  ModerationService,
} from '@/lib/constants/moderation';
import { ReasonType } from '@atproto/api/dist/client/types/com/atproto/moderation/defs';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface FeedProps {
  uri: string;
  onRefreshComplete?: () => void;
  feedName: string | undefined;
}

interface ReportDataState {
  post: PostView | null;
  reason: ReportOption | null;
  toServices: typeof MODERATION_SERVICES;
  moderatedPostUri: string | null;
}

export const Feed = ({ uri, onRefreshComplete, feedName }: FeedProps) => {
  const { feed, error, isFetching, hasNextPage, fetchNextPage, refreshFeed } =
    usePaginatedFeed({
      limit: 10,
      uri,
    });

  const { containerRef, isRefreshing, handleTouchStart, handleTouchMove } =
    usePullToRefresh({
      onRefresh: async () => {
        await refreshFeed();
        onRefreshComplete?.();
      },
    });

  const { openModalInstance, closeModalInstance } = useModal();
  const { toast } = useToast();
  const [viewedPostUri, setViewedPostUri] = useState<string | null>(null);
  const [isReportSubmitting, setIsReportSubmitting] = useState(false);
  const [reportData, setReportData] = useState<ReportDataState>({
    post: null,
    reason: null,
    toServices: [MODERATION_SERVICES[0]],
    moderatedPostUri: null,
  });

  useEffect(() => {
    if (error) {
      openModalInstance(MODAL_INSTANCE_IDS.GENERIC_ERROR, true);
    }
  }, [error, openModalInstance]);

  const handleIntersection = useCallback(
    ([entry]: IntersectionObserverEntry[]) => {
      if (entry.isIntersecting && hasNextPage && !isFetching) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetching, fetchNextPage]
  );

  const sentinelRef = useIntersectionObserver(handleIntersection, {
    root: containerRef.current,
    rootMargin: '150px',
    threshold: 0.1,
  });

  const handlePostClick = async (post: PostView) => {
    setViewedPostUri(post.uri);
    openModalInstance(MODAL_INSTANCE_IDS.HYDRATED_POST, true);
  };

  const handleModAction = (post: PostView) => {
    setReportData((prev) => ({
      ...prev,
      moderatedPostUri: post.uri,
    }));
    openModalInstance(MODAL_INSTANCE_IDS.MOD_MENU, true);
  };

  const handleErrorModalClose = () => {
    closeModalInstance(MODAL_INSTANCE_IDS.GENERIC_ERROR);
    refreshFeed();
  };

  const handleSelectReportReason = (reason: ReportOption) => {
    setReportData((prev) => ({
      ...prev!,
      reason,
    }));
    openModalInstance(MODAL_INSTANCE_IDS.REPORT_POST, true);
  };

  const reportModerationEvent = async (payload: {
    targetedPostUri: string;
    reason: ReasonType;
    toServices: { label: string; value: string }[];
    targetedUserDid: string;
    feedUri: string;
    feedName: string | undefined;
  }) => {
    try {
      await fetch('/api/permissions/mod-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Error logging moderation event:', error);
    }
  };

  const handleReportPost = async () => {
    if (
      !reportData.moderatedPostUri ||
      !reportData.reason ||
      feed.length === 0
    ) {
      toast({
        title: 'Error',
        message: 'No Post Selected.',
        intent: VisualIntent.Error,
      });
      return;
    }

    try {
      const postToModerate = feed.find(
        (post) => post.post.uri === reportData.moderatedPostUri
      );
      if (!postToModerate) {
        toast({
          title: 'Error',
          message: 'No Post Selected.',
          intent: VisualIntent.Error,
        });
        return;
      }
      setIsReportSubmitting(true);

      const payload = {
        targetedPostUri: reportData.moderatedPostUri,
        reason: reportData.reason.reason,
        toServices: reportData.toServices,
        targetedUserDid: postToModerate.post.author.did,
        feedUri: uri,
        feedName: feedName || 'Unnamed Feed',
      };

      await reportModerationEvent(payload);

      closeModalInstance(MODAL_INSTANCE_IDS.REPORT_POST);
      closeModalInstance(MODAL_INSTANCE_IDS.MOD_MENU);

      setReportData((prev) => ({
        ...prev,
        moderatedPostUri: null,
        toServices: [MODERATION_SERVICES[0]],
      }));
      toast({
        title: 'Success',
        message: 'Post reported successfully',
        intent: VisualIntent.Success,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        message: 'Unable to report post. Please try again later.',
        intent: VisualIntent.Error,
      });
      setIsReportSubmitting(false);
    } finally {
      setIsReportSubmitting(false);
    }
  };

  const isModServiceChecked = (data: ModerationService) =>
    reportData.toServices.some((item) => item.value === data.value);

  const handleReportToChange = (updatedReportToData: ModerationService) => {
    if (isModServiceChecked(updatedReportToData)) {
      setReportData((prev) => ({
        ...prev,
        toServices: prev.toServices.filter(
          (item) => item.value !== updatedReportToData.value
        ),
      }));
    } else {
      setReportData((prev) => ({
        ...prev,
        toServices: [...prev.toServices, updatedReportToData],
      }));
    }
  };

  const onClose = () =>
    setReportData((prev) => ({
      ...prev,
      moderatedPostUri: null,
      toServices: [MODERATION_SERVICES[0]],
    }));

  return (
    <>
      <div className='max-h-page'>
        <section className='flex flex-col items-center mx-auto tablet:px-10 '>
          <div
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            className='overflow-y-auto h-screen flex flex-col items-center '
          >
            <LiveRegion>
              {isRefreshing && <span>Refreshing...</span>}
            </LiveRegion>

            <ul className='w-screen tablet:max-w-screen-sm flex flex-col items-center'>
              {feed.map((feedPost) => (
                <li
                  key={feedPost.post.cid}
                  className='w-full tablet:max-w-screen'
                  onClick={() => handlePostClick(feedPost.post)}
                >
                  <Post post={feedPost.post} onModAction={handleModAction} />
                </li>
              ))}
            </ul>

            {isFetching && !isRefreshing && (
              <div className='text-center py-2'>Loading more posts...</div>
            )}

            <div ref={sentinelRef} className='h-10 w-full' />
          </div>
          <GenericErrorModal onClose={handleErrorModalClose}>
            <p>{error || 'Feed unavailable'}</p>
          </GenericErrorModal>
        </section>
        <IconButton
          intent={VisualIntent.Info}
          icon='ArrowUpCircleIcon'
          aria-label='Return to Top'
          onClick={() =>
            containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
          }
          className='fixed bottom-4 left-4 h-14 w-14 bg-app-secondary-hover'
          iconType='solid'
        />
      </div>
      <HydratedPostModal
        uri={viewedPostUri}
        onClose={() => setViewedPostUri(null)}
        onModAction={handleModAction}
      />
      <ModMenuModal
        onClose={onClose}
        handleSelectReportReason={handleSelectReportReason}
      />
      <ReportPostModal
        onClose={onClose}
        onReport={handleReportPost}
        reason={reportData.reason}
        isReportSubmitting={isReportSubmitting}
        handleReportToChange={handleReportToChange}
        isModServiceChecked={isModServiceChecked}
        isDisabled={reportData.toServices.length === 0}
      />
    </>
  );
};
