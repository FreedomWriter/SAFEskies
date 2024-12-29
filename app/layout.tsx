import type { Metadata } from 'next';
import '@/styles/globals.css';

import { Providers } from '@/contexts';
import { preferredLanguages } from '@/utils/todo';
import { BaseLayout } from '@/components/layouts/base-layout';
import { SideDrawerContent } from '@/components/side-drawer/side-drawer-content';
import { ProfileManager } from '@/services/profile-manager';
import { FeedPermissionManager } from '@/services/feed-permissions-manager';

export const metadata: Metadata = {
  title: 'OnlyFeeds',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await ProfileManager.getProfile();
  const highestRole = await FeedPermissionManager.getHighestRoleForUser(
    user?.did
  );

  return (
    <html lang={preferredLanguages}>
      <body>
        <Providers>
          <BaseLayout
            user={user}
            highestRole={highestRole}
            sideContent={
              <SideDrawerContent user={user} highestRole={highestRole} />
            }
          >
            {children}
          </BaseLayout>
        </Providers>
      </body>
    </html>
  );
}
