import { useLocation, useNavigate } from 'react-router-dom';

import { dashboard as $content } from '../../../content';
import { Settings } from '../../../assets/icons';
import { useMobileBreakpoint } from '../../../contexts/MobileBreakpoint';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';
import SessionNavigator from './SessionNavigator';
import './Header.css';

const Header = () => {
  const { logOut } = useUser();
  const { pathname } = useLocation();
  const { isMobileView } = useMobileBreakpoint();
  const navigate = useNavigate();

  const handleSettings = () => {
    navigate(pathname === '/settings' ? -1 : '/settings');
  };

  return (
    <header className="header">
      <SessionNavigator />
      {!isMobileView && (
        <div className="header-buttons">
          <Button
            className="settings-button"
            onClick={handleSettings}
            variant="secondary"
          >
            <Settings className="icon settings" />
          </Button>
          <Button onClick={logOut} variant="secondary">
            {$content.header.log_out}
          </Button>
        </div>
      )}
    </header>
  );
};

export default Header;
