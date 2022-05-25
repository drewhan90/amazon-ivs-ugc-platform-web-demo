import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';

import { dashboard as $dashboardContent } from '../../../../../content';
import { SyncError } from '../../../../../assets/icons';
import Spinner from '../../../../../components/Spinner';
import './Metrics.css';

const $content = $dashboardContent.stream_session_page;

const MetricPanel = ({
  children,
  footer,
  footerClassNames,
  header,
  headerClassNames,
  title,
  wrapper
}) => {
  const { activeStreamSessionError, isInitialLoadingActiveStreamSession } =
    useOutletContext();
  const Wrapper = useMemo(() => wrapper.tag || 'div', [wrapper.tag]);

  const headerClasses = ['metrics-panel-header'];
  headerClasses.push(...headerClassNames);
  const footerClasses = ['metrics-panel-footer'];
  footerClasses.push(...footerClassNames);

  const renderBody = () => {
    if (isInitialLoadingActiveStreamSession)
      return (
        <div className="metrics-spinner-container">
          <Spinner size="medium" variant="semi-dark" />
        </div>
      );

    if (activeStreamSessionError)
      return (
        <div className="metrics-error-container">
          <SyncError />
          <p className="p3">{$content.failed_to_load}</p>
        </div>
      );

    return children;
  };

  return (
    <div className="metrics-panel">
      {(title || header) && (
        <div className={headerClasses.join(' ')}>
          {title && <h3>{title}</h3>}
          {header}
        </div>
      )}
      <Wrapper
        {...(wrapper.classNames
          ? { className: wrapper.classNames.join(' ') }
          : {})}
      >
        {renderBody()}
      </Wrapper>
      {footer && <div className={footerClasses.join(' ')}>{footer}</div>}
    </div>
  );
};

MetricPanel.defaultProps = {
  children: null,
  footer: null,
  footerClassNames: [],
  header: null,
  headerClassNames: [],
  title: '',
  wrapper: { tag: 'div', classNames: [] }
};

MetricPanel.propTypes = {
  children: PropTypes.node,
  footer: PropTypes.node,
  footerClassNames: PropTypes.arrayOf(PropTypes.string),
  header: PropTypes.node,
  headerClassNames: PropTypes.arrayOf(PropTypes.string),
  title: PropTypes.string,
  wrapper: PropTypes.shape({
    tag: PropTypes.string,
    classNames: PropTypes.array
  })
};

export default MetricPanel;