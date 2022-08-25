import PropTyps from 'prop-types';

import { app as $appContent } from '../../../content';
import { clsm } from '../../../utils';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';

const $content = $appContent.navbar;

const MobileNavbar = ({ className }) => {
  const { isSessionValid } = useUser();

  return (
    !isSessionValid && (
      <nav
        className={clsm(
          [
            'fixed',
            'flex',
            'items-center',
            'justify-between',
            'bottom-0',
            'left-1/2',
            'w-full',
            'z-[100]',
            'py-5',
            'px-4',
            'max-w-[calc(440px_+_32px)]',
            'min-w-[calc(228px_+_32px)]',
            '-translate-x-1/2'
          ],
          className
        )}
      >
        <div
          className={clsm([
            'flex',
            'flex-row',
            'gap-4',
            'px-4',
            'py-3.5',
            'w-full',
            'bg-lightMode-gray-extraLight',
            'dark:bg-darkMode-gray-medium',
            'rounded-[40px]',
            'min-w-[244px]',
            '[&>a]:flex-1',
            '[&>a]:w-full'
          ])}
        >
          <Button
            type="nav"
            variant="secondary"
            to="/login"
            saveLocationFromState
          >
            {$content.log_in}
          </Button>
          <Button
            type="nav"
            variant="primary"
            to="/register"
            saveLocationFromState
          >
            {$content.sign_up}
          </Button>
        </div>
      </nav>
    )
  );
};

MobileNavbar.defaultProps = { className: '' };

MobileNavbar.propTypes = { className: PropTyps.string };

export default MobileNavbar;
