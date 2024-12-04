'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePaginatedFeed } from '@/hooks/usePaginatedFeed';
import { MODAL_INSTANCE_IDS } from '@/enums/modals';
import { useModal } from '@/contexts/modal-context';
import { GenericErrorModal } from '@/components/modals/generic-error-modal';
import { LiveRegion } from './live-region';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { IconButton } from './button/icon-button';
import { Post } from './post';

interface FeedProps {
  did: string;
  feedName: string;
}

export const Feed = ({ did, feedName }: FeedProps) => {
  const { feed, error, isFetching, hasNextPage, fetchNextPage, refreshFeed } =
    usePaginatedFeed({
      did,
      feedName,
      limit: 10,
    });

  const { openModalInstance } = useModal();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorHandled, setErrorHandled] = useState(false); // Prevent repeat modal triggers
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle error modal opening when an error occurs
  useEffect(() => {
    if (error && !errorHandled) {
      openModalInstance(MODAL_INSTANCE_IDS.GENERIC_ERROR, true);
      setErrorHandled(true);
    } else if (!error) {
      setErrorHandled(false);
    }
  }, [error, errorHandled, openModalInstance]);

  const handleIntersection = useCallback(
    ([entry]: IntersectionObserverEntry[]) => {
      if (entry.isIntersecting && hasNextPage && !isFetching) {
        fetchNextPage();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasNextPage, isFetching]
  );

  const sentinelRef = useIntersectionObserver(handleIntersection, {
    root: containerRef.current,
    rootMargin: '150px',
    threshold: 0.1,
  });

  // Pull-to-refresh functionality
  const handlePullToRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await refreshFeed();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Function to refetch feed when error modal is closed
  const handleErrorModalClose = () => {
    refreshFeed();
  };

  return (
    <div className='relative h-screen overflow-auto'>
      <section
        className='flex flex-col items-center mx-auto px-0 tablet:px-10'
        aria-labelledby={`feed-title-${feedName}`}
      >
        <header className='w-full text-center my-4'>
          <h2 id={`feed-title-${feedName}`} className='text-2xl font-bold '>
            {/* {feedName} */}
            Test Feed - Kendrick
          </h2>
        </header>
        <div
          ref={containerRef}
          onTouchStart={(e) =>
            (containerRef.current!.dataset.touchStartY =
              e.touches[0].clientY.toString())
          }
          onTouchMove={(e) => {
            const touchStartY = parseFloat(
              containerRef.current!.dataset.touchStartY || '0'
            );
            const deltaY = e.touches[0].clientY - touchStartY;
            if (deltaY > 50 && containerRef.current?.scrollTop === 0)
              handlePullToRefresh();
          }}
          className='overflow-y-auto h-screen flex flex-col items-center'
        >
          <LiveRegion>{isRefreshing && <span>Refreshing...</span>}</LiveRegion>

          <ul className='w-screen tablet:w-2/3 desktop:w-3/4 flex flex-col items-center'>
            {feed.map((feedPost) => (
              <li
                key={feedPost.post.cid}
                className='w-full desktop:max-w-screen-lg'
              >
                <Post post={feedPost.post} />
              </li>
            ))}
          </ul>

          <div ref={sentinelRef} className='h-10 w-full' />
        </div>
        <GenericErrorModal onClose={handleErrorModalClose}>
          <p>{error || `${feedName} is unavailable`}</p>
        </GenericErrorModal>
      </section>
      <IconButton
        icon='ArrowUpCircleIcon'
        aria-label='Return to Top'
        onClick={() =>
          containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
        }
        className='absolute bottom-24 left-3 tablet:bottom-24 h-20 w-20'
      />
    </div>
  );
};
