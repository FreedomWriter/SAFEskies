'use client';

import React from 'react';
import { Post } from '../post';
import { FeedViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs';

interface FeedListProps {
  feedName: string;
  feed: FeedViewPost[];
}

export const FeedList = (props: FeedListProps) => {
  const { feed, feedName } = props;

  return (
    <section
      className='flex w-full flex-col items-center relative px-4 '
      aria-labelledby={`feed-title-${feedName}`}
    >
      <header className='w-full text-center my-4'>
        <h1 id={`feed-title-${feedName}`} className='text-2xl font-bold '>
          {feedName}
        </h1>
      </header>

      {/* Feed Posts */}
      <ul className='max-w-lg w-full' role='list'>
        {feed.map((feedPost) => (
          <li key={feedPost.post.cid} className='mb-4'>
            <Post post={feedPost.post} />
          </li>
        ))}
      </ul>
    </section>
  );
};
