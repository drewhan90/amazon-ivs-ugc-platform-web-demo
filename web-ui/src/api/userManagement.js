import { promisify } from 'util';
import { AuthenticationDetails } from 'amazon-cognito-identity-js';

import {
  apiBaseUrl,
  authFetch,
  getCognitoUser,
  unauthFetch,
  userPool
} from './utils';

/**
 * Register a new user
 * @param {object} userData registration information about the new user
 * @param {string} userData.username
 * @param {string} userData.email
 * @param {string} userData.password
 */
export const register = async (userData) =>
  await unauthFetch({
    body: userData,
    method: 'POST',
    url: `${apiBaseUrl}/user/register`
  });

/**
 * Sign in an existing user
 * @param {object} userData information about the new user
 * @param {string} userData.username
 * @param {string} userData.password
 */
export const signIn = async (userData) => {
  const { username, password } = userData;
  const cognitoUser = await getCognitoUser(username);
  const authenticationDetails = new AuthenticationDetails({
    ClientMetadata: { submittedUsername: username },
    Username: username,
    Password: password
  });
  let result, error;

  cognitoUser.authenticateUser[promisify.custom] = () =>
    new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: resolve,
        onFailure: reject
      });
    });

  try {
    const authenticate = promisify(cognitoUser.authenticateUser);
    result = await authenticate();
  } catch (err) {
    error = err;
    console.error(err);
  }

  return { result, error };
};

export const signOut = () => {
  const cognitoUser = userPool.getCurrentUser();
  cognitoUser.signOut();
  return true;
};

/**
 * Reset the password of an existing user
 * @param {object} userData information about the new user
 * @param {string} userData.email
 */
export const sendResetPasswordRequest = async (userData) =>
  await unauthFetch({
    body: userData,
    method: 'POST',
    url: `${apiBaseUrl}/user/password/reset`
  });

export const resetPassword = async (
  username,
  verificationCode,
  newPassword
) => {
  const cognitoUser = await getCognitoUser(username);
  let result, error;

  cognitoUser.confirmPassword[promisify.custom] = () =>
    new Promise((resolve, reject) => {
      cognitoUser.confirmPassword(verificationCode, newPassword, {
        onSuccess: resolve,
        onFailure: reject
      });
    });

  try {
    const confirmPassword = promisify(cognitoUser.confirmPassword);
    result = await confirmPassword();
  } catch (err) {
    error = err;
    console.error(err);
  }

  return { result, error };
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  const cognitoUser = await getCognitoUser();
  let result, error;

  cognitoUser.changePassword[promisify.custom] = () =>
    new Promise((resolve, reject) => {
      cognitoUser.changePassword(currentPassword, newPassword, (err, val) => {
        if (val) resolve(val);
        reject(err);
      });
    });

  try {
    const changeUserPassword = promisify(cognitoUser.changePassword);
    result = await changeUserPassword();
  } catch (err) {
    error = err;
    console.error(err);
  }

  return { result, error };
};

export const verifyUserEmail = async (username, verificationCode) => {
  const cognitoUser = await getCognitoUser(username);
  let result, error;

  cognitoUser.confirmRegistration[promisify.custom] = () =>
    new Promise((resolve, reject) => {
      cognitoUser.confirmRegistration(verificationCode, false, (err, val) => {
        if (val) resolve(val);
        reject(err);
      });
    });

  try {
    const confirmRegistration = promisify(cognitoUser.confirmRegistration);
    result = await confirmRegistration();
  } catch (err) {
    error = err;
    console.error(err);
  }

  return { result, error };
};

export const resendVerificationRequest = async (username) => {
  const cognitoUser = await getCognitoUser(username);
  let result, error;

  cognitoUser.resendConfirmationCode[promisify.custom] = () =>
    new Promise((resolve, reject) => {
      cognitoUser.resendConfirmationCode((err, val) => {
        if (val) resolve(val);
        reject(err);
      });
    });

  try {
    const resendConfirmationCode = promisify(
      cognitoUser.resendConfirmationCode
    );
    result = await resendConfirmationCode();
  } catch (err) {
    error = err;
    console.error(err);
  }

  return { result, error };
};

export const createResources = async () =>
  await authFetch({
    url: `${apiBaseUrl}/user/resources/create`,
    method: 'POST',
    includeUserData: true
  });

export const getUserData = async () =>
  await authFetch({ url: `${apiBaseUrl}/user` });

export const changeUsername = async ({ username: newUsername }) =>
  await authFetch({
    body: { newUsername },
    method: 'PUT',
    url: `${apiBaseUrl}/user/username/update`
  });

export const resetStreamKey = async () =>
  await authFetch({ url: `${apiBaseUrl}/user/streamKey/reset` });

export const deleteAccount = async () =>
  await authFetch({ url: `${apiBaseUrl}/user`, method: 'DELETE' });