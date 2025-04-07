export function generateCircuitSVG(sectors, miniSectors, options = {}) {
  const padding = 50;
  const points = [];
  const speeds = [];

  let x = 0;
  let y = 0;
  let angle = 0;
  let previousWasCurve = false;

  const carSpeedKmh = options.speed ?? 100;
  const intervalMs = 30;

  const getSpeedFactor = (radius) => {
    if (!radius) return 1;
    return Math.min(0.99, Math.max(0.5, ((radius - 100) / 200) * (0.99 - 0.5) + 0.5));
  };

  const toRadians = (deg) => (deg * Math.PI) / 180;

  const addPoint = (px, py, speed) => {
    points.push({ x: px, y: py });
    speeds.push(speed);
  };

  const orderedMiniSectors = sectors
    .flatMap(sector => sector.mini_sector_ids.map(id => miniSectors.find(ms => ms.id === id)))
    .filter(Boolean);

  const sectorStartData = [];

  for (let i = 0; i < orderedMiniSectors.length; i++) {
    const ms = orderedMiniSectors[i];
    const length = ms.length_cm / 100;
    const radius = ms.curvature_radius_cm / 100;
    const speedFactor = getSpeedFactor(radius);
    const speedKmh = carSpeedKmh * speedFactor;
    const speedMps = speedKmh * 1000 / 3600;
    const distancePerStep = speedMps * (intervalMs / 1000);

    // Guardar punto de inicio de cada sector
    for (let s = 0; s < sectors.length; s++) {
      const sector = sectors[s];
      const firstMiniSectorId = sector.mini_sector_ids[0];
      if (ms.id === firstMiniSectorId) {
        sectorStartData.push({ x, y, index: points.length });
        break;
      }
    }

    if (radius === 0) {
      if (
        typeof ms.direction === 'number' &&
        !isNaN(ms.direction) &&
        !previousWasCurve
      ) {
        angle = ms.direction;
      }

      const dx = length * Math.cos(toRadians(angle));
      const dy = length * Math.sin(toRadians(angle));
      const steps = Math.max(1, Math.floor(length / distancePerStep));

      for (let j = 0; j <= steps; j++) {
        const px = x + (dx * j) / steps;
        const py = y + (dy * j) / steps;
        addPoint(px, py, speedKmh);
      }

      x += dx;
      y += dy;
    } else {
      const arcAngle = ms.arc_angle_deg ?? 180;
      const steps = Math.max(1, Math.floor((radius * toRadians(arcAngle)) / distancePerStep));
      const clockwise = ms.curve_direction === 'clockwise';
      const sign = clockwise ? -1 : 1;

      const startAngle = toRadians(angle);
      const cx = x + radius * Math.cos(startAngle + sign * Math.PI / 2);
      const cy = y + radius * Math.sin(startAngle + sign * Math.PI / 2);

      for (let j = 1; j <= steps; j++) {
        const theta = toRadians(arcAngle) * (j / steps);
        const angleStep = startAngle + sign * theta;
        const px = cx + radius * Math.cos(angleStep - sign * Math.PI / 2);
        const py = cy + radius * Math.sin(angleStep - sign * Math.PI / 2);
        addPoint(px, py, speedKmh);
      }

      const endAngle = startAngle + sign * toRadians(arcAngle);
      x = cx + radius * Math.cos(endAngle - sign * Math.PI / 2);
      y = cy + radius * Math.sin(endAngle - sign * Math.PI / 2);
      angle += sign * arcAngle;
    }

    previousWasCurve = radius !== 0;
  }

  const minX = Math.min(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxX = Math.max(...points.map(p => p.x));
  const maxY = Math.max(...points.map(p => p.y));

  const offsetX = padding - minX;
  const offsetY = padding - minY;

  const translatedPoints = points.map(p => ({ x: p.x + offsetX, y: p.y + offsetY }));
  const translatedStartData = sectorStartData.map(p => ({
    x: p.x + offsetX,
    y: p.y + offsetY,
    index: p.index
  }));

  const svgPathFromPoints = (pts) => {
    if (!pts.length) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  };

  const startLine = {
    x1: translatedPoints[0].x - 5,
    y1: translatedPoints[0].y - 5,
    x2: translatedPoints[0].x + 5,
    y2: translatedPoints[0].y + 5
  };
  
  return {
    path: svgPathFromPoints(translatedPoints),
    startLine,
    bounds: {
      width: maxX - minX + 2 * padding,
      height: maxY - minY + 2 * padding,
      minX,
      minY
    },
    carPoints: translatedPoints,
    carSpeeds: speeds,
    sectorStartPoints: translatedStartData
  };
}
