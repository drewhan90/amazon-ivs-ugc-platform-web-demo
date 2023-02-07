import {
  createContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  generatePath,
  useLocation,
  useNavigate,
  useNavigationType,
  useOutletContext,
  useParams
} from 'react-router-dom';
import PropTypes from 'prop-types';

import { createProfileViewVariants, getProfileViewVariant } from './utils';
import { DEFAULT_PROFILE_VIEW_TRANSITION } from '../../../../constants';
import { useAnimationControls } from 'framer-motion';
import { useChannelView } from '../ChannelView';
import useContextHook from '../../../../contexts/useContextHook';
import useDebouncedCallback from '../../../../hooks/useDebouncedCallback';
import useDidChange from '../../../../hooks/useDidChange';
import useFirstMount from '../../../../hooks/useFirstMount';
import useLatest from '../../../../hooks/useLatest';
import useStateWithCallback from '../../../../hooks/useStateWithCallback';
import useThrottledCallback from '../../../../hooks/useThrottledCallback';

const Context = createContext(null);
Context.displayName = 'ProfileViewAnimation';

export const Provider = ({ children }) => {
  const { appLayoutRef } = useOutletContext();
  const { pathname } = useLocation();
  const { username: channelUsername } = useParams();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const urlHasProfile = useLatest(pathname.split('/').includes('profile'));

  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isProfileViewExpanded, setIsProfileViewExpanded] =
    useStateWithCallback(urlHasProfile.current);
  const [runningAnimationIds, setRunningAnimationIds] = useState([]);
  const { currentView } = useChannelView();
  const didCurrentViewChange = useDidChange(currentView);
  const didProfileViewChange = useDidChange(isProfileViewExpanded);
  const initialVariant = useRef(
    getProfileViewVariant(isProfileViewExpanded, currentView)
  );
  const isFirstMount = useLatest(useFirstMount());
  const isProfileViewAnimationEnabled = useRef(false);
  const shouldSkipProfileViewAnimation = useRef(false);
  const shouldAnimateProfileView = useLatest(
    didProfileViewChange && !shouldSkipProfileViewAnimation.current
  );

  const isProfileViewAnimationRunning = !!runningAnimationIds.length;

  /* Animation Controls */
  const chatAnimationControls = useAnimationControls();
  const playerAnimationControls = useAnimationControls();
  const headerAnimationControls = useAnimationControls();

  /* Helpers */
  const getProfileViewAnimationProps = useCallback(
    (animationControls, variantStyles, customVariants) => ({
      animate: animationControls,
      transition: DEFAULT_PROFILE_VIEW_TRANSITION,
      initial: initialVariant.current,
      variants: {
        ...createProfileViewVariants(variantStyles),
        ...customVariants
      }
    }),
    []
  );

  const updateProfilePath = useCallback(
    (isExpanded, options) =>
      navigate(
        generatePath('/:username/:profile', {
          username: channelUsername,
          profile: isExpanded ? 'profile' : ''
        }).replace(/\/$/, ''),
        options
      ),
    [channelUsername, navigate]
  );

  /* Toggles */
  const createAnimationToggle = useCallback(
    (animationControls, animationId) =>
      async (
        {
          isExpandedNext = !isProfileViewExpanded,
          skipAnimation = false,
          variant
        } = {
          isExpandedNext: !isProfileViewExpanded,
          skipAnimation: false
        }
      ) => {
        if (runningAnimationIds.includes(animationId)) return;

        const nextVariant =
          variant || getProfileViewVariant(isExpandedNext, currentView);

        animationControls.mount();

        if (skipAnimation) {
          animationControls.set(nextVariant);
        } else {
          setRunningAnimationIds((prev) => [...prev, animationId]);

          await animationControls.start(nextVariant);

          setRunningAnimationIds((prev) =>
            prev.filter((id) => id !== animationId)
          );
        }

        return isExpandedNext;
      },
    [currentView, isProfileViewExpanded, runningAnimationIds]
  );

  const toggleChat = useCallback(
    async (options) => {
      const isExpanded = await createAnimationToggle(
        chatAnimationControls,
        'chat'
      )(options);

      if (options?.variant || isExpanded !== undefined) {
        setIsChatVisible(options?.variant === 'visible' || !isExpanded);
      }
    },
    [createAnimationToggle, chatAnimationControls]
  );

  const togglePlayer = useMemo(
    () => createAnimationToggle(playerAnimationControls, 'player'),
    [createAnimationToggle, playerAnimationControls]
  );

  const toggleHeader = useMemo(
    () => createAnimationToggle(headerAnimationControls, 'header'),
    [createAnimationToggle, headerAnimationControls]
  );

  // Invoking this function is the only way to start the profile view animation
  const toggleProfileView = useCallback(
    (options) => {
      const {
        isExpandedNext,
        skipAnimation = false,
        action = 'user'
      } = options || { skipAnimation: false, action: 'user' };

      if (
        !isProfileViewAnimationEnabled.current ||
        isProfileViewAnimationRunning
      )
        return;

      shouldSkipProfileViewAnimation.current = skipAnimation;
      let _isExpandedNext, animationPromise;

      setIsProfileViewExpanded(
        (prev) => {
          _isExpandedNext =
            isExpandedNext === undefined ? !prev : isExpandedNext;
          const options = { isExpandedNext: _isExpandedNext, skipAnimation };

          appLayoutRef.current.scrollTo(0, 0);
          appLayoutRef.current.style.overflow = _isExpandedNext
            ? 'hidden'
            : null;

          animationPromise = Promise.all([
            toggleChat(options),
            togglePlayer(options),
            toggleHeader(options)
          ]);

          if (action === 'user') updateProfilePath(_isExpandedNext);

          return _isExpandedNext;
        },
        async () => {
          await animationPromise;

          if (urlHasProfile.current !== _isExpandedNext) {
            updateProfilePath(_isExpandedNext);
          }
        }
      );
    },
    [
      appLayoutRef,
      isProfileViewAnimationRunning,
      setIsProfileViewExpanded,
      toggleChat,
      toggleHeader,
      togglePlayer,
      updateProfilePath,
      urlHasProfile
    ]
  );

  const toggleProfileViewThrottled = useThrottledCallback(
    toggleProfileView,
    DEFAULT_PROFILE_VIEW_TRANSITION.duration * 1000 + 200
  );

  const toggleProfileViewDebounced = useDebouncedCallback(
    toggleProfileView,
    200
  );

  // Toggle the profile view based on the existence of the /profile path param
  // when a navigation event occurs (i.e. hitting the browser's back button)
  useEffect(() => {
    if (!isFirstMount.current && navigationType === 'POP') {
      toggleProfileViewDebounced({
        action: 'navigate',
        isExpandedNext: urlHasProfile.current
      });
    }
  }, [
    isFirstMount,
    navigationType,
    pathname,
    toggleProfileViewDebounced,
    urlHasProfile
  ]);

  // Update all toggle states on layout change
  useLayoutEffect(() => {
    if (didCurrentViewChange) {
      toggleProfileView({
        isExpandedNext: isProfileViewExpanded,
        skipAnimation: true
      });
    }
  }, [didCurrentViewChange, isProfileViewExpanded, toggleProfileView]);

  const value = useMemo(() => {
    const enableProfileViewAnimation = () =>
      (isProfileViewAnimationEnabled.current = true);
    const disableProfileViewAnimation = () =>
      (isProfileViewAnimationEnabled.current = false);

    return {
      // controls
      chatAnimationControls,
      playerAnimationControls,
      headerAnimationControls,
      // toggles
      toggleChat,
      toggleProfileView: toggleProfileViewThrottled,
      // helpers
      disableProfileViewAnimation,
      enableProfileViewAnimation,
      getProfileViewAnimationProps,
      // status indicators
      isChatVisible,
      isProfileViewAnimationEnabled,
      isProfileViewAnimationRunning,
      isProfileViewExpanded,
      shouldAnimateProfileView
    };
  }, [
    chatAnimationControls,
    getProfileViewAnimationProps,
    headerAnimationControls,
    isChatVisible,
    isProfileViewAnimationRunning,
    isProfileViewExpanded,
    playerAnimationControls,
    shouldAnimateProfileView,
    toggleChat,
    toggleProfileViewThrottled
  ]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useProfileViewAnimation = () => useContextHook(Context);