'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FeedList } from '@/components/feed-list/feed-list';
import { usePaginatedFeed } from '@/hooks/usePaginatedFeed';
import { MODAL_INSTANCE_IDS } from '@/enums/modals';
import { useModal } from '@/contexts/modal-context';
import { GenericErrorModal } from '@/components/modals/generic-error-modal';
import { LiveRegion } from './live-region';

// Reusable useIntersectionObserver Hook
const useIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) => {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(callback, options);

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [callback, options]);

  return targetRef;
};

// Main Feed Component
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle error modal opening when an error occurs
  useEffect(() => {
    if (error && error.name !== 'AbortError') {
      console.error('TODO: debug generic error false positive', error);
      openModalInstance(MODAL_INSTANCE_IDS.GENERIC_ERROR, true);
    }
  }, [error, openModalInstance]);

  // IntersectionObserver for infinite scroll
  const handleIntersection = useCallback(
    ([entry]: IntersectionObserverEntry[]) => {
      if (entry.isIntersecting && hasNextPage && !isFetching) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetching]
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
    <section
      className='flex w-full flex-col items-center relative tablet:max-w-md desktop:max-w-lg'
      aria-labelledby={`feed-title-${feedName}`}
    >
      <header className='w-full text-center my-4'>
        <h1 id={`feed-title-${feedName}`} className='text-2xl font-bold '>
          {feedName}
        </h1>
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
        <FeedList feed={feed} />
        <div ref={sentinelRef} className='h-10 w-full' />
      </div>

      <GenericErrorModal onClose={handleErrorModalClose}>
        <p>{`${feedName} is unavailable`}</p>
      </GenericErrorModal>
    </section>
  );
};
