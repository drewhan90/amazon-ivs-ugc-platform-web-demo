import PropTypes from 'prop-types';

const Sensors = ({ isLive }) => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className={`sensors-origin${isLive ? ' is-live' : ''}`}>
      <path d="M18 22.1016C20.4853 22.1016 22.5 20.0868 22.5 17.6016C22.5 15.1163 20.4853 13.1016 18 13.1016C15.5147 13.1016 13.5 15.1163 13.5 17.6016C13.5 20.0868 15.5147 22.1016 18 22.1016Z" />
    </g>
    <g className={`sensors-first-waves${isLive ? ' is-live' : ''}`}>
      <path d="M11.8502 23.7513L11.9852 23.6163C12.3902 23.2113 12.4652 22.5513 12.1052 22.1013C11.0402 20.7363 10.5002 19.1163 10.5002 17.6013C10.5002 15.9813 11.0252 14.3613 12.0602 13.0863C12.4352 12.6363 12.3752 11.9613 11.9552 11.5563L11.8502 11.4513C11.3402 10.9413 10.5002 11.0013 10.0502 11.5713C8.68519 13.3413 7.9502 15.4713 7.9502 17.6013C7.9502 19.7313 8.68519 21.8613 10.0502 23.6313C10.5002 24.2013 11.3402 24.2613 11.8502 23.7513Z" />
      <path d="M24.1052 23.7068C24.6452 24.2468 25.5302 24.1868 25.9952 23.5718C27.3452 21.8018 28.0502 19.7018 28.0502 17.6018C27.9302 15.4868 27.2852 13.3568 25.9502 11.5868C25.5152 11.0018 24.6602 10.9418 24.1502 11.4518L24.0302 11.5718C23.6252 11.9768 23.5502 12.6368 23.9102 13.0868C24.9602 14.4668 25.5002 16.0868 25.5002 17.6018C25.5002 19.2068 24.9902 20.7968 23.9852 22.0718C23.5952 22.5518 23.6552 23.2568 24.1052 23.7068Z" />
    </g>
    <g className={`sensors-second-waves${isLive ? ' is-live' : ''}`}>
      <path d="M8.355 7.95664L8.235 7.83664C7.74 7.34164 6.915 7.40164 6.465 7.95664C4.185 10.7766 3 14.1216 3 17.6016C3 21.0816 4.185 24.4266 6.465 27.2466C6.915 27.8016 7.74 27.8766 8.235 27.3666L8.355 27.2466C8.805 26.7966 8.79 26.1066 8.4 25.6266C6.495 23.3166 5.55 20.4066 5.55 17.6016C5.55 14.7966 6.495 11.8866 8.4 9.57664C8.79 9.09664 8.805 8.40664 8.355 7.95664Z" />
      <path d="M27.7652 7.83664L27.6452 7.95664C27.1952 8.40664 27.2102 9.09664 27.6002 9.57664C29.4902 11.8716 30.4502 14.7966 30.4502 17.6016C30.4502 20.4066 29.5052 23.3166 27.6002 25.6266C27.1802 26.1216 27.2552 26.8716 27.7202 27.3366C28.2452 27.8616 29.1152 27.8016 29.5802 27.2316C31.9352 24.4116 33.0002 21.0666 33.0002 17.6016C33.0002 14.1216 31.8152 10.7766 29.5352 7.95664C29.0852 7.40164 28.2602 7.34164 27.7652 7.83664Z" />
    </g>
  </svg>
);

Sensors.propTypes = {
  isLive: PropTypes.bool
};

Sensors.defaultProps = {
  isLive: false
};

export default Sensors;
