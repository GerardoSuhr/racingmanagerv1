import React from 'react';

export default function CircuitSVG({ pathData, bounds, startLine, carPosition, sectorStartPoints, carPoints }) {
  const viewWidth = 1000;
  const viewHeight = 600;
  const padding = 150;

  if (!pathData || !bounds) return null;

  const contentWidth = bounds.width;
  const contentHeight = bounds.height;

  const scale = Math.min(
    (viewWidth - 2 * padding) / contentWidth,
    (viewHeight - 2 * padding) / contentHeight
  );

  // Dibuja una línea perpendicular en (x, y)
  const drawMarkerLine = (x, y, angleDeg, length = 20, stroke = "black", width = 4) => {
    const rad = (angleDeg * Math.PI) / 180;
    const dx = (length / 2) * Math.cos(rad + Math.PI / 2);
    const dy = (length / 2) * Math.sin(rad + Math.PI / 2);
    return (
      <line
        key={`${x}-${y}-${stroke}`}
        x1={x - dx}
        y1={y - dy}
        x2={x + dx}
        y2={y + dy}
        stroke={stroke}
        strokeWidth={width}
      />
    );
  };

  // Calcula ángulo entre dos puntos
  const angleBetween = (p1, p2) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };

  return (
    <svg
      width={viewWidth}
      height={viewHeight}
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      style={{ border: '1px solid #ccc' }}
    >
      <g transform={`translate(${padding}, ${viewHeight - padding}) scale(${scale}, -${scale})`}>
        {/* Circuito */}
        <path d={pathData} stroke="gray" strokeWidth={15} fill="none" />

        {/* Línea de meta roja en el inicio del primer sector */}
        {sectorStartPoints?.[0] && carPoints?.[sectorStartPoints[0].index + 1] && (
          drawMarkerLine(
            sectorStartPoints[0].x,
            sectorStartPoints[0].y,
            angleBetween(
              carPoints[sectorStartPoints[0].index],
              carPoints[sectorStartPoints[0].index + 1]
            ),
            40,
            'red',
            8
          )
        )}

        {/* Líneas negras al inicio de los demás sectores */}
        {sectorStartPoints?.slice(1).map((p, i) => {
          const next = carPoints?.[p.index + 1];
          if (!next) return null;
          const angle = angleBetween(carPoints[p.index], next);
          return drawMarkerLine(p.x, p.y, angle, 20, 'black', 4);
        })}

        {/* Auto */}
        {carPosition && (
          <circle cx={carPosition.x} cy={carPosition.y} r="15" fill="blue" />
        )}
      </g>
    </svg>
  );
}