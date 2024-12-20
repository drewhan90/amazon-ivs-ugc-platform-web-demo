import { forwardRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { useChannel } from '../../../contexts/Channel';
import { usePlayerContext } from '../contexts/Player';
import { useProfileViewAnimation } from '../contexts/ProfileViewAnimation';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import Controls from './Controls';
import PlayerOverlay from './PlayerOverlay';
import StageVideoFeeds from '../../StreamManager/streamManagerCards/StreamManagerWebBroadcast/StageVideoFeeds';
import { STAGE_VIDEO_FEEDS_TYPES } from '../../StreamManager/streamManagerCards/StreamManagerWebBroadcast/StageVideoFeeds/StageVideoFeeds';
import UnmuteButtonOverLay from './UnmuteButtonOverLay';

const StreamVideo = forwardRef(
  (
    {
      isFullscreenEnabled,
      isPlayerLoading,
      stagePlayerVisible,
      isVisible,
      onClickFullscreenHandler,
      onClickPlayerHandler,
      openPopupIds,
      playerProfileViewAnimationProps,
      setOpenPopupIds
    },
    ref
  ) => {
    const { isPlayerMuted } = useSelector((state) => state.channel);

    const {
      isProfileViewExpanded,
      runningAnimationIds,
      shouldAnimateProfileView
    } = useProfileViewAnimation();
    const {
      isOverlayVisible,
      onMouseMoveHandler,
      openOverlayAndResetTimeout,
      player: { selectedQualityName, isPaused }
    } = usePlayerContext();
    const { channelData: { isViewerBanned } = {} } = useChannel();
    const { isDefaultResponsiveView } = useResponsiveDevice();
    const isPlayerAnimationRunning = runningAnimationIds.includes('player');
    const isProfileViewStagePlayer =
      isProfileViewExpanded && stagePlayerVisible;
    const shouldShowControlsOverlay =
      !isProfileViewStagePlayer &&
      isOverlayVisible &&
      !isPlayerAnimationRunning &&
      !isViewerBanned;
    const areControlsContained = !!(
      isProfileViewExpanded ^ isPlayerAnimationRunning
    );
    const videoStyles = [
      'absolute',
      'w-full',
      'aspect-auto',
      'transition-colors',
      '-z-10',
      shouldAnimateProfileView.current ? 'duration-[400ms]' : 'duration-0',
      isProfileViewExpanded
        ? ['bg-lightMode-gray', 'dark:bg-darkMode-gray-medium']
        : 'bg-transparent',
      isProfileViewExpanded && [
        isDefaultResponsiveView ? 'w-[90%]' : 'w-[70%]',
        'h-auto'
      ] // ensures the video has the correct dimensions when it mounts in the expanded profile view state
    ];

    // This function prevents click events to be triggered on the controls while the controls are hidden
    const onClickCaptureControlsHandler = (event) => {
      event.stopPropagation();
      onClickPlayerHandler(event);
    };

    // Open the controls and reset the timeout when the player animation stops,
    // given that the player is not in a paused state
    useEffect(() => {
      if (!isPlayerAnimationRunning && !isPaused) openOverlayAndResetTimeout();
    }, [isPaused, isPlayerAnimationRunning, openOverlayAndResetTimeout]);

    const renderVideo = stagePlayerVisible ? (
      <motion.div
        {...playerProfileViewAnimationProps}
        className={clsm(videoStyles, isViewerBanned && '!hidden')}
        ref={ref}
      >
        <StageVideoFeeds
          type={STAGE_VIDEO_FEEDS_TYPES.CHANNEL}
          isProfileViewExpanded={isProfileViewExpanded}
          styles={clsm(
            'dark:bg-black',
            isProfileViewExpanded ? 'bg-white' : 'bg-lightMode-gray'
          )}
        />
      </motion.div>
    ) : (
      <motion.video
        {...playerProfileViewAnimationProps}
        className={clsm(
          videoStyles,
          (isPlayerLoading || isViewerBanned) && '!hidden'
        )}
        muted
        playsInline
        ref={ref}
      />
    );

    return (
      <>
        {renderVideo}
        <motion.div
          {...playerProfileViewAnimationProps}
          className={clsm([
            'absolute',
            isProfileViewExpanded && '-z-10', // makes sure that the player header is stacked above the player controls
            !areControlsContained && ['!aspect-auto', '!w-full', '!h-full'],
            !isVisible && '!hidden'
          ])}
          onClick={onClickPlayerHandler}
          onMouseMove={onMouseMoveHandler}
          role="toolbar"
        >
          <PlayerOverlay
            {...(areControlsContained && { className: 'before:rounded-b-3xl' })}
            isVisible={shouldShowControlsOverlay}
          >
            <Controls
              areControlsContained={areControlsContained}
              isFullscreenEnabled={isFullscreenEnabled}
              onClickFullscreenHandler={onClickFullscreenHandler}
              openPopupIds={openPopupIds}
              selectedQualityName={selectedQualityName}
              setOpenPopupIds={setOpenPopupIds}
              isPlayPauseEnabled={!stagePlayerVisible}
              isRenditionSettingEnabled={!stagePlayerVisible}
              isVolumeSettingEnabled={!stagePlayerVisible}
            />
          </PlayerOverlay>
          {stagePlayerVisible && isPlayerMuted && <UnmuteButtonOverLay />}
          {!shouldShowControlsOverlay && (
            <div
              className={clsm(['absolute', 'h-full', 'top-0', 'w-full'])}
              onClickCapture={onClickCaptureControlsHandler}
            />
          )}
        </motion.div>
      </>
    );
  }
);

StreamVideo.propTypes = {
  isFullscreenEnabled: PropTypes.bool,
  isPlayerLoading: PropTypes.bool,
  isVisible: PropTypes.bool,
  onClickFullscreenHandler: PropTypes.func.isRequired,
  onClickPlayerHandler: PropTypes.func.isRequired,
  openPopupIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  playerProfileViewAnimationProps: PropTypes.object.isRequired,
  setOpenPopupIds: PropTypes.func.isRequired,
  stagePlayerVisible: PropTypes.bool
};

StreamVideo.defaultProps = {
  isFullscreenEnabled: false,
  isPlayerLoading: false,
  isVisible: false,
  stagePlayerVisible: false
};

export default StreamVideo;
