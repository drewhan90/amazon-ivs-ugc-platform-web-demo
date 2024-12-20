import React, { useCallback, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { motion } from 'framer-motion';
import { clsm } from '../../../../../utils';
import { streamManager as $content } from '../../../../../content';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import Tooltip from '../../../../../components/Tooltip';
import Button from '../../../../../components/Button';
import { PersonAdd, Group, Menu } from '../../../../../assets/icons';
import { CONTROLLER_BUTTON_THEME } from '../BroadcastControl/BroadcastControllerTheme';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import { MODAL_TYPE, useModal } from '../../../../../contexts/Modal';
import { StageMenu } from '.';
import RequestIndicator from './RequestIndicator';
import { useStageManager } from '../../../../../contexts/StageManager';
import {
  FULLSCREEN_ANIMATION_DURATION,
  PARTICIPANT_TYPES
} from '../../../../../constants';

const $stageContent = $content.stream_manager_stage;

const StageControl = ({ shouldShowCopyLinkText = true }) => {
  const {
    fullscreen: { isOpen: isFullscreenOpen }
  } = useSelector((state) => state.streamManager);
  const { collaborate } = useSelector((state) => state.shared);
  const { openModal } = useModal();
  const { isTouchscreenDevice, dimensions } = useResponsiveDevice();
  const { user: userStage = null, stageControls = null } =
    useStageManager() || {};
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Participant type
  const isHost = collaborate.participantType === PARTICIPANT_TYPES.HOST;
  const isSpectator =
    collaborate.participantType === PARTICIPANT_TYPES.SPECTATOR;

  // Refs
  const participantsButtonRef = useRef();
  const containerRef = useRef();
  const stageMenuToggleBtnRef = useRef();

  // Stage Controls UI
  const isStageActive = userStage?.isConnected;
  const shouldDisableCopyLinkButton = isStageActive && isSpectator;
  const shouldDisplayInviteParticipantButton = isStageActive && isHost;
  const { shouldRenderInviteLinkButton, copyInviteUrl } = stageControls || {};
  const shouldDisplayHostXSControls = isHost && dimensions?.width < 375;

  const handleOpenParticipantsModal = () => {
    openModal({
      type: MODAL_TYPE.STAGE_PARTICIPANTS,
      lastFocusedElement: participantsButtonRef
    });
  };

  const handleToggleStageMenu = useCallback(
    (isOpen = null) => {
      if (typeof isOpen === 'boolean') {
        setIsMenuOpen(isOpen);
      } else {
        setIsMenuOpen(!isMenuOpen);
      }
    },
    [isMenuOpen]
  );

  const containerMarginRight = useMemo(() => {
    if (isFullscreenOpen) {
      return dimensions?.width < 375 ? 'mr-[48px]' : 'mr-[60px]';
    }
  }, [dimensions?.width, isFullscreenOpen]);

  return (
    <div
      ref={containerRef}
      className={clsm(['flex', 'items-center', containerMarginRight])}
    >
      <motion.div
        key="stage-full-screen-footer"
        className={clsm([
          'flex',
          'items-center',
          shouldDisplayHostXSControls ? 'space-x-1' : 'space-x-4'
        ])}
        {...(shouldShowCopyLinkText &&
          createAnimationProps({
            animations: ['fadeIn-full'],
            customVariants: {
              visible: {
                transition: {
                  opacity: { delay: FULLSCREEN_ANIMATION_DURATION }
                }
              }
            },
            options: {
              isVisible: isStageActive
            }
          }))}
      >
        {shouldDisplayHostXSControls ? (
          <>
            <Button
              ariaLabel="Toggle menu"
              ref={stageMenuToggleBtnRef}
              key="toggle-menu-btn"
              variant="icon"
              onClick={handleToggleStageMenu}
              disableHover={isTouchscreenDevice}
              className={clsm([
                'w-11',
                'h-11',
                'dark:[&>svg]:fill-white',
                '[&>svg]:fill-black',
                'dark:bg-darkMode-gray',
                !isTouchscreenDevice && 'hover:bg-lightMode-gray-hover',
                'dark:focus:bg-darkMode-gray',
                'bg-lightMode-gray'
              ])}
            >
              <motion.div
                className={clsm([
                  'dark:[&>svg]:fill-white',
                  '[&>svg]:fill-black',
                  '[&>svg]:w-6',
                  '[&>svg]:h-6'
                ])}
                {...createAnimationProps({
                  transition: { type: 'easeInOut', from: 0.6, duration: 0.8 },
                  controls: { opacity: 1 }
                })}
              >
                <Menu
                  className={clsm([
                    'dark:fill-white',
                    'fill-white-player',
                    'h-6',
                    'w-6'
                  ])}
                />
              </motion.div>
            </Button>
            <StageMenu
              isOpen={isMenuOpen}
              toggleBtnRef={stageMenuToggleBtnRef}
              toggleMenu={handleToggleStageMenu}
            />
          </>
        ) : (
          <>
            {shouldDisplayInviteParticipantButton && (
              <Tooltip
                key="stage-control-tooltip-collaborate"
                position="above"
                translate={{ y: 2 }}
                message={$stageContent.participants}
              >
                <Button
                  ariaLabel={$stageContent.participants}
                  key="stage-participants-control-btn"
                  variant="icon"
                  ref={participantsButtonRef}
                  onClick={handleOpenParticipantsModal}
                  className={clsm([
                    'relative',
                    'w-11',
                    'h-11',
                    'dark:[&>svg]:fill-white',
                    '[&>svg]:fill-black',
                    'dark:bg-darkMode-gray',
                    !isTouchscreenDevice && 'hover:bg-lightMode-gray-hover',
                    'dark:focus:bg-darkMode-gray',
                    'bg-lightMode-gray'
                  ])}
                >
                  <Group />
                  {collaborate.requestList.length > 0 && (
                    <RequestIndicator
                      stageRequestsCount={collaborate.requestList.length}
                      className={clsm(['left-7', '-top-1'])}
                    />
                  )}
                </Button>
              </Tooltip>
            )}
            {shouldRenderInviteLinkButton && (
              <Tooltip
                key="stage-control-tooltip-copy-link"
                position="above"
                translate={{ y: 2 }}
                message={
                  !shouldDisableCopyLinkButton &&
                  $stageContent.copy_session_link
                }
              >
                <Button
                  className={clsm([
                    shouldShowCopyLinkText
                      ? ['px-4', 'space-x-1']
                      : 'px-[10px]',
                    'w-full',
                    CONTROLLER_BUTTON_THEME,
                    !shouldShowCopyLinkText && ['min-w-0']
                  ])}
                  onClick={copyInviteUrl}
                  variant="secondary"
                  isDisabled={shouldDisableCopyLinkButton}
                >
                  <PersonAdd
                    className={clsm([
                      'w-6',
                      'h-6',
                      !shouldShowCopyLinkText && ['mr-0', 'p-0']
                    ])}
                  />
                  <p>{shouldShowCopyLinkText && $stageContent.copy_link}</p>
                </Button>
              </Tooltip>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

StageControl.propTypes = {
  shouldShowCopyLinkText: PropTypes.bool
};

export default StageControl;
