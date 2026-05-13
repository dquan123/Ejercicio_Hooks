import { useState, useEffect, useRef } from 'react';

// ─── Constantes (Nivel 2) ────────────────────────────────────────────────────
const WORK_TIME = 1500;   // 25 minutos en segundos
const BREAK_TIME = 300;   // 5 minutos en segundos

// ─── Utilidad: formatear segundos a MM:SS ────────────────────────────────────
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function Pomodoro() {

  // ── NIVEL 1: Estados básicos ──────────────────────────────────────────────
  const [timeLeft, setTimeLeft]   = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);

  // ── NIVEL 2: Modo y historial de sesiones ─────────────────────────────────
  const [mode, setMode]         = useState('work');      // 'work' | 'break'
  const [sessions, setSessions] = useState([]);

  // ── NIVEL 3: Configuración personalizable ────────────────────────────────
  const [workMins, setWorkMins]   = useState(25);
  const [breakMins, setBreakMins] = useState(5);

  // ── NIVEL 1: useRef para guardar el ID del intervalo ─────────────────────
  const intervalRef = useRef(null);

  // ─────────────────────────────────────────────────────────────────────────
  // NIVEL 1 — useEffect: lógica del timer (cuenta regresiva + cleanup)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      // Crear el intervalo y guardar su ID en la ref (no en estado → no re-render)
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);  // forma funcional para evitar closure stale
      }, 1000);
    }

    if (timeLeft === 0) {
      setIsRunning(false);
    }

    // Cleanup: limpiar el intervalo anterior antes de crear uno nuevo
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  // ─────────────────────────────────────────────────────────────────────────
  // NIVEL 2 — useEffect: detectar cuando llega a 0 y cambiar de modo
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft !== 0) return;

    if (mode === 'work') {
      // Guardar la sesión de trabajo completada
      setSessions(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'work',
          duration: workMins * 60,
          completedAt: new Date(),
        },
      ]);
    }

    // Cambiar al modo opuesto
    const nextMode = mode === 'work' ? 'break' : 'work';
    const nextTime = nextMode === 'work' ? workMins * 60 : breakMins * 60;

    setMode(nextMode);
    setTimeLeft(nextTime);
    setIsRunning(true);   // arrancar automáticamente el siguiente modo
  }, [timeLeft]);         // solo depende de timeLeft

  // ─────────────────────────────────────────────────────────────────────────
  // NIVEL 3 — useEffect: sincronizar timeLeft cuando cambia la configuración
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(mode === 'work' ? workMins * 60 : breakMins * 60);
    }
  }, [workMins, breakMins]);

  // ─────────────────────────────────────────────────────────────────────────
  // NIVEL 3 — useEffect: sonido al completar cada sesión
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft !== 0) return;
    try {
      new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play();
    } catch (e) {
      // El navegador puede bloquear audio sin interacción del usuario
      console.warn('No se pudo reproducir el sonido:', e);
    }
  }, [timeLeft]);

  // ─────────────────────────────────────────────────────────────────────────
  // NIVEL 1 — Funciones de control
  // ─────────────────────────────────────────────────────────────────────────
  function toggleTimer() {
    setIsRunning(prev => !prev);
  }

  function resetTimer() {
    setIsRunning(false);
    setMode('work');                    // Nivel 2: resetear modo
    setTimeLeft(workMins * 60);
    setSessions([]);                    // Nivel 2: limpiar historial
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NIVEL 3 — Guardar sesión parcial (sin detener el timer)
  // ─────────────────────────────────────────────────────────────────────────
  function savePartialSession() {
    const totalTime = mode === 'work' ? workMins * 60 : breakMins * 60;
    const elapsed   = totalTime - timeLeft;
    if (elapsed === 0) return;

    setSessions(prev => [
      ...prev,
      {
        id: Date.now(),
        type: 'work (parcial)',
        duration: elapsed,
        completedAt: new Date(),
      },
    ]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NIVEL 3 — Estadísticas derivadas (sin useState extra)
  // ─────────────────────────────────────────────────────────────────────────
  const workSessions   = sessions.filter(s => s.type === 'work');
  const totalSeconds   = workSessions.reduce((acc, s) => acc + s.duration, 0);
  const totalFormatted = formatTime(totalSeconds);

  // ─────────────────────────────────────────────────────────────────────────
  // NIVEL 3 — Barra de progreso
  // ─────────────────────────────────────────────────────────────────────────
  const totalTime = mode === 'work' ? workMins * 60 : breakMins * 60;
  const progress  = Math.round(((totalTime - timeLeft) / totalTime) * 100);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={styles.container}>

      {/* ── Modo actual ── */}
      <p style={styles.modeLabel}>
        {mode === 'work' ? '🍅 Tiempo de trabajo' : '☕ Descanso'}
      </p>

      {/* ── Display del tiempo ── */}
      <div style={styles.timerDisplay}>
        {formatTime(timeLeft)}
      </div>

      {/* ── NIVEL 3: Barra de progreso ── */}
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      {/* ── Botones principales ── */}
      <div style={styles.controls}>
        <button onClick={toggleTimer} style={styles.btnPrimary}>
          {isRunning ? 'Pausar' : 'Iniciar'}
        </button>
        <button onClick={resetTimer} style={styles.btnSecondary}>
          Reiniciar
        </button>
        <button
          onClick={savePartialSession}
          disabled={timeLeft === totalTime}
          style={{
            ...styles.btnSecondary,
            opacity: timeLeft === totalTime ? 0.4 : 1,
            cursor: timeLeft === totalTime ? 'not-allowed' : 'pointer',
          }}
        >
          Guardar sesión
        </button>
      </div>

      {/* ── NIVEL 3: Configuración de tiempos ── */}
      <div style={styles.configRow}>
        <label style={styles.configLabel}>
          Trabajo (min):
          <input
            type="number"
            min="1"
            max="60"
            value={workMins}
            disabled={isRunning}
            onChange={e => setWorkMins(Math.max(1, Number(e.target.value)))}
            style={styles.input}
          />
        </label>
        <label style={styles.configLabel}>
          Descanso (min):
          <input
            type="number"
            min="1"
            max="60"
            value={breakMins}
            disabled={isRunning}
            onChange={e => setBreakMins(Math.max(1, Number(e.target.value)))}
            style={styles.input}
          />
        </label>
      </div>

      {/* ── NIVEL 3: Estadísticas ── */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Sesiones completadas</span>
          <span style={styles.statValue}>{workSessions.length}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Tiempo total de trabajo</span>
          <span style={styles.statValue}>{totalFormatted}</span>
        </div>
      </div>

      {/* ── NIVEL 2: Historial de sesiones ── */}
      {sessions.length > 0 && (
        <div style={styles.historial}>
          <h3 style={styles.historialTitle}>Historial de sesiones</h3>
          <ul style={styles.sessionList}>
            {sessions.map((session, index) => (
              <li key={session.id} style={styles.sessionItem}>
                <span style={styles.sessionNum}>#{index + 1}</span>
                <span style={styles.sessionType}>{session.type}</span>
                <span style={styles.sessionDuration}>{formatTime(session.duration)}</span>
                <span style={styles.sessionTime}>
                  {session.completedAt.toLocaleTimeString('es-GT', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}

// ─── Estilos inline ───────────────────────────────────────────────────────────
const styles = {
  container: {
    maxWidth: 480,
    margin: '40px auto',
    padding: '32px 24px',
    fontFamily: "'Segoe UI', sans-serif",
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
    border: '1px solid #e2e2e2',
  },
  modeLabel: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 600,
    color: '#b44c33',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  timerDisplay: {
    textAlign: 'center',
    fontSize: 72,
    fontWeight: 700,
    letterSpacing: -2,
    color: '#1a1a1a',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
    margin: '8px 0 20px',
  },
  progressBar: {
    width: '100%',
    height: 8,
    background: '#f0f0f0',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    background: '#b44c33',
    borderRadius: 99,
    transition: 'width 1s linear',
  },
  controls: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  btnPrimary: {
    padding: '10px 28px',
    fontSize: 15,
    fontWeight: 600,
    background: '#b44c33',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  btnSecondary: {
    padding: '10px 20px',
    fontSize: 15,
    fontWeight: 500,
    background: '#f5f5f5',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: 8,
    cursor: 'pointer',
  },
  configRow: {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
    marginBottom: 24,
  },
  configLabel: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: 13,
    color: '#666',
    gap: 4,
    alignItems: 'center',
  },
  input: {
    width: 70,
    padding: '6px 10px',
    fontSize: 15,
    borderRadius: 6,
    border: '1px solid #ddd',
    textAlign: 'center',
  },
  statsRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    background: '#fdf5f3',
    border: '1px solid #f0d8d2',
    borderRadius: 8,
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    color: '#b44c33',
    fontVariantNumeric: 'tabular-nums',
  },
  historial: {
    borderTop: '1px solid #eee',
    paddingTop: 16,
  },
  historialTitle: {
    fontSize: 13,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#999',
    marginBottom: 12,
  },
  sessionList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  sessionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 0',
    borderBottom: '1px solid #f5f5f5',
    fontSize: 14,
  },
  sessionNum: {
    color: '#bbb',
    fontSize: 12,
    width: 28,
    fontVariantNumeric: 'tabular-nums',
  },
  sessionType: {
    flex: 1,
    color: '#555',
  },
  sessionDuration: {
    fontWeight: 600,
    color: '#1a1a1a',
    fontVariantNumeric: 'tabular-nums',
  },
  sessionTime: {
    color: '#aaa',
    fontSize: 12,
    width: 50,
    textAlign: 'right',
  },
};