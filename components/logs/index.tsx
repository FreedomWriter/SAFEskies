'use client';

// import { useMemo } from 'react';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useLogs } from '@/hooks/useLogs';
import { LogFilters } from './components/log-filters';
import { LogsWrapper } from './components/logs-header';
import { MODAL_INSTANCE_IDS } from '@/enums/modals';
import { Modal } from '@/components/modals';
import { User } from '@/lib/types/user';
import { useRouter, useSearchParams } from 'next/navigation';
import { getLinksByFeed } from '@/lib/utils/logs';
import { LogEntry } from './components/log-entry';
import cc from 'classcat';
import { TabGroup, TabPanel } from '@/components/tab/tab';
import { useMemo } from 'react';

export const Logs = ({ user }: { user: User }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uri = searchParams.get('uri');
  const { logs, isLoading, error, userCanViewAdminActions } = useLogs();

  const logsByFeedLinks = useMemo(() => getLinksByFeed(user, 'logs'), [user]);

  const tabsData = useMemo(
    () => [
      {
        label: 'All',
        href: '/logs',
      },
      ...logsByFeedLinks,
    ],
    [logsByFeedLinks]
  );

  const tabsHeaders = tabsData.map((tab) => (
    <div
      key={tab.href}
      className={cc([
        'flex items-center gap-2',
        { 'justify-center': tabsData.length === 1 },
      ])}
    >
      <span>{tab.label}</span>
    </div>
  ));

  const activeTab = useMemo(
    () =>
      tabsData.findIndex((tab) =>
        tab.href.includes(encodeURIComponent(uri || ''))
      ) || 0,
    [tabsData, uri]
  );

  const handleTabChange = (index: number) => {
    const selectedTab = tabsData[index];
    router.push(selectedTab.href);
  };

  //   title: (
  //     <div
  //       key={tab.href}
  //       className={cc([
  //         'flex items-center gap-2',
  //         { 'justify-center': tabsData.length === 1 },
  //       ])}
  //     >
  //       <span>{tab.label}</span>
  //     </div>
  //   ),
  //   TabContent: logs.length ? (
  //     <div className='px-4 h-full overflow-auto max-h-page pt-4 pb-56'>
  //       {logs.map((log) => (
  //         <LogEntry
  //           key={log.id}
  //           log={log}
  //           canViewAdminActions={userCanViewAdminActions}
  //         />
  //       ))}
  //     </div>
  //   ) : (
  //     <p className='text-app-secondary text-center py-4'>No logs found</p>
  //   ),
  // }));

  return (
    <>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3 h-full'>
        <div className='col-span-2'>
          <LogsWrapper />
          <TabGroup
            data={tabsHeaders}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          >
            {tabsHeaders.map((_, index) => (
              <TabPanel key={`log-panel-${index}`}>
                <div className='px-4 h-full overflow-auto max-h-page pt-4 pb-56'>
                  {isLoading ? (
                    <div className='flex items-center justify-center p-20 h-full'>
                      <LoadingSpinner />
                    </div>
                  ) : error ? (
                    <div className='text-app-error text-center py-4'>
                      <p>Error loading logs: {error}</p>
                    </div>
                  ) : (
                    logs.map((log) => (
                      <LogEntry
                        key={log.id}
                        log={log}
                        canViewAdminActions={userCanViewAdminActions}
                      />
                    ))
                  )}
                </div>
              </TabPanel>
            ))}
          </TabGroup>
        </div>
        <div className='hidden tablet:flex flex-col space-y-4 p-4 border-l border-l-app-border'>
          <LogFilters canViewAdminActions={userCanViewAdminActions} />
        </div>
      </div>
      <Modal
        id={MODAL_INSTANCE_IDS.LOG_FILTERS}
        title='Filter Logs'
        size='full'
      >
        <div className='flex flex-col space-y-4 p-4 overflow-auto max-h-page'>
          <LogFilters canViewAdminActions={userCanViewAdminActions} />
        </div>
      </Modal>
    </>
  );
};
