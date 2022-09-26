import { m, useAnimation } from 'framer-motion';
import { useEffect, useState, useCallback, useRef } from 'react';

import { BREAKPOINTS } from '../../constants';
import { channel as $channelContent } from '../../content';
import { clsm } from '../../utils';
import { Provider as NotificationProvider } from '../../contexts/Notification';
import { useChannel } from '../../contexts/Channel';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import { useUser } from '../../contexts/User';
import Button from '../../components/Button';
import Chat from './Chat';
import MobileNavbar from '../../layouts/AppLayoutWithNavbar/Navbar/MobileNavbar';
import PageUnavailable from '../../components/PageUnavailable';
import Player from '../../components/Player';
import Tabs from '../../components/Tabs/Tabs';

const chatDefaultTransition = { duration: 0.25, type: 'tween' };

// Temporary
// eslint-disable-next-line no-unused-vars
const viewerStreamActionTypes = ['quiz', 'product', 'notice', 'celebration'];

const DEFAULT_SELECTED_TAB_INDEX = 1;

const Channel = () => {
  const [selectedTabIndex, setSelectedTabIndex] = useState(
    DEFAULT_SELECTED_TAB_INDEX
  );
  const chatContainerRef = useRef();
  const { isSessionValid } = useUser();
  const { isLandscape, isMobileView, currentBreakpoint } =
    useResponsiveDevice();
  const { channelData, channelError } = useChannel();
  const [isChatVisible, setIsChatVisible] = useState(true);
  const chatAnimationControls = useAnimation();
  const isSplitView = isMobileView && isLandscape;
  const isStackedView = currentBreakpoint < BREAKPOINTS.lg;
  const currentViewerStreamAction = null; // Temporary, set to one of the item from `viewerStreamActionTypes` to show the tabs
  const currentViewerStreamActionTitle = `${currentViewerStreamAction
    ?.charAt(0)
    ?.toUpperCase()}${currentViewerStreamAction?.slice(1)}`;

  const toggleChat = useCallback(
    ({ value, skipAnimation } = {}) => {
      const transitionFn = skipAnimation
        ? chatAnimationControls.set
        : chatAnimationControls.start;

      setIsChatVisible((prev) => {
        const next = value || !prev;

        transitionFn(next ? 'visible' : 'hidden');

        return next;
      });
    },
    [chatAnimationControls]
  );

  // Show chat and skip animation when the layout changes
  useEffect(() => {
    toggleChat({ value: true, skipAnimation: true });
  }, [isSplitView, isStackedView, toggleChat]);

  if (channelError) return <PageUnavailable />;

  return (
    <div
      className={clsm([
        'flex',
        'items-center',
        'justify-center',
        'text-center',
        'overflow-x-hidden',
        /* Default View */
        'w-full',
        'h-screen',
        'flex-row',
        /* Stacked View */
        'lg:flex-col',
        'lg:h-full',
        'lg:min-h-screen',
        /* Split View */
        isLandscape && [
          'md:flex-row',
          'md:h-screen',
          'touch-screen-device:lg:flex-row',
          'touch-screen-device:lg:h-screen'
        ]
      ])}
    >
      <Player
        isChatVisible={isChatVisible}
        toggleChat={toggleChat}
        channelData={channelData}
      />
      <NotificationProvider>
        <m.section
          ref={chatContainerRef}
          animate={chatAnimationControls}
          initial="visible"
          exit="hidden"
          variants={{
            visible: {
              x: 0,
              width: isSplitView ? 308 : isStackedView ? '100%' : 360,
              transitionEnd: { x: 0 }
            },
            hidden: { x: '100%', width: 0 }
          }}
          transition={chatDefaultTransition}
          className={clsm([
            'relative',
            'flex',
            'flex-shrink-0',
            'bg-white',
            'dark:bg-darkMode-gray-dark',
            'overflow-hidden',
            /* Default View */
            'w-[360px]',
            'h-screen',
            /* Stacked View */
            'lg:w-full',
            'lg:h-full',
            'lg:flex-grow',
            'lg:min-h-[200px]',
            /* Split View */
            isLandscape && [
              'md:w-[308px]',
              'md:h-screen',
              'md:min-h-[auto]',
              'touch-screen-device:lg:w-[308px]',
              'touch-screen-device:lg:h-screen',
              'touch-screen-device:lg:min-h-[auto]'
            ]
          ])}
        >
          <Tabs>
            {!!currentViewerStreamAction && isStackedView && (
              <>
                <Tabs.List
                  selectedIndex={selectedTabIndex}
                  setSelectedIndex={setSelectedTabIndex}
                  tabs={[
                    { label: currentViewerStreamActionTitle, panelIndex: 0 },
                    { label: $channelContent.tabs.chat, panelIndex: 1 }
                  ]}
                />
                <Tabs.Panel index={0} selectedIndex={selectedTabIndex}>
                  {/* Temporary - START */}
                  <div
                    className={clsm([
                      'flex',
                      'h-56',
                      'items-center',
                      'justify-center',
                      'mb-4',
                      'mx-auto',
                      'rounded-3xl',
                      'w-[calc(100%_-_40px)]',
                      `bg-profile-${channelData?.color}`
                    ])}
                  >
                    <Button variant="secondary">
                      {currentViewerStreamActionTitle} goes here
                    </Button>
                  </div>
                  {/* Temporary - END */}
                </Tabs.Panel>
              </>
            )}
            <Tabs.Panel index={1} selectedIndex={selectedTabIndex}>
              <Chat chatContainerRef={chatContainerRef} />
            </Tabs.Panel>
          </Tabs>
        </m.section>
      </NotificationProvider>
      {isSplitView && !isSessionValid && !isChatVisible && (
        <MobileNavbar
          className={clsm(
            isLandscape && 'lg:max-w-[calc(100vw_-_(352px_+_96px))]'
          )}
        />
      )}
    </div>
  );
};

export default Channel;
