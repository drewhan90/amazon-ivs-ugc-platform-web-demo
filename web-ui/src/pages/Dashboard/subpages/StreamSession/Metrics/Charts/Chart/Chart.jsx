import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { AreaClosed, Line, Bar } from '@visx/shape';
import { LinearGradient } from '@visx/gradient';
import { max, bisector, extent } from 'd3-array';
import { scaleLinear } from '@visx/scale';
import { useOutletContext } from 'react-router-dom';
import { useTooltip, Tooltip } from '@visx/tooltip';
import PropTypes from 'prop-types';

import { getDate, getDataValue, getXScale, getYScale } from '../utils';
import { useMobileBreakpoint } from '../../../../../../../contexts/MobileBreakpoint';
import { useSynchronizedCharts } from '../../../../../../../contexts/SynchronizedCharts';
import usePrevious from '../../../../../../../hooks/usePrevious';
import './Chart.css';

const bisectDate = bisector(getDate).left;

const Chart = ({
  eventMarkers,
  formatter,
  height,
  initialData,
  width,
  zoomBounds
}) => {
  const { activeStreamSession, hasActiveStreamChanged } = useOutletContext();
  const { isLive } = activeStreamSession || {};
  const hasLiveIndicator = isLive && zoomBounds[1] === initialData.length - 1;
  const {
    hideTooltip,
    showTooltip,
    tooltipData,
    tooltipLeft = 0,
    tooltipOpen,
    tooltipTop = 0
  } = useTooltip();
  const {
    handleSynchronizedTooltips,
    hideSynchronizedTooltips,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    originX,
    showSynchronizedTooltips,
    xValue: x,
    zoomAreaDx
  } = useSynchronizedCharts();
  const tooltipRef = useRef();
  const [hasTooltipRendered, setHasTooltipRendered] = useState(false);
  const [isTooltipReady, setIsTooltipReady] = useState(false);
  const [transformedData, setTransformedData] = useState(initialData);
  const prevZoomBounds = usePrevious(
    // Reset the zoom bounds when we change the active stream
    hasActiveStreamChanged ? undefined : zoomBounds
  );
  const xScale = useMemo(
    () => getXScale(width, transformedData),
    [width, transformedData]
  );
  const yScale = useMemo(
    () => getYScale(height, max(transformedData, getDataValue)),
    [transformedData, height]
  );
  const lastPoint = transformedData[transformedData.length - 1];
  const lastPointCoords = {
    x: xScale(getDate(lastPoint)) - 6,
    y: yScale(getDataValue(lastPoint)) - 5
  };
  const { isDefaultResponsiveView } = useMobileBreakpoint();
  const draggableChartRef = useRef();

  // Update the transformed data when the zoom bounds have been updated
  useEffect(() => {
    const [lowerBound, upperBound] = zoomBounds;
    const [prevLowerBound, prevUpperBound] = prevZoomBounds || [];

    if (prevLowerBound !== lowerBound || prevUpperBound !== upperBound) {
      setTransformedData(initialData.slice(lowerBound, upperBound + 1));
    }
  }, [initialData, prevZoomBounds, zoomBounds]);

  /**
   * Tooltip logic START
   */

  const clearTooltip = useCallback(() => {
    setIsTooltipReady(false);
    setHasTooltipRendered(false);
    hideTooltip();
  }, [hideTooltip]);

  // This is triggered when the value of x changes, on hover
  useEffect(() => {
    if (typeof x !== 'number') {
      clearTooltip();

      return;
    }

    const dateToPixels = scaleLinear({
      range: [0, width],
      domain: extent(transformedData, getDate),
      nice: false
    });
    const x0 = xScale.invert(x);
    const index = bisectDate(transformedData, x0, 1);
    const d0 = transformedData[index - 1];
    const d1 = transformedData[index];
    if (!d0 || !d1) {
      clearTooltip();

      return;
    }

    const { timestamp: t0, value: v0 } = d0;
    const { timestamp: t1, value: v1 } = d1;

    const t0px = dateToPixels(t0);
    const t1px = dateToPixels(t1);
    const v0px = yScale(v0);
    const v1px = yScale(v1);

    const slope = (v1px - v0px) / (t1px - t0px);
    const yInt = v0px - slope * t0px;
    const y = slope * x + yInt;

    let d = d0;
    if (d1 && getDate(d1)) {
      d =
        x0.valueOf() - getDate(d0).valueOf() >
        getDate(d1).valueOf() - x0.valueOf()
          ? d1
          : d0;
    }

    showTooltip({
      tooltipData: formatter({ timestamp: x0, value: d.value }),
      tooltipLeft: x,
      tooltipTop: y
    });
  }, [
    clearTooltip,
    formatter,
    showTooltip,
    transformedData,
    width,
    x,
    xScale,
    yScale
  ]);

  // When the tooltip should be open, render it but keep it hidden.
  // We first need to get it's width and height to position it correctly.
  useEffect(() => {
    setHasTooltipRendered(tooltipOpen);
  }, [tooltipOpen]);

  // Once the tooltip has been rendered and positioned, it is ready to become visible
  useEffect(() => {
    setIsTooltipReady(hasTooltipRendered);
  }, [hasTooltipRendered]);

  // Prevent scrolling when the tooltip is open on mobile
  useEffect(() => {
    if (isDefaultResponsiveView) {
      if (hasTooltipRendered) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = null;
      }
    }
  }, [isDefaultResponsiveView, hasTooltipRendered]);

  /**
   * Tooltip logic END
   */

  useEffect(() => {
    const augmentedOnPointerUp = (_event) =>
      onPointerUp(_event, draggableChartRef);
    document.addEventListener('pointerup', augmentedOnPointerUp);

    return () =>
      document.removeEventListener('pointerup', augmentedOnPointerUp);
  }, [onPointerUp]);

  if (width < 10) return null;

  return (
    <div
      aria-label="Click and drag an area to zoom in"
      className="chart-container"
      ref={draggableChartRef}
    >
      <svg width="100%" height={height}>
        <LinearGradient
          id="area-gradient"
          from="var(--palette-color-chart-blue-gradient-start)"
          to="var(--palette-color-chart-blue-gradient-end)"
          fromOpacity={1}
          toOpacity={0}
        />
        <AreaClosed
          data={transformedData}
          x={(d) => xScale(getDate(d)) ?? 0}
          y={(d) => yScale(getDataValue(d)) ?? 0}
          yScale={yScale}
          strokeWidth={1}
          stroke="var(--palette-color-blue)"
          fill="url(#area-gradient)"
          clipPath="inset(0 1px 1px 1px)"
        />
        {eventMarkers.map(
          ({ timestamp, type, startTimestamp, endTimestamp }) => {
            let key = `error-event-line-${timestamp}`;

            if (type === 'line') {
              const xPosLine = xScale(timestamp);

              // Don't render if the line is outside of the visible window
              if (xPosLine > 0 && xPosLine < width) {
                return (
                  <Line
                    className="error-event-line"
                    key={key}
                    from={{ x: xPosLine, y: 0 }}
                    to={{ x: xPosLine, y: height }}
                  />
                );
              }
            } else if (type === 'gradient') {
              key = `starvation-gradient-${startTimestamp}${endTimestamp}`;
              const gradientXPos = xScale(startTimestamp) || 0;
              const gradientWidth =
                (xScale(endTimestamp) || width) - gradientXPos;

              // Don't render if no part of the gradient is in the visible window
              if (gradientXPos + gradientWidth > 0 && gradientXPos < width) {
                return (
                  <Fragment key={key}>
                    <LinearGradient
                      id={key}
                      from="var(--palette-color-chart-red-gradient-start)"
                      to="var(--palette-color-chart-red-gradient-end)"
                    />
                    <Bar
                      fill={`url(#${key})`}
                      width={gradientWidth}
                      height={height}
                      x={gradientXPos}
                      y={0}
                    />
                  </Fragment>
                );
              }
            }

            return null;
          }
        )}
        <Bar
          x={0}
          y={0}
          width={width}
          height={height}
          fill="transparent"
          rx={14}
          onTouchStart={handleSynchronizedTooltips}
          onTouchMove={(e) => {
            handleSynchronizedTooltips(e);
            onPointerMove(e, draggableChartRef);
          }}
          onTouchEnd={hideSynchronizedTooltips}
          onMouseEnter={showSynchronizedTooltips}
          onMouseMove={(e) => {
            handleSynchronizedTooltips(e);
            onPointerMove(e, draggableChartRef);
          }}
          onMouseLeave={hideSynchronizedTooltips}
          onPointerDown={(e) => onPointerDown(e, draggableChartRef)}
          onPointerUp={(e) => onPointerUp(e, draggableChartRef)}
        />
        {hasTooltipRendered && (
          <g>
            <Line
              className="tooltip-line"
              from={{ x: tooltipLeft, y: 0 }}
              to={{ x: tooltipLeft, y: height }}
            />
            <circle
              className="tooltip-circle"
              cx={tooltipLeft}
              cy={tooltipTop}
              r={4}
            />
          </g>
        )}
      </svg>
      {hasLiveIndicator && (
        <div
          className="live-indicator"
          style={
            Number.isFinite(lastPointCoords.x) &&
            Number.isFinite(lastPointCoords.y)
              ? {
                  display: 'block',
                  transform: `translate(${lastPointCoords.x}px, ${lastPointCoords.y}px)`
                }
              : {}
          }
        />
      )}
      <div
        className="zoom-area"
        style={{
          left: zoomAreaDx > 0 ? originX : originX + zoomAreaDx,
          width: Math.abs(zoomAreaDx)
        }}
      />
      <Tooltip
        className={`chart-tooltip ${
          hasTooltipRendered && isTooltipReady ? '' : 'hidden'
        }`}
        left={0}
        top={0}
        style={{
          transform: `translate(${Math.max(
            -10,
            tooltipLeft - tooltipRef.current?.clientWidth - 20 || 0
          )}px, ${tooltipTop - tooltipRef.current?.clientHeight - 20 || 0}px)`,
          transition: isTooltipReady ? 'transform 100ms linear' : undefined
        }}
      >
        <div ref={tooltipRef}>
          <h4>{tooltipData && getDataValue(tooltipData)}</h4>
          <p className="p3">{tooltipData && getDate(tooltipData)}</p>
        </div>
      </Tooltip>
    </div>
  );
};

Chart.propTypes = {
  eventMarkers: PropTypes.arrayOf(
    PropTypes.shape({
      timestamp: PropTypes.number,
      startTimestamp: PropTypes.number,
      endTimestamp: PropTypes.number,
      type: PropTypes.oneOf(['line', 'gradient']).isRequired
    })
  ),
  formatter: PropTypes.func,
  height: PropTypes.number.isRequired,
  initialData: PropTypes.arrayOf(PropTypes.object),
  width: PropTypes.number.isRequired,
  zoomBounds: PropTypes.arrayOf(PropTypes.number).isRequired
};

Chart.defaultProps = {
  eventMarkers: [],
  initialData: [],
  formatter: (data) => data
};

export default Chart;
