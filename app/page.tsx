import Link from 'next/link';

export default async function page() {
  // TODO: remove hardcoded values
  return (
    <section className='flex flex-col gap-8 row-start-2 items-center sm:items-start'>
      <h1 className='font-black text-5xl uppercase'>Bluesky OAuth Next.JS</h1>
      <div className='flex gap-4 items-center flex-col sm:flex-row'>
        <Link
          className='rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5'
          href={`/oauth/login`}
          rel='noopener noreferrer'
        >
          {/* <BlueskyLogo className="size-6 dark:invert fill-background" /> */}
          Login with Bluesky
        </Link>
        <a
          className='rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44'
          href={`/private`}
          rel='noopener noreferrer'
        >
          Private Page
        </a>
      </div>
    </section>
  );
}
