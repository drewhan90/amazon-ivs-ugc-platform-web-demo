import PropTypes from 'prop-types';
import { m } from 'framer-motion';

import { dashboard as $dashboardContent } from '../../../../../../../content';
import { ErrorIcon, Check } from '../../../../../../../assets/icons';
import { formatDate, formatTime } from '../../../../../../../hooks/useDateTime';
import Button from '../../../../../../../components/Button';
import Tooltip from '../../../../../../../components/Tooltip';
import './StreamEventsList.css';
import useStringOverflow from '../../../../../../../hooks/useStringOverflow';

const $content = $dashboardContent.stream_session_page.stream_events;

const StreamEventItem = ({
  handleEventClick,
  isLive,
  selectedEventId,
  setSelectedEventRef,
  streamEvent,
  toggleLearnMore
}) => {
  const [isNameOverflowing, eventNameRef] = useStringOverflow();
  const { id, name, error, success, eventTime, shortMsg, longMsg } =
    streamEvent;
  const isSelected = id === selectedEventId;
  const isExpandable = !!shortMsg;
  const hasLearnMore = !!longMsg;
  const date = formatDate(eventTime);
  const time = formatTime(eventTime, null, isLive);
  let eventTimestamp = isLive ? time : `${date} ${time}`;
  eventTimestamp =
    eventTimestamp.charAt(0).toUpperCase() + eventTimestamp.slice(1);

  const eventItemClasses = ['event-item'];
  if (isSelected) eventItemClasses.push('selected');
  if (isExpandable) eventItemClasses.push('expandable');

  return (
    <div
      className="event-item-container"
      data-id={id}
      ref={setSelectedEventRef}
    >
      <div className={eventItemClasses.join(' ')}>
        <button
          className="event-button"
          type="button"
          disabled={!isExpandable}
          onClick={(e) => handleEventClick(e, id)}
        >
          <span className={`event-name${error ? ' error' : ''}`}>
            {isNameOverflowing ? (
              <Tooltip message={name}>
                <h4 ref={eventNameRef}>{name}</h4>
              </Tooltip>
            ) : (
              <h4 ref={eventNameRef}>{name}</h4>
            )}

            {error && <ErrorIcon className="error-icon" />}
            {success && <Check className="success-icon" />}
          </span>
          <p className="event-time p2">{eventTimestamp}</p>
        </button>
        {isExpandable && (
          <m.div
            className="event-description-container"
            key="event-content"
            initial="collapsed"
            animate={isSelected ? 'open' : 'collapsed'}
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: 'auto' },
              collapsed: { opacity: 0, height: 0 }
            }}
          >
            <p className="event-description p1">{shortMsg}</p>
            {hasLearnMore && isSelected && (
              <Button
                className="learn-more-button"
                onClick={toggleLearnMore}
                variant="secondary"
              >
                {$content.learn_how_to_fix_it}
              </Button>
            )}
          </m.div>
        )}
      </div>
    </div>
  );
};

StreamEventItem.defaultProps = {
  isLive: false,
  selectedEventId: null
};

StreamEventItem.propTypes = {
  handleEventClick: PropTypes.func.isRequired,
  isLive: PropTypes.bool,
  selectedEventId: PropTypes.string,
  setSelectedEventRef: PropTypes.func.isRequired,
  streamEvent: PropTypes.object.isRequired,
  toggleLearnMore: PropTypes.func.isRequired
};

export default StreamEventItem;
