import PropTypes from 'prop-types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AreaClosed, Line, Bar } from '@visx/shape';
import { LinearGradient } from '@visx/gradient';
import { max, bisector, extent } from 'd3-array';
import { getDate, getDataValue, getXScale, getYScale } from '../utils';
import { scaleLinear } from '@visx/scale';
import { useTooltip, Tooltip } from '@visx/tooltip';

import { useSynchronizedChartTooltip } from '../../../../../../../contexts/SynchronizedChartTooltip';
import { useMobileBreakpoint } from '../../../../../../../contexts/MobileBreakpoint';
import useStateWithCallback from '../../../../../../../hooks/useStateWithCallback';
import './Chart.css';

const bisectDate = bisector(getDate).left;

const Chart = ({ data, formatter, height, maximum, width }) => {
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
    showSynchronizedTooltips,
    xValue: x
  } = useSynchronizedChartTooltip();
  const { isMobileView } = useMobileBreakpoint();
  const tooltipRef = useRef();
  const xScale = useMemo(() => getXScale(width, data), [width, data]);
  const yScale = useMemo(
    () => getYScale(height, maximum || max(data, getDataValue)),
    [data, height, maximum]
  );
  const [hasTooltipRendered, setHasTooltipRendered] =
    useStateWithCallback(false);
  const [isTooltipReady, setIsTooltipReady] = useState(false);

  useEffect(() => {
    setHasTooltipRendered(tooltipOpen);
  }, [setHasTooltipRendered, tooltipOpen]);

  // tooltip handler
  useEffect(() => {
    if (x === null) {
      setHasTooltipRendered(false, hideTooltip);
      return;
    }

    const dateToPixels = scaleLinear({
      range: [0, width],
      domain: extent(data, getDate),
      nice: false
    });
    const x0 = xScale.invert(x);
    const index = bisectDate(data, x0, 1);
    const d0 = data[index - 1];
    const d1 = data[index];
    if (!d0 || !d1) {
      setHasTooltipRendered(false, hideTooltip);
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
    data,
    formatter,
    hideTooltip,
    setHasTooltipRendered,
    showTooltip,
    width,
    x,
    xScale,
    yScale
  ]);

  useEffect(() => {
    if (isMobileView) {
      if (hasTooltipRendered) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = null;
      }
    }
  }, [isMobileView, hasTooltipRendered]);

  useEffect(() => {
    setIsTooltipReady(hasTooltipRendered);
  }, [hasTooltipRendered]);

  if (width < 10) return null;

  return (
    <div className="chart-container">
      <svg className="chart-element" width={width} height={height}>
        <LinearGradient
          id="area-gradient"
          from="var(--palette-color-chart-gradient-start)"
          to="var(--palette-color-chart-gradient-end)"
          fromOpacity={1}
          toOpacity={0}
        />
        <AreaClosed
          data={data}
          x={(d) => xScale(getDate(d)) ?? 0}
          y={(d) => yScale(getDataValue(d)) ?? 0}
          yScale={yScale}
          strokeWidth={2}
          stroke="var(--palette-color-blue)"
          fill="url(#area-gradient)"
        />
        <Bar
          x={0}
          y={0}
          width={width}
          height={height}
          fill="transparent"
          rx={14}
          onTouchStart={handleSynchronizedTooltips}
          onTouchMove={handleSynchronizedTooltips}
          onTouchEnd={hideSynchronizedTooltips}
          onMouseEnter={showSynchronizedTooltips}
          onMouseMove={handleSynchronizedTooltips}
          onMouseLeave={hideSynchronizedTooltips}
        />
        {hasTooltipRendered && (
          <g>
            <Line
              from={{ x: tooltipLeft, y: 0 }}
              to={{ x: tooltipLeft, y: height }}
              stroke="var(--palette-color-white)"
              strokeWidth={2}
              pointerEvents="none"
              strokeDasharray="2,5"
              strokeLinecap="round"
            />
            <circle
              cx={tooltipLeft}
              cy={tooltipTop + 1}
              r={4}
              fill="black"
              fillOpacity={0.1}
              stroke="black"
              strokeOpacity={0.1}
              strokeWidth={2}
              pointerEvents="none"
            />
            <circle
              cx={tooltipLeft}
              cy={tooltipTop}
              r={4}
              fill="var(--palette-color-white)"
              stroke="white"
              strokeWidth={2}
              pointerEvents="none"
            />
          </g>
        )}
      </svg>
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
  data: PropTypes.arrayOf(PropTypes.object),
  formatter: PropTypes.func,
  maximum: PropTypes.number,
  height: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired
};

Chart.defaultProps = {
  data: [],
  formatter: (data) => data,
  maximum: null
};

export default Chart;
