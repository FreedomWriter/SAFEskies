import React, { useState } from 'react';
import cc from 'classcat';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react';
import { Icon } from '@/components/icon';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { format, parseISO } from 'date-fns';
import { VisualIntent } from '@/enums/styles';

export interface DatePickerProps {
  id: string;
  label?: string;
  value: { fromDate: string; toDate: string };
  onChange: (value: { fromDate: string; toDate: string }) => void;
  presets?: boolean;
  error?: string;
}

const getLocalDate = (date: Date) => {
  return date.toLocaleDateString('en-CA');
};

const PRESETS = [
  {
    label: 'Today',
    range: {
      fromDate: new Date().toLocaleDateString('en-CA'),
      toDate: new Date().toLocaleDateString('en-CA'),
    },
  },
  {
    label: 'Yesterday',
    range: {
      fromDate: new Date(Date.now() - 86400000).toLocaleDateString('en-CA'),
      toDate: new Date(Date.now() - 86400000).toLocaleDateString('en-CA'),
    },
  },
  {
    label: 'Last 7 Days',
    range: {
      fromDate: getLocalDate(new Date(Date.now() - 604800000)),
      toDate: getLocalDate(new Date()),
    },
  },
  {
    label: 'Last Month',
    range: {
      fromDate: getLocalDate(new Date(Date.now() - 2592000000)),
      toDate: getLocalDate(new Date()),
    },
  },
];

export const DatePicker = ({
  id,
  label,
  value,
  onChange,
  presets = false,
  error,
}: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const openPanel = () => {
    setLocalValue(value);
    setIsOpen(true);
  };

  const closePanel = () => {
    setLocalValue(value);
    setIsOpen(false);
  };

  const applyRange = () => {
    onChange(localValue);
    setIsOpen(false);
  };

  const handlePreset = (preset: { fromDate: string; toDate: string }) => {
    console.log(preset);
    onChange(preset);
    setIsOpen(false);
  };

  const updateLocalValue = (field: 'fromDate' | 'toDate', date: string) => {
    setLocalValue((prev) => ({ ...prev, [field]: date }));
  };

  const formatDisplayDate = (date: string) => {
    return date ? format(parseISO(date), 'MMM dd, yyyy') : '';
  };

  const formattedDisplay =
    value.fromDate && value.toDate
      ? `${formatDisplayDate(value.fromDate)} → ${formatDisplayDate(
          value.toDate
        )}`
      : 'Select Date Range';

  const isApplyDisabled = !localValue.fromDate || !localValue.toDate;

  return (
    <div className='flex flex-col space-y-2'>
      {label && (
        <label htmlFor={id} className='font-medium text-app'>
          {label}
        </label>
      )}
      <Popover
        className='relative'
        onChange={(open) => {
          if (!open) closePanel();
        }}
      >
        <PopoverButton
          className={cc([
            'relative w-full py-3 pl-3 pr-10 text-left bg-app-background rounded-md shadow-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary',
            {
              'border border-app-border text-app': !error,
              'border border-app-error text-app-error': !!error,
            },
          ])}
          onClick={openPanel}
        >
          <span className='block truncate'>{formattedDisplay}</span>
          <span className='absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none'>
            <Icon icon='CalendarDaysIcon' />
          </span>
        </PopoverButton>
        {isOpen && (
          <Transition
            as={React.Fragment}
            leave='transition ease-in duration-100'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <PopoverPanel className='absolute z-10 mt-2 bg-app-background rounded-md shadow-lg p-4 w-full'>
              <div className='flex flex-col space-y-4'>
                <div className='flex flex-col tablet:flex-row space-y-4 tablet:space-y-0 tablet:space-x-4'>
                  <Input
                    id={`${id}-from`}
                    label='From Date'
                    type='date'
                    value={localValue.fromDate}
                    onChange={(e) =>
                      updateLocalValue('fromDate', e.target.value)
                    }
                    error={error}
                  />
                  <Input
                    id={`${id}-to`}
                    label='To Date'
                    type='date'
                    value={localValue.toDate}
                    onChange={(e) => updateLocalValue('toDate', e.target.value)}
                    error={error}
                  />
                </div>
                {presets ? (
                  <div className='flex flex-col space-y-2'>
                    <span className='text-sm font-medium'>Quick Presets</span>
                    <div className='flex flex-wrap gap-2'>
                      {PRESETS.map((preset) => (
                        <div key={preset.label}>
                          <Button
                            intent={VisualIntent.TextButton}
                            className='text-sm border border-app-border'
                            onClick={() => handlePreset(preset.range)}
                          >
                            {preset.label}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className='flex justify-end space-x-2'>
                  <Button intent={VisualIntent.Secondary} onClick={closePanel}>
                    Cancel
                  </Button>
                  <Button onClick={applyRange} disabled={isApplyDisabled}>
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverPanel>
          </Transition>
        )}
      </Popover>
      {error && <span className='text-sm text-app-error'>{error}</span>}
    </div>
  );
};
