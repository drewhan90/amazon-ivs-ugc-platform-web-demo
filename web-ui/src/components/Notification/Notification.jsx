import PropTypes from 'prop-types';
import { m, AnimatePresence } from 'framer-motion';

import { Check, Error } from '../../assets/icons';
import { useNotif } from '../../contexts/Notification';
import './Notification.css';

const Notification = ({ top }) => {
  const { NOTIF_TYPES, notif } = useNotif();

  let NotifIcon = null;
  if (notif?.type === NOTIF_TYPES.ERROR) NotifIcon = Error;
  if (notif?.type === NOTIF_TYPES.SUCCESS) NotifIcon = Check;

  return (
    <AnimatePresence exitBeforeEnter>
      {notif && (
        <m.div
          animate="visible"
          className={`notification ${notif.type}`}
          exit="hidden"
          initial="hidden"
          key={`${notif.type}-notification`}
          style={{ top }}
          transition={{ duration: 0.25, type: 'tween' }}
          variants={{
            hidden: { opacity: 0, y: -25 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <NotifIcon className="notif-icon" />
          {notif.message}
        </m.div>
      )}
    </AnimatePresence>
  );
};

Notification.defaultProps = { top: 15 };

Notification.propTypes = { top: PropTypes.number };

export default Notification;