'use client';

import {
  Tab as HeadlessTab,
  TabGroup as HeadlessTabGroup,
  TabList,
  TabPanels as HeadlessTabPanels,
  TabPanel as HeadlessTabPanel,
} from '@headlessui/react';
import cc from 'classcat';
import { PropsWithChildren, ReactNode } from 'react';

interface TabGroupProps {
  data: string[] | ReactNode[];
  activeTab?: number;
  onTabChange?: (index: number) => void;
}

export function TabGroup({
  data,
  activeTab,
  onTabChange,
  children,
}: PropsWithChildren<TabGroupProps>) {
  return (
    <HeadlessTabGroup
      selectedIndex={activeTab}
      onChange={onTabChange}
      className='w-full'
    >
      <TabList className='flex space-x-1 bg-app-background p-1 overflow-auto'>
        {data.map((tab, index) => (
          <HeadlessTab
            key={index}
            className={({ selected }) =>
              cc([
                'w-full text-center px-4 py-2 cursor-pointer',
                {
                  'border-b-4 border-b-app-primary':
                    selected && data.length > 1,
                },
              ])
            }
          >
            <h2
              id={`feed-title-${tab}`}
              className='text-2xl font-bold whitespace-nowrap'
            >
              {tab}
            </h2>
          </HeadlessTab>
        ))}
      </TabList>
      <HeadlessTabPanels>{children}</HeadlessTabPanels>
    </HeadlessTabGroup>
  );
}

export function TabPanel({ children }: { children: ReactNode }) {
  return <HeadlessTabPanel>{children}</HeadlessTabPanel>;
}
