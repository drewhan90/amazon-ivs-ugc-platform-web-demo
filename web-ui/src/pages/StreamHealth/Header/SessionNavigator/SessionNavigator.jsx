import PropTypes from 'prop-types';
import { forwardRef } from 'react';

import { bound } from '../../../../utils';
import { ChevronLeft, ChevronRight } from '../../../../assets/icons';
import { dashboard as $dashboardContent } from '../../../../content';
import { useStreams } from '../../../../contexts/Streams';
import Button from '../../../../components/Button';
import useDateTime from '../../../../hooks/useDateTime';
import './SessionNavigator.css';

const $content = $dashboardContent.header;

const SessionNavigator = forwardRef(
  ({ isNavOpen, toggleNavPopup }, navButtonRef) => {
    const {
      activeStreamSession,
      fetchStreamSessionsError,
      isInitialFetchingStreamData,
      streamSessions,
      updateActiveStreamSession,
      refreshCurrentStreamSessions
    } = useStreams();
    const { startTime, endTime, isLive } = activeStreamSession || {};
    const [date, time, dayDiff] = useDateTime(startTime, endTime, 5);

    const sessionsLength = streamSessions?.length;
    const isPrevDisabled =
      !activeStreamSession ||
      !sessionsLength ||
      activeStreamSession.index === 0;
    const isNextDisabled =
      !activeStreamSession ||
      !sessionsLength ||
      activeStreamSession.index === sessionsLength - 1;

    const handleSessionNavigator = () => {
      if (!isNavOpen) refreshCurrentStreamSessions();
      toggleNavPopup();
    };

    const handleNextStream = (e) => {
      if (!isNextDisabled) {
        const nextStreamSessionIdx = bound(
          activeStreamSession.index + 1,
          0,
          sessionsLength
        );

        updateActiveStreamSession(streamSessions?.[nextStreamSessionIdx]);
      }
    };

    const handlePreviousStream = () => {
      if (!isPrevDisabled) {
        const prevStreamSessionIdx = bound(
          activeStreamSession.index - 1,
          0,
          sessionsLength
        );
        updateActiveStreamSession(streamSessions?.[prevStreamSessionIdx]);
      }
    };

    return (
      <>
        <div className="session-navigator">
          <Button
            className="nav-button"
            isDisabled={isNextDisabled}
            onClick={handleNextStream}
            variant="secondary"
          >
            <ChevronLeft />
          </Button>
          <Button
            className="session-list"
            isDisabled={!!fetchStreamSessionsError}
            onClick={handleSessionNavigator}
            ref={navButtonRef}
            variant="secondary"
          >
            <span className="date-time-container">
              {isNavOpen || !activeStreamSession ? (
                <>
                  <p className="date">{$content.stream_session}</p>
                  {!fetchStreamSessionsError &&
                    !isInitialFetchingStreamData && (
                      <p className="time p3">
                        {$content.select_stream_session}
                      </p>
                    )}
                </>
              ) : (
                <>
                  <p className="date">{date}</p>
                  <span className="time p3">
                    {isLive
                      ? `${$content.session_navigator.started} ${time}`
                      : time}
                    {dayDiff > 0 && <p className="day-diff p3">+{dayDiff}d</p>}
                  </span>
                </>
              )}
            </span>
          </Button>
          <Button
            className="nav-button"
            isDisabled={isPrevDisabled}
            onClick={handlePreviousStream}
            variant="secondary"
          >
            <ChevronRight />
          </Button>
        </div>
      </>
    );
  }
);

SessionNavigator.defaultProps = { isNavOpen: false };

SessionNavigator.propTypes = {
  isNavOpen: PropTypes.bool,
  toggleNavPopup: PropTypes.func.isRequired
};

export default SessionNavigator;