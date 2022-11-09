// @ts-check
const { test: baseTest, expect } = require('@playwright/test');
const {
  CognitoAccessToken,
  CognitoIdToken,
  CognitoRefreshToken
} = require('amazon-cognito-identity-js');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const defaultExtendedTestFixtureOptions = { isAuthenticated: true };

const extendTestFixtures = (pageModels = [], options = {}) => {
  const { isAuthenticated } = {
    ...defaultExtendedTestFixtureOptions,
    ...options
  };

  return baseTest.extend({
    /**
     * Page fixture override
     */
    page: async ({ page, screenshot }, use, testInfo) => {
      // "getLocalStorage" will retrieve the contents of the local storage in the current browser context
      page.getLocalStorage = async () => {
        const storageState = await page.context().storageState();
        const localStorage = storageState.origins[0]?.localStorage;

        return localStorage;
      };

      /**
       * "takeScreenshot" is a wrapper around Playwright's "toHaveScreenshot" assertion, which generates a
       * descriptive filename composed of the `name` argument and the test title. When the `name` argument
       * is omitted, an auto-generated screenshot name is used instead. Playwright then appends the browser
       * name and the platform to this filename and uses that as the name of the screenshot file.
       *
       * On the first execution, Playwright Test will generate reference screenshots, or "golden images."
       * Subsequent runs will compare against the golden images.
       *
       * @param {string} [name] An optional screenshot name.
       */
      page.takeScreenshot = async (name) => {
        const testTitle = testInfo?.titlePath[1].replace(/\s/g, '');
        const filename =
          testTitle && name ? `${[testTitle, name].join('-')}.png` : undefined;

        // Temporary check to ensure we don't run screenshot assertions on the CI
        if (!process.env.CI) {
          await expect.soft(page).toHaveScreenshot(filename);
        }
      };

      /**
       * "fetchResponses" is a list that contains all the API fetch responses received in that test,
       * updated throughout the test's execution. An assertion should use asynchronous polling to
       * ensure that the expected response was received at the time of assertion.
       *
       * @example
       * await expect
       *  .poll(() => page.fetchResponses?.length, { timeout: 2000 })
       *  .toEqual(1);
       */
      page.fetchResponses = [];
      const onResponse = async (response) => {
        const resourceType = response.request().resourceType();
        if (resourceType === 'fetch') {
          await response.finished();
          page.fetchResponses.push(response);
        }
      };
      page.addAPIResponseEventListener = () => page.on('response', onResponse);
      page.removeAPIResponseEventListener = () => {
        page.off('response', onResponse);
        page.fetchResponses = [];
      };
      page.assertResponses = async (expected = []) => {
        await expect
          .poll(() => page.fetchResponses.length, { timeout: 2000 })
          .toEqual(expected.length);

        await expect(
          page.fetchResponses.map((response) => [
            new URL(response.url()).pathname,
            response.status()
          ])
        ).toEqual(expected);
      };

      // Read the current text value stored in the clipboard
      page.readClipboard = async () =>
        await page.evaluate((projectName) => {
          if (projectName === 'Mobile Safari') return null;

          try {
            return window.navigator?.clipboard?.readText();
          } catch (error) {
            return null;
          }
        }, testInfo.project.name);

      // Resets the mouse cursor position to
      page.resetCursorPosition = async () => await page.mouse.move(0, 0);

      await use(page);
    },
    /**
     * storageState fixture override (optional)
     * - if options.isAuthenticated is set to false, this option is used to clear all cookies and origins data from the
     *   local storage in the current browser context's storageState (originally registered in the global setup script)
     */
    ...(!isAuthenticated && {
      storageState: async ({ storageState }, use) => {
        storageState = { cookies: [], origins: [] };
        await use(storageState);
      }
    }),
    ...pageModels.reduce(
      (pageFixtures, { name, PageModel }) => ({
        ...pageFixtures,
        [name]: async ({ page, baseURL }, use) => {
          // Set-up the API response event listener
          page.addAPIResponseEventListener();

          // Use page model fixture
          await use(await PageModel.create(page, baseURL));

          // Remove the API response event listener
          page.removeAPIResponseEventListener();
        }
      }),
      {}
    )
  });
};

const getMockCognitoSessionTokens = (
  username = 'testUser',
  email = 'testuser@ugc.com'
) => {
  const accessToken = new CognitoAccessToken({
    AccessToken: jwt.sign(
      {
        sub: uuidv4(),
        iss: `https://cognito-idp.us-west-2.amazonaws.com/${process.env.REACT_APP_COGNITO_USER_POOL_ID}`,
        client_id: process.env.REACT_APP_COGNITO_USER_POOL_CLIENT_ID,
        origin_jti: uuidv4(),
        event_id: uuidv4(),
        token_use: 'access',
        scope: 'aws.cognito.signin.user.admin',
        auth_time: 1656962384,
        exp: 7640000000000,
        iat: 1656962384,
        jti: uuidv4(),
        username
      },
      'mock-access-token-secret'
    )
  }).getJwtToken();

  const idToken = new CognitoIdToken({
    IdToken: jwt.sign(
      {
        sub: uuidv4(),
        email_verified: true,
        iss: `https://cognito-idp.us-west-2.amazonaws.com/${process.env.REACT_APP_COGNITO_USER_POOL_ID}`,
        'cognito:username': username,
        origin_jti: uuidv4(),
        aud: process.env.REACT_APP_COGNITO_USER_POOL_CLIENT_ID,
        event_id: uuidv4(),
        token_use: 'id',
        auth_time: 1656962384,
        exp: 7640000000000,
        iat: 1656962384,
        jti: uuidv4(),
        email
      },
      'mock-id-token-secret'
    )
  }).getJwtToken();

  const refreshToken = new CognitoRefreshToken({
    RefreshToken: jwt.sign(
      {
        token_use: 'refresh',
        exp: 8640000000000,
        iat: 1656962384
      },
      'mock-refresh-token-secret'
    )
  }).getToken();

  return { accessToken, idToken, refreshToken };
};

const getCloudfrontURLRegex = (endpoint) =>
  new RegExp(`^https://([A-Za-z0-9-]+).cloudfront.net${endpoint}$`);

const COGNITO_IDP_URL_REGEX = new RegExp(
  '^https://cognito-idp.([A-Za-z0-9-]+).amazonaws.com/$'
);

const isValidUrl = (url) => {
  try {
    new URL(url);
  } catch (e) {
    return false;
  }

  return true;
};

const noop = () => {};

module.exports = {
  COGNITO_IDP_URL_REGEX,
  extendTestFixtures,
  getCloudfrontURLRegex,
  getMockCognitoSessionTokens,
  isValidUrl,
  noop
};
