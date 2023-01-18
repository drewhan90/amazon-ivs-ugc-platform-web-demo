import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { clsm, isTextColorInverted } from '../utils';
import { PROFILE_COLORS } from '../constants';
import { useCallback } from 'react';
import { useResponsiveDevice } from '../contexts/ResponsiveDevice';
import LivePill from './LivePill';
import UserAvatar from './UserAvatar';

const commonChannelCardClasses = [
  '-mb-[1px]',
  'aspect-video',
  'bg-center',
  'bg-cover',
  'rounded-t-xl',
  'transition-colors'
];
const ChannelCard = ({ avatarSrc, bannerSrc, color, username, variant }) => {
  const [hasBannerError, setHasBannerError] = useState(false);
  const [shouldHavePointerEvents, setShouldHavePointerEvents] = useState(false);
  const { isTouchscreenDevice } = useResponsiveDevice();

  const onError = useCallback(() => {
    setHasBannerError(true);
  }, []);

  useEffect(() => {
    // Addresses a potential issue on iOS where, after signin, the first card would get the hover state.
    setShouldHavePointerEvents(true);
  }, []);

  return (
    <Link
      className={clsm([
        'button',
        'dark:focus:ring-white',
        'flex-col',
        'flex',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-black',
        'group',
        'rounded-xl',
        'transition-transform',
        'w-auto',
        !isTouchscreenDevice && 'hover:scale-110',
        shouldHavePointerEvents ? 'pointer-events-auto' : 'pointer-events-none'
      ])}
      to={`/${username}`}
    >
      <div
        className={clsm([
          commonChannelCardClasses,
          'relative',
          `bg-profile-${color}-dark`,
          `dark:group-hover:bg-profile-${color}-darkMode-dark-hover`,
          `group-hover:bg-profile-${color}-lightMode-dark-hover`,
          !hasBannerError && [
            'bg-transparent',
            'dark:bg-transparent',
            `dark:group-hover:bg-transparent`,
            `group-hover:bg-transparent`
          ],
          variant === 'offline' && [
            'bg-lightMode-gray-light',
            'dark:bg-darkMode-gray-dark',
            `dark:group-hover:bg-darkMode-gray-dark`,
            `group-hover:bg-lightMode-gray-light`
          ]
        ])}
      >
        {variant === 'live' && (
          <div
            className={clsm([
              'absolute',
              'right-5',
              'top-5',
              'md:right-4',
              'md:top-4'
            ])}
          >
            <LivePill
              className={clsm(['flex', 'items-center', 'w-[36px]', 'h-[16px]'])}
            />
          </div>
        )}
        {!hasBannerError && (
          <img
            alt=""
            src={bannerSrc}
            onError={onError}
            className={clsm([
              commonChannelCardClasses,
              variant === 'offline' && 'grayscale'
            ])}
          />
        )}
      </div>
      <div
        className={clsm([
          'flex',
          'items-center',
          'p-4',
          'rounded-b-xl',
          'space-x-4',
          'transition-colors',
          `bg-profile-${color}`,
          `group-hover:bg-profile-${color}-lightMode-primary-hover`,
          `dark:group-hover:bg-profile-${color}-darkMode-primary-hover`,
          variant === 'offline' && [
            'bg-lightMode-gray',
            'dark:bg-darkMode-gray',
            'dark:group-hover:bg-darkMode-gray',
            'group-hover:bg-lightMode-gray'
          ]
        ])}
      >
        <UserAvatar
          avatarSrc={avatarSrc}
          profileColor="white"
          isOffline={variant === 'offline'}
        />
        <h3
          className={clsm([
            'truncate',
            'text-black',
            isTextColorInverted(color) && 'text-white',
            variant === 'offline' && ['dark:text-white', 'text-black']
          ])}
        >
          {username}
        </h3>
      </div>
    </Link>
  );
};

ChannelCard.propTypes = {
  avatarSrc: PropTypes.string,
  bannerSrc: PropTypes.string,
  color: PropTypes.oneOf([...PROFILE_COLORS, 'default']),
  username: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'offline', 'live'])
};

ChannelCard.defaultProps = {
  avatarSrc: '',
  bannerSrc: '',
  color: 'default',
  username: '',
  variant: 'default'
};

export default ChannelCard;
