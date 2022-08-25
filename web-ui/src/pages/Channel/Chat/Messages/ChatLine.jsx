import PropTypes from 'prop-types';

import { clsm } from '../../../../utils';
import * as avatars from '../../../../assets/avatars';

const ChatLine = ({ message, avatar, color, displayName }) => (
  <div
    className={clsm([
      'flex',
      'flex-row',
      'items-start',
      'gap-x-1.5',
      'rounded-3xl',
      'py-2.5',
      'px-3.5',
      'bg-lightMode-gray-extraLight',
      'dark:bg-darkMode-gray-medium'
    ])}
  >
    <img
      className={clsm(
        ['w-7', 'h-7', 'rounded-[14px]', 'border-2'],
        color ? `border-profile-${color}` : 'border-profile'
      )}
      src={avatars[avatar]}
      alt={`${avatar || 'Profile'} avatar`}
      draggable={false}
    />
    <p
      className={clsm([
        'p1',
        'text-left',
        'text-darkMode-gray-light',
        'my-0.5'
      ])}
    >
      <b>{displayName.charAt(0).toUpperCase() + displayName.slice(1)}</b>
      &nbsp;
      {message}
    </p>
  </div>
);

ChatLine.propTypes = {
  message: PropTypes.string.isRequired,
  avatar: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired
};

export default ChatLine;
