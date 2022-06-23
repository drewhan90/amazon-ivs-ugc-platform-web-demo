import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import { localPoint } from '@visx/event';
import PropTypes from 'prop-types';

import useThrottledCallback from '../hooks/useThrottledCallback';
import useContextHook from './useContextHook';

const Context = createContext(null);
Context.displayName = 'SynchronizedCharts';

export const ZOOM_LEVELS = {
  NONE: 0,
  ALL: -1,
  ONE_HOUR: 3600,
  THIRTY_MIN: 1800,
  FIVE_MIN: 300
};

export const Provider = ({ children }) => {
  const [zoomBounds, setZoomBounds] = useState([0, 0]); // [lowerBound, upperBound]
  const [selectedZoomLevel, setSelectedZoomLevel] = useState(ZOOM_LEVELS.NONE);

  /**
   * SYNCHRONIZED TOOLTIPS
   */
  const [xValue, setXValue] = useState(null);
  const isTooltipOpen = useMemo(() => xValue !== undefined, [xValue]);
  const mouseXCoord = useRef();
  const isMouseOver = useRef(false);

  const showSynchronizedTooltips = useCallback(() => {
    isMouseOver.current = true;
  }, []);

  const hideSynchronizedTooltips = useCallback(() => {
    isMouseOver.current = false;
    setXValue(undefined);
  }, []);

  const handleSynchronizedTooltips = useThrottledCallback((event) => {
    if (!isMouseOver.current) return;

    const { x } = localPoint(event) || { x: mouseXCoord?.current || 0 };

    setXValue(x);
    mouseXCoord.current = x;
  }, 100);

  /**
   * SYNCHRONIZED AREA ZOOM
   */
  const [originX, setOriginX] = useState(null);
  const [zoomAreaDx, setZoomAreaDx] = useState(0);

  const onPointerDown = useCallback(({ clientX }, draggableChartRef) => {
    if (!draggableChartRef.current) return;

    const { left } = draggableChartRef.current.getBoundingClientRect();

    setOriginX(clientX - left);
  }, []);

  const onPointerUp = useCallback(
    (_event, draggableChartRef) => {
      setOriginX(null);
      setZoomAreaDx(0);

      if (originX && zoomAreaDx) {
        const width = draggableChartRef.current.clientWidth;
        const [lowerBoundPx, upperBoundPx] = [
          originX,
          originX + zoomAreaDx
        ].sort();

        setZoomBounds(([prevLowerBound, prevUpperBound]) => {
          const visibleDataLength = prevUpperBound - prevLowerBound;
          const lowerBound = (lowerBoundPx / width) * (visibleDataLength - 1);
          const upperBound = (upperBoundPx / width) * (visibleDataLength - 1);

          setSelectedZoomLevel(ZOOM_LEVELS.NONE);

          return [lowerBound, upperBound];
        });
      }
    },
    [originX, zoomAreaDx]
  );

  const onPointerMove = useThrottledCallback(
    ({ clientX }, draggableChartRef) => {
      if (!draggableChartRef.current || originX === null) return;

      const { left } = draggableChartRef.current.getBoundingClientRect();
      const dx = clientX - left - originX; // dx > 0 => RIGHT, dx < 0 => LEFT

      setZoomAreaDx(dx);
    },
    10,
    []
  );

  const value = useMemo(
    () => ({
      zoomBounds,
      setZoomBounds,
      selectedZoomLevel,
      setSelectedZoomLevel,
      handleSynchronizedTooltips,
      hideSynchronizedTooltips,
      isTooltipOpen,
      showSynchronizedTooltips,
      xValue,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      originX,
      zoomAreaDx
    }),
    [
      zoomBounds,
      setZoomBounds,
      selectedZoomLevel,
      setSelectedZoomLevel,
      handleSynchronizedTooltips,
      hideSynchronizedTooltips,
      isTooltipOpen,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      originX,
      showSynchronizedTooltips,
      xValue,
      zoomAreaDx
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useSynchronizedCharts = () => useContextHook(Context);
