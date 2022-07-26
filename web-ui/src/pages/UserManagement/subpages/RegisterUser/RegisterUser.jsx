import { Link } from 'react-router-dom';

import { PROFILE_COLORS } from '../../../../constants';
import { userManagement } from '../../../../api';
import { userManagement as $content } from '../../../../content';
import { useState } from 'react';
import { useUser } from '../../../../contexts/User';
import * as avatars from '../../../../assets/avatars';
import Form from '../../../../components/Form';
import RegisterUserRequestConfirmation from './RegisterUserRequestConfirmation';

const RegisterUser = () => {
  const [wasRequestSent, setWasRequestSent] = useState(false);
  const [username, setUsername] = useState('');
  const { initUserResources, checkSessionStatus } = useUser();

  const submitRegistration = async (formValues) => {
    const avatarNames = Object.keys(avatars);
    const avatar =
      avatarNames[Math.floor(Math.random() * (avatarNames.length + 1))];
    const color =
      PROFILE_COLORS[Math.floor(Math.random() * (PROFILE_COLORS.length + 1))];
    const userData = { ...formValues, avatar, color };

    return await userManagement.register(userData);
  };

  const onRequestSuccess = async (result, formValues) => {
    if (result.userConfirmed) {
      const { result: signInResult } = await userManagement.signIn(formValues);

      if (signInResult) {
        await initUserResources();
        checkSessionStatus();
      }
    } else {
      setUsername(formValues.username);
      setWasRequestSent(true);
    }
  };

  return wasRequestSent ? (
    <RegisterUserRequestConfirmation username={username} />
  ) : (
    <Form
      onSuccess={onRequestSuccess}
      submitHandler={submitRegistration}
      submitText={$content.register_page.create_account}
      title={$content.register_page.title}
      footer={
        <span>
          <b>{$content.register_page.have_an_account}</b>&nbsp;
          <Link to="/login">{$content.sign_in}</Link>
        </span>
      }
      inputsData={{
        username: {},
        email: {},
        password: {
          type: 'password',
          confirmedBy: 'confirmPassword',
          description: $content.register_page.password_description
        }
      }}
    />
  );
};

export default RegisterUser;
