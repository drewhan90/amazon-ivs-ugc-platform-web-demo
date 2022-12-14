import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { channelAPI } from '../../../../api';
import { clsm } from '../../../../utils';
import { useNotif } from '../../../../contexts/Notification';
import { userManagement as $content } from '../../../../content';
import Button from '../../../../components/Button';

const ResetPasswordRequestConfirmation = ({ email }) => {
  const { notifySuccess, notifyError } = useNotif();

  const resend = async () => {
    const userData = { email };
    const { result, error } = await channelAPI.sendResetPasswordRequest(
      userData
    );

    if (result) {
      notifySuccess($content.notification.success.resent_confirmation);
    }

    if (error) {
      notifyError($content.notification.error.unexpected_error_occurred);
    }
  };

  return (
    <div className="sub-page-container">
      <h2>{$content.reset_password_page.title}</h2>
      <p className="text-p1">{$content.reset_password_page.email_link_sent}</p>
      <span className={clsm(['flex', 'items-center', 'space-x-5'])}>
        <b>{$content.did_not_receive_email}</b>
        <Button onClick={resend} type="button" variant="secondary">
          {$content.resend}
        </Button>
      </span>
      <Link to="/login">{$content.return_to_login}</Link>
    </div>
  );
};

ResetPasswordRequestConfirmation.propTypes = {
  email: PropTypes.string.isRequired
};

export default ResetPasswordRequestConfirmation;
