'use client';

import React, { ChangeEvent, useEffect, useState } from 'react';
import { Modal } from '@/components/modals';
import { MODAL_INSTANCE_IDS } from '@/enums/modals';
import { ModerationService } from '@/lib/constants/moderation';
import { ReportOption } from '@/lib/types/moderation';
import { ModReasonButton } from '@/components/button/mod-reason-button';
import { Checkbox } from '@/components/input/checkbox';
import { Textarea } from '@/components/input/text-area';
import { Button } from '@/components/button';
import { VisualIntent } from '@/enums/styles';
import cc from 'classcat';
import { useSearchParams } from 'next/navigation';
import { useProfileData } from '@/hooks/useProfileData';

interface Props {
  onClose: () => void;
  onReport: () => void;
  reason: ReportOption | null;
  isReportSubmitting: boolean;
  handleAddtlInfoChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  handleReportToChange: (reportTo: ModerationService) => void;
  isModServiceChecked: (service: ModerationService) => boolean;
  isDisabled: boolean;
  updateShowModMenu: (val: boolean) => void;
}

type ReportPostState = {
  isLoading: boolean;
  services: ModerationService[] | [];
  error: string | null;
};

export const ReportPostModal = ({
  onClose,
  onReport,
  reason,
  isReportSubmitting,
  handleAddtlInfoChange,
  handleReportToChange,
  isModServiceChecked,
  isDisabled,
  updateShowModMenu,
}: Props) => {
  const [state, setState] = useState<ReportPostState>({
    isLoading: true,
    services: [],
    error: null,
  });

  const searchParams = useSearchParams();

  const uri = searchParams?.get('uri');
  const { profile } = useProfileData();
  console.log(profile);
  useEffect(() => {
    async function fetchServices() {
      if (!uri || !profile?.did) return;
      try {
        const response = await fetch(`/api/moderation/services?uri=${uri}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setState((prev) => ({
          ...prev,
          services: data.services,
          isLoading: false,
        }));
        updateShowModMenu(data.services.length > 0 && !!profile.did);
      } catch (error: unknown) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'An unknown error occurred',
          isLoading: false,
        }));
      } finally {
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
        updateShowModMenu(state.services.length > 0 && !!profile.did);
      }
    }

    fetchServices();
  }, [uri, profile?.did]);

  if (state.services.length === 0) {
    return null;
  }

  return (
    <Modal
      id={MODAL_INSTANCE_IDS.REPORT_POST}
      title='Report'
      onClose={onClose}
      size='large'
      fullWidthMobile
    >
      <ModReasonButton reason={reason} isViewOnly />
      <div className='flex flex-col space-y-4 pt-4'>
        <section>
          <p className='text-app-secondary pb-1'>
            Select the moderation service(s) to report to
          </p>
          <ul
            className={cc([
              'bg-app-secondary-hover rounded-xl p-4 flex flex-col space-y-2',
              {
                'bg-app-secondary-hover ring-offset-1 ring-4 mx-2 ring-app-error':
                  isDisabled,
              },
            ])}
          >
            {isDisabled ? (
              <p className='text-app-error sr-only' role='alert'>
                You must select at least one moderation service
              </p>
            ) : null}
            {state?.services?.map((service) => {
              return (
                <li
                  key={service.value}
                  className='flex items-center justify-between p-2 border border-app-secondary rounded-lg'
                >
                  <Checkbox
                    id={service.value}
                    label={service.label}
                    checked={
                      isModServiceChecked(service as ModerationService) || false
                    }
                    onChange={() =>
                      handleReportToChange(service as ModerationService)
                    }
                  />
                </li>
              );
            })}
          </ul>
        </section>
        <Textarea
          id='additional report information'
          label='Optionally provide additional information below:'
          maxLength={300}
          onChange={handleAddtlInfoChange}
        />
        <Button
          onClick={onReport}
          intent={VisualIntent.Error}
          className='w-fit self-end mb-6'
          submitting={isReportSubmitting}
          disabled={isReportSubmitting || isDisabled}
        >
          Send report
        </Button>
      </div>
    </Modal>
  );
};
