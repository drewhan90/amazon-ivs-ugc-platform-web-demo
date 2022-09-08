import PropTypes from 'prop-types';

import { clsm } from '../utils';
import * as avatars from '../assets/avatars';

const UserAvatar = ({ avatarName, profileColor, size }) => {
  const hasAvatar = !!avatars[avatarName];
  let dimensions = ['h-11', 'w-11'];

  if (size === 'md') dimensions = ['h-8', 'w-8'];
  if (size === 'sm') dimensions = ['h-6', 'w-6'];

  const avatarClassNames = clsm([
    [
      'bg-lightMode-gray-extraLight',
      'border-2',
      'dark:bg-darkMode-gray-medium',
      'flex-shrink-0',
      'rounded-[22px]',
      'transition-all',
      'z-10'
    ],
    dimensions,
    profileColor ? `border-profile-${profileColor}` : 'border-profile'
  ]);

  return hasAvatar ? (
    <img
      className={avatarClassNames}
      src={avatars[avatarName]}
      alt={`${avatarName || 'Profile'} avatar`}
      draggable={false}
    />
  ) : (
    <div className={avatarClassNames}></div>
  );
};

UserAvatar.defaultProps = {
  size: 'lg'
};

UserAvatar.propTypes = {
  avatarName: PropTypes.string.isRequired,
  profileColor: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

export default UserAvatar;