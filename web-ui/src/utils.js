import clsx from 'clsx';
import { extendTailwindMerge, fromTheme } from 'tailwind-merge';
import { CHANNEL_TYPE } from './constants';

export const isiOS = () =>
  [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform) ||
  (navigator.userAgent.includes('Mac') && 'ontouchend' in document);

export const copyToClipboard = (value) => {
  if (isiOS()) {
    const textArea = document.createElement('textArea');
    textArea.value = value;
    textArea.readOnly = true;
    document.body.appendChild(textArea);

    const range = document.createRange();
    range.selectNodeContents(textArea);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    textArea.setSelectionRange(0, 999999);

    document.execCommand('copy');
    document.body.removeChild(textArea);
  } else {
    navigator.clipboard.writeText(value);
  }
};

export const scrollToTop = (
  selector = '[id$=scrollable]',
  behavior = 'smooth'
) => {
  const scrollableContainer = document.querySelector(selector) || window;

  scrollableContainer.scrollTo({ top: 0, behavior });
};

export const bound = (value, min = null, max = null) => {
  let boundedValue = value;

  if (min !== null) boundedValue = Math.max(min, value);
  if (max !== null) boundedValue = Math.min(max, boundedValue);

  return boundedValue;
};

/**
 * Executes a callback function predictably, after a certain delay.
 * Throttling a function prevents excessive or repeated calling of the function,
 * but does not get reset in the process
 *  - i.e. acts as a rate limiter for execution of handlers
 * @param {func} callback function to throttle
 * @param {number} delay milliseconds to throttle invocations to
 * @param {boolean} debounceMode set to true to enable debounce instead of throttle
 */
export const throttle = (callback, delay, debounceMode) => {
  let timeoutID;
  let cancelled = false;
  let lastExec = 0;
  const clearExistingTimeout = () => {
    if (timeoutID) {
      clearTimeout(timeoutID);
    }
  };

  const wrapper = (...args) => {
    const elapsed = Date.now() - lastExec;
    const exec = () => {
      lastExec = Date.now();
      callback(...args);
    };

    if (cancelled) {
      return;
    }
    if (debounceMode && !timeoutID) {
      exec();
    }
    clearExistingTimeout();
    if (debounceMode === undefined && elapsed > delay) {
      exec();
    } else {
      const clearTimeoutID = () => {
        timeoutID = undefined;
      };
      timeoutID = setTimeout(
        debounceMode ? clearTimeoutID : exec,
        debounceMode === undefined ? delay - elapsed : delay
      );
    }
  };

  wrapper.cancel = () => {
    clearExistingTimeout();
    cancelled = true;
  };
  return wrapper;
};

/**
 * Stalls the execution of a callback function for a predetermined
 * amount of time, so long as it continues to be invoked
 * @param {func} callback function to debounce
 * @param {number} delay stall delay
 * @param {boolean} atBegin true if callback is to be executed before stalling
 *                    initiates, false if after stalling period ends
 */
export const debounce = (callback, delay, atBegin = false) => {
  return throttle(callback, delay, atBegin);
};

const BASIC_BITRATE_LIMIT = 1.5; // Mbps
const STANDARD_BITRATE_LIMIT = 8.5; // Mbps
const BASIC_RESOLUTION_LIMIT = '480p (852 x 480)';
const STANDARD_RESOLUTION_LIMIT = '1080p (1920 x 1080)';

const BITRATE_LIMIT_SUB_KEY = '{BITRATE_LIMIT}';
const RESOLUTION_LIMIT_SUB_KEY = '{RESOLUTION_LIMIT}';
const BITRATE_SUB_KEY = '{bitrate}';
const RESOLUTION_SUB_KEY = '{resolution}';

export const substitutePlaceholders = (str = '', activeStreamSession) => {
  if (!activeStreamSession || !str) return str;

  const { channel, ingestConfiguration } = activeStreamSession;
  const { targetBitrate, videoHeight, videoWidth } =
    ingestConfiguration?.video || {};
  const { type: channelType } = channel || {};

  // Bitrate substitutions
  const targetBitrateMbps = targetBitrate * Math.pow(10, -6) || 0;
  str = str.replaceAll(BITRATE_SUB_KEY, targetBitrateMbps.toLocaleString());

  str = str.replaceAll(
    BITRATE_LIMIT_SUB_KEY,
    channelType === CHANNEL_TYPE.STANDARD
      ? STANDARD_BITRATE_LIMIT.toLocaleString()
      : BASIC_BITRATE_LIMIT.toLocaleString()
  );

  // Resolution substitutions
  str = str.replaceAll(
    RESOLUTION_LIMIT_SUB_KEY,
    channelType === CHANNEL_TYPE.STANDARD
      ? STANDARD_RESOLUTION_LIMIT.toLocaleString()
      : BASIC_RESOLUTION_LIMIT.toLocaleString()
  );

  str = str.replaceAll(
    RESOLUTION_SUB_KEY,
    videoWidth && videoHeight ? `${videoWidth} x ${videoHeight}` : ''
  );

  return str;
};

/**
 * Construct a className string using a list of classes and then merge classes without style conflicts. The last conflicting class will win.
 * This utility function will replace clsx or txMerge everywhere in the application.
 * extendTailwindMerge is a function provided by tailwind-merge that will extend the tailwind config.
 * A combination of the clsx (https://github.com/lukeed/clsx#readme)
 * and tailwind-merge (https://github.com/dcastil/tailwind-merge) packages.
 * @param {Array|String|Object|Boolean} classes
 */
const customTwMerge = extendTailwindMerge({
  classGroups: {
    shadow: [
      {
        shadow: [
          fromTheme('shadow'),
          'focus',
          'focusOuter',
          'hover',
          'hoverOuter'
        ],
        'shadow-color': [
          {
            shadow: [
              (value) => {
                const colorModeRegex = /(darkMode|lightMode)/i;
                colorModeRegex.test(value);
                return value;
              }
            ]
          }
        ]
      }
    ]
  }
});

export const clsm = (...classes) => {
  if (!classes) return;

  return customTwMerge(clsx(classes));
};
