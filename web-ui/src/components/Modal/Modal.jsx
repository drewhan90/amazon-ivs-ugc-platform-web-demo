import { m } from 'framer-motion';
import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import './Modal.css';
import { app as $content } from '../../content';
import { BREAKPOINTS } from '../../constants';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { useModal } from '../../contexts/Modal';
import Button from '../Button';
import useClickAway from '../../hooks/useClickAway';
import useFocusTrap from '../../hooks/useFocusTrap';
import usePrevious from '../../hooks/usePrevious';
import withPortal from '../withPortal';

const Modal = () => {
  const modalRef = useRef();
  const lastFocusedElement = useRef();
  const { currentBreakpoint } = useMobileBreakpoint();
  const isResponsiveView = currentBreakpoint < BREAKPOINTS.sm;
  const { modal, closeModal } = useModal();
  const {
    cancellable = true,
    confirmText,
    isDestructive,
    message,
    onConfirm,
    onCancel,
    subMessage
  } = modal || {};
  const { pathname } = useLocation();
  const prevPathname = usePrevious(pathname);

  const handleClose = useCallback(
    (event) => {
      if (event && event instanceof KeyboardEvent && event.keyCode !== 27)
        return;

      closeModal();
      setTimeout(() => lastFocusedElement.current?.focus());

      if (typeof onCancel === 'function') {
        onCancel();
      }
    },
    [closeModal, onCancel]
  );

  const handleConfirm = () => {
    handleClose();

    if (typeof onConfirm === 'function') {
      onConfirm();
    }
  };

  useClickAway([modalRef], handleClose, cancellable);
  useFocusTrap([modalRef], !!modal);

  useEffect(() => {
    if (!!modal) {
      document.addEventListener('keydown', handleClose);
      lastFocusedElement.current = document.activeElement;
      lastFocusedElement.current.blur();
    }

    return () => document.removeEventListener('keydown', handleClose);
  }, [handleClose, modal]);

  // Close the modal on page change
  useEffect(() => {
    if (prevPathname && prevPathname !== pathname) closeModal();
  }, [closeModal, pathname, prevPathname]);

  return (
    modal && (
      <m.div
        className="modal"
        ref={modalRef}
        animate="visible"
        exit="hidden"
        initial="hidden"
        variants={{
          hidden: { opacity: 0, y: -50 },
          visible: { opacity: 1, y: 0 }
        }}
      >
        <h3>{message}</h3>
        {subMessage && <p className="p1">{subMessage}</p>}
        <div className="modal-buttons">
          {cancellable && (
            <Button
              customStyles={{ width: isResponsiveView ? '100%' : 'auto' }}
              onClick={handleClose}
              variant="secondaryText"
            >
              {$content.modal.cancel}
            </Button>
          )}
          <Button
            customStyles={{ width: isResponsiveView ? '100%' : 'auto' }}
            onClick={handleConfirm}
            variant={isDestructive ? 'destructive' : 'primary'}
          >
            {confirmText}
          </Button>
        </div>
      </m.div>
    )
  );
};

export default withPortal(Modal, 'modal');
