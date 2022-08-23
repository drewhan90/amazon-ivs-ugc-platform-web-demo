import { useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';

import { Check, ErrorIcon } from '../../assets/icons';
import {
  useNotif,
  NOTIF_ANIMATION_DURATION_MS
} from '../../contexts/Notification';
import { clsm } from '../../utils';
import useCurrentPage from '../../hooks/useCurrentPage';
import usePrevious from '../../hooks/usePrevious';
import useStateWithCallback from '../../hooks/useStateWithCallback';

const Notification = () => {
  const { NOTIF_TYPES, notif, dismissNotif } = useNotif();
  const [shouldSkipExitAnimation, setShouldSkipExitAnimation] =
    useStateWithCallback(false);
  const currPage = useCurrentPage();
  const prevPage = usePrevious(currPage);

  // Skip the exit animation if the dismissal is triggered by a page change
  useEffect(() => {
    if (notif && currPage && prevPage && currPage !== prevPage) {
      setShouldSkipExitAnimation(true, dismissNotif);
    }
  }, [dismissNotif, currPage, prevPage, setShouldSkipExitAnimation, notif]);

  let NotifIcon = null;
  if (notif?.type === NOTIF_TYPES.ERROR) NotifIcon = ErrorIcon;
  if (notif?.type === NOTIF_TYPES.SUCCESS) NotifIcon = Check;

  return (
    <AnimatePresence
      exitBeforeEnter
      onExitComplete={() => setShouldSkipExitAnimation(false)}
    >
      {notif && (
        <m.div
          animate="visible"
          aria-live="polite"
          className={clsm([
            'notification',
            'absolute',
            'left-0',
            'right-0',
            'top-[32px]',
            'my-0',
            'mx-auto',
            'max-w-[595px]',
            'py-0',
            'px-4',
            'w-fit',
            'z-500'
          ])}
          exit={shouldSkipExitAnimation ? '' : 'hidden'}
          initial="hidden"
          key={`${notif.type}-notification`}
          transition={{
            duration: NOTIF_ANIMATION_DURATION_MS / 1000,
            type: 'tween'
          }}
          variants={{
            hidden: { opacity: 0, y: -25 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <div
            className={clsm([
              'dark:text-black',
              'flex',
              'font-bold',
              'gap-x-[11.5px]',
              'items-center',
              'leading-[18px]',
              'px-[20px]',
              'py-[10px]',
              'rounded-3xl',
              'text-white',
              notif.type === 'error' && [
                'bg-lightMode-red',
                'dark:bg-darkMode-red'
              ],
              notif.type === 'success' && [
                'bg-lightMode-green',
                'dark:bg-darkMode-green'
              ]
            ])}
          >
            <NotifIcon
              className={clsm(['dark:fill-black', 'fill-white', 'shrink-0'])}
            />
            {notif.message}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;
