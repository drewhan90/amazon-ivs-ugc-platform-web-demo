import { createContext, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { graphqlOperation, API } from '@aws-amplify/api';

import { publishDoc, subscribeDoc } from './graphql';
import useContextHook from '../useContextHook';
import { useUser } from '../User';
import { useNotif } from '../Notification';
import channelEvents from './channelEvents';
import { streamManager as $streamManagerContent } from '../../content';
import { useGlobalStage } from '../Stage';

const $contentNotification =
  $streamManagerContent.stream_manager_stage.notifications;

const Context = createContext(null);
Context.displayName = 'AppSync';

export const Provider = ({ children }) => {
  const { userData } = useUser();
  const { notifyNeutral } = useNotif();
  const { isHost } = useGlobalStage();

  /**
   * @param  {string} name the name of the channel
   * @param  {Object} data the data to publish to the channel
   */
  const publish = useCallback(async (name, data) => {
    return await API.graphql(graphqlOperation(publishDoc, { name, data }));
  }, []);

  /**
   * @param  {string} name the name of the channel
   * @param  {nextCallback} next callback function that will be called with subscription payload data
   * @param  {function} [error] optional function to handle errors
   * @returns {Observable} an observable subscription object
   */
  const subscribe = useCallback((name, next, error) => {
    return API.graphql(graphqlOperation(subscribeDoc, { name })).subscribe({
      next: ({ provider, value }) => {
        next(value.data.subscribe, provider, value);
      },
      error: error || console.log
    });
  }, []);

  useEffect(() => {
    if (!userData?.username) return;

    const channel = userData?.username;
    const subscription = subscribe(channel, ({ data }) => {
      const channelEvent = JSON.parse(data);

      switch (channelEvent?.type) {
        case channelEvents.STAGE_REQUEST_TO_JOIN:
          if (isHost) {
            const { username, type, sent } = channelEvent  
            // process here
            
          }
          break;
        case channelEvents.STAGE_PARTICIPANT_KICKED:
          if (!isHost) {
            notifyNeutral(
              $contentNotification.error.you_were_removed_from_the_session,
              {
                asPortal: true
              }
            );
          }

          break;
        case channelEvents.STAGE_SESSION_HAS_ENDED:
          notifyNeutral($contentNotification.neutral.the_session_ended, {
            asPortal: true
          });
          break;
        default:
          return;
      }
    });
    return () => subscription.unsubscribe();
  }, [isHost, notifyNeutral, subscribe, userData?.username]);

  const value = useMemo(
    () => ({
      publish
    }),
    [publish]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useAppSync = () => useContextHook(Context);
