import PropTypes from 'prop-types';
import clsx from 'clsx';
import { app as $content } from '../../content';
import { Visibility, VisibilityOff } from '../../assets/icons';

const PasswordPeekButton = ({ label, inputType, setInputType, isVisible }) => {
  if (!isVisible) return;

  const isPasswordHidden = inputType === 'password';
  const buttonClasses = clsx([
    'absolute',
    'bg-none',
    'cursor-pointer',
    'dark:focus:shadow-white',
    'flex',
    'focus:outline-none',
    'focus:p-1',
    'focus:right-4',
    'focus:rounded-3xl',
    'focus:shadow-focus',
    'focus:shadow-lightMode-gray-dark',
    'focus:top-2',
    'items-center',
    'justify-center',
    'px-0',
    'py-3',
    'right-5',
    'top-0'
  ]);
  const visibilityIconClasses = clsx([
    'dark:fill-white',
    'fill-lightMode-gray-dark'
  ]);

  const passwordPeek = (event) => {
    event.preventDefault();
    setInputType((prev) => (prev === 'password' ? 'text' : 'password'));
  };
  return (
    <button
      aria-label={`${
        isPasswordHidden ? $content.show : $content.hide
      } ${label.toLowerCase()}`}
      className={buttonClasses}
      onClick={passwordPeek}
      type="button"
    >
      {isPasswordHidden ? (
        <Visibility className={visibilityIconClasses} />
      ) : (
        <VisibilityOff className={visibilityIconClasses} />
      )}
    </button>
  );
};

PasswordPeekButton.defaultProps = {
  label: '',
  inputType: 'password',
  setInputType: () => {},
  isVisible: false
};

PasswordPeekButton.propTypes = {
  label: PropTypes.string,
  inputType: PropTypes.oneOf(['text', 'password', 'button']),
  setInputType: PropTypes.func,
  isVisible: PropTypes.bool
};

export default PasswordPeekButton;