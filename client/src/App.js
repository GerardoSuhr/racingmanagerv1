import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { generateCircuitSVG } from './utils/generateCircuitSVG';
import CircuitSVG from './components/CircuitSVG';

function App() {
  const [circuit, setCircuit] = useState(null);
  const [pathData, setPathData] = useState('');
  const [startMarker, setStartMarker] = useState(null);
  const [sectorStartPoints, setSectorStartPoints] = useState([]);
  const [sectorNames, setSectorNames] = useState([]);
  const [bounds, setBounds] = useState(null);
  const [selectedCircuitId, setSelectedCircuitId] = useState(1);
  const [availableCircuits, setAvailableCircuits] = useState([]);

  const [isRunning, setIsRunning] = useState(false);
  const [wasStopped, setWasStopped] = useState(false);
  const [carPosition, setCarPosition] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [customSpeed, setCustomSpeed] = useState(100);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [sectorTimes, setSectorTimes] = useState([]);

  const intervalRef = useRef(null);
  const carPath = useRef([]);
  const speedPath = useRef([]);
  const indexRef = useRef(0);

  const currentSectorIndexRef = useRef(0);
  const sectorStartTimeRef = useRef(0);
  const elapsedRef = useRef(0); // NUEVO: tiempo real en ms

  useEffect(() => {
    axios.get(`http://localhost:3001/circuit?id=${selectedCircuitId}`)
      .then(res => {
        setCircuit(res.data);
        const {
          path,
          startLine,
          bounds,
          carPoints,
          carSpeeds,
          sectorStartPoints
        } = generateCircuitSVG(
          res.data.sectors,
          res.data.mini_sectors,
          { speed: customSpeed }
        );

        setPathData(path);
        setStartMarker(startLine);
        setSectorStartPoints(sectorStartPoints);
        setSectorNames(res.data.sectors.map(s => s.name));
        setBounds(bounds);

        // Reset estado
        setCarPosition(null);
        setElapsedTime(0);
        elapsedRef.current = 0;
        setCurrentSpeed(0);
        setCompleted(false);
        setIsRunning(false);
        setWasStopped(false);
        setSectorTimes([]);
        indexRef.current = 0;
        currentSectorIndexRef.current = 0;
        sectorStartTimeRef.current = 0;

        if (intervalRef.current) clearInterval(intervalRef.current);

        carPath.current = carPoints;
        speedPath.current = carSpeeds;
      })
      .catch(console.error);
  }, [selectedCircuitId, customSpeed]);

  useEffect(() => {
    axios.get('http://localhost:3001/circuits')
      .then(res => setAvailableCircuits(res.data))
      .catch(console.error);
  }, []);

  const startSimulation = () => {
    if (!carPath.current.length) return;

    setIsRunning(true);
    setWasStopped(false);
    setCompleted(false);

    currentSectorIndexRef.current = 0;
    sectorStartTimeRef.current = 0;
    elapsedRef.current = 0;

    const intervalMs = 30;
    intervalRef.current = setInterval(() => {
      const i = indexRef.current;

      if (i >= carPath.current.length) {
        clearInterval(intervalRef.current);
        setIsRunning(false);
        setCompleted(true);

        // Registrar último sector
        if (currentSectorIndexRef.current < sectorStartPoints.length) {
          const time = elapsedRef.current - sectorStartTimeRef.current;
          setSectorTimes(prev => [
            ...prev,
            {
              index: currentSectorIndexRef.current,
              time
            }
          ]);
        }

        return;
      }

      // Actualizar estado
      elapsedRef.current += intervalMs;
      setElapsedTime(elapsedRef.current);
      setCarPosition(carPath.current[i]);
      setCurrentSpeed(speedPath.current[i] || 0);
      indexRef.current += 1;

      // Ver si entramos a un nuevo sector
      if (
        currentSectorIndexRef.current < sectorStartPoints.length - 1 &&
        i >= sectorStartPoints[currentSectorIndexRef.current + 1].index
      ) {
        const time = elapsedRef.current - sectorStartTimeRef.current;
        setSectorTimes(prev => [
          ...prev,
          {
            index: currentSectorIndexRef.current,
            time
          }
        ]);

        currentSectorIndexRef.current += 1;
        sectorStartTimeRef.current = elapsedRef.current;
      }
    }, intervalMs);
  };

  const stopSimulation = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setWasStopped(true);
  };

  const resetSimulation = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setCarPosition(null);
    setElapsedTime(0);
    elapsedRef.current = 0;
    setCurrentSpeed(0);
    setCompleted(false);
    setWasStopped(false);
    setSectorTimes([]);
    indexRef.current = 0;
    currentSectorIndexRef.current = 0;
    sectorStartTimeRef.current = 0;
  };

  const formatTime = (ms) => {
    const milliseconds = ms % 1000;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedMs = milliseconds.toString().padStart(3, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');

    if (hours > 0) {
      return `${hours}:${formattedMinutes}:${formattedSeconds}.${formattedMs}`;
    } else {
      return `${formattedMinutes}:${formattedSeconds}.${formattedMs}`;
    }
  };

  const formatDistance = (meters) => `${meters.toFixed(0)} m`;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Racing Manager V1</h1>

      <div style={{ marginBottom: '1rem' }}>
        {availableCircuits.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCircuitId(c.id)}
            disabled={selectedCircuitId === c.id}
            style={{ marginRight: '0.5rem' }}
          >
            {c.name}
          </button>
        ))}
        <input
          type="number"
          value={customSpeed}
          onChange={(e) => setCustomSpeed(parseInt(e.target.value) || 0)}
          style={{ width: '80px', marginLeft: '1rem' }}
        /> km/h

        <button onClick={startSimulation} disabled={isRunning} style={{ marginLeft: '1rem' }}>
          Start
        </button>
        <button onClick={startSimulation} disabled={!(wasStopped && !isRunning)} style={{ marginLeft: '0.5rem' }}>
          Resume
        </button>
        <button onClick={stopSimulation} disabled={!isRunning} style={{ marginLeft: '0.5rem' }}>
          Stop
        </button>
        <button onClick={resetSimulation} style={{ marginLeft: '0.5rem' }}>
          Reset
        </button>
      </div>

      {circuit && (
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start' }}>
            <div>
              <h2>
                {circuit.circuit.name}{' '}
                <span>— Longitud total: {formatDistance(circuit.circuit.total_length_m)}</span>
              </h2>
              <CircuitSVG
                pathData={pathData}
                bounds={bounds}
                startLine={startMarker}
                carPosition={carPosition}
                sectorStartPoints={sectorStartPoints}
                carPoints={carPath.current}
              />
            </div>
            <div style={{ paddingLeft: '1rem', fontSize: '0.9rem' }}>
              <h3 style={{ marginTop: 0 }}>Datos</h3>
              {isRunning && (
                <>
                  <p><strong>Tiempo:</strong> {formatTime(elapsedTime)}</p>
                  <p><strong>Velocidad:</strong> {currentSpeed.toFixed(1)} km/h</p>
                  <p><strong>Distancia:</strong> {formatDistance(indexRef.current)}</p>
                </>
              )}
              {completed && (
                <p style={{ color: 'green' }}>
                  <strong>¡Vuelta completada en {formatTime(elapsedTime)}!</strong>
                </p>
              )}
              {sectorTimes.length > 0 && (
                <>
                  <h4 style={{ marginTop: '1rem' }}>Tiempos por sector</h4>
                  <ul>
                    {sectorTimes.map((st, i) => (
                      <li key={i}>
                        {sectorNames[i] ?? `Sector ${i + 1}`}: {formatTime(st.time)}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;