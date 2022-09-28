import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import useSWR from 'swr';

import { getCurrentSession } from '../api/utils';
import { userManagementAPI } from '../api';
import useContextHook from './useContextHook';
import useLocalStorage from '../hooks/useLocalStorage';
import usePrevious from '../hooks/usePrevious';

const Context = createContext(null);
Context.displayName = 'User';

const getCurrentSessionFetcher = async () => {
  const { result: data, error } = await getCurrentSession();

  if (error) throw error;

  return data;
};

export const Provider = ({ children }) => {
  const [isCreatingResources, setIsCreatingResources] = useState(false);
  const [hasErrorCreatingResources, setHasErrorCreatingResources] =
    useState(false);
  const [userData, setUserData] = useState();
  const [isSessionValid, setIsSessionValid] = useState();
  const [logOutAction, setLogOutAction] = useState('');
  const prevIsSessionValid = usePrevious(isSessionValid);
  const { remove: removeStoredUserData } = useLocalStorage({
    key: userData?.username,
    options: { keyPrefix: 'user' }
  });

  const {
    data: session,
    mutate: checkSessionStatus, // mutate forces refetching the data, we use it after login and after logout
    error
  } = useSWR('getCurrentSession', getCurrentSessionFetcher);

  const fetchUserData = useCallback(async () => {
    const { result } = await userManagementAPI.getUserData();

    if (result) {
      setUserData(
        (prevUserData) =>
          JSON.stringify(result) === JSON.stringify(prevUserData)
            ? prevUserData // userData is the same, no need to re-render any downstream context subscribers
            : result // userData changed, so we must re-render all downstream context subscribers
      );
    }

    return result;
  }, []);

  // Initialize user resources
  const initUserResources = useCallback(async () => {
    if (await fetchUserData()) return;

    setIsCreatingResources(true);
    setHasErrorCreatingResources(false);
    const { result, error } = await userManagementAPI.createResources();

    if (result) await fetchUserData();
    if (error) setHasErrorCreatingResources(true);

    setIsCreatingResources(false);
  }, [fetchUserData]);

  const logOut = useCallback(
    (action) => {
      setLogOutAction(action);
      userManagementAPI.signOut();
      checkSessionStatus();
      setUserData(null);
      removeStoredUserData();
    },
    [checkSessionStatus, removeStoredUserData]
  );

  // Initial session check on page load
  useEffect(() => {
    if (error) {
      setIsSessionValid(false);
    } else if (session !== undefined) {
      setIsSessionValid(!!session);
    }
  }, [error, session]);

  // Initial fetch of the user data
  useEffect(() => {
    if (!userData && isSessionValid) {
      fetchUserData();
    }
  }, [fetchUserData, isSessionValid, userData]);

  const value = useMemo(
    () => ({
      checkSessionStatus,
      fetchUserData,
      hasErrorCreatingResources,
      initUserResources,
      isCreatingResources,
      isSessionValid,
      logOut,
      logOutAction,
      prevIsSessionValid,
      userData
    }),
    [
      checkSessionStatus,
      fetchUserData,
      hasErrorCreatingResources,
      initUserResources,
      isCreatingResources,
      isSessionValid,
      logOut,
      logOutAction,
      prevIsSessionValid,
      userData
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useUser = () => useContextHook(Context);
