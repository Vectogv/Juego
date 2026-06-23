import './styles/Tablero.css';
import { useState, useRef, useEffect } from 'react';

const emojis = [
  '🧴','🥤','🍾','🥃','📄','📦','🧴','🥤',
  '🍾','🥃','📄','📦','🧴','🥤','🍾','🥃',
  '📄','📦','🧴','🥤','🍾','🥃','📄','📦',
  '🧴','🥤','🍾','🥃','📄','📦','🧴','🥤',
  '🍾','🥃','📄','📦','🧴','🥤','🍾','🥃',
  '📄','📦','🧴','🥤','🍾','🥃','📄','📦',
  '🧴','🥤','🍾','🥃','📄','📦','🧴','🥤',
  '🍾','🥃','📄','📦','🧴','🥤','🍾','🥃',
];

const TIPOS = {
  '🧴': 'plástico', '🥤': 'plástico',
  '🍾': 'vidrio',   '🥃': 'vidrio',
  '📄': 'PAPEL',    '📦': 'papel',
};

function App() {
  const [timeline, setTimeline] = useState([]);
  const [score, setScore] = useState(0);
  const [reciclados, setReciclados] = useState(0);
  const timelineRef = useRef(null);

  let idCounter = useRef(0);

  function addTimelineEvent(icon, text) {
    const now = new Date();
    const time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    idCounter.current += 1;
    setTimeline(prev => [...prev.slice(-49), { id: idCounter.current, time, icon, text }]);
  }

  function handleCellClick(i) {
    const emoji = emojis[i];
    const tipo = TIPOS[emoji] || 'desconocido';
    addTimelineEvent(emoji, `Click en ficha de ${tipo}`);
  }

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [timeline]);

  useEffect(() => {
    addTimelineEvent('🎮', 'Partida iniciada');
    addTimelineEvent('♻️', 'Bienvenido a EcoRecicla');
  }, []);

  return (
    <div className="contenedor">
      <div className="juego-lado">

        <div className="juego-principal">

          <div className="encabezado">
            <h1>♻️ EcoRecicla</h1>
            <button className="reiniciar" onClick={() => {
              setTimeline([]);
              setScore(0);
              setReciclados(0);
              idCounter.current = 0;
              addTimelineEvent('RECICLAJE', 'Partida reiniciada');
            }}>↻</button>
          </div>

          <div className="puntos">
            <div className="caja"><span>PUNTOS</span><span>{score}</span></div>
            <div className="caja"><span>RECICLADOS</span><span>{reciclados}</span></div>
            <div className="caja"><span>RECORD</span><span className="dorado">0</span></div>
          </div>

          <div className="tablero">
            {emojis.map((emoji, i) => (
              <div key={i} className="celda" onClick={() => handleCellClick(i)}>{emoji}</div>
            ))}
          </div>

          <div className="canecas">
            <div className="caneca">
              <img src={new URL('./assets/plastico.png', import.meta.url).href} alt="Plastico" />
              <span>PLASTICO</span>
            </div>
            <div className="caneca">
              <img src={new URL('./assets/papelcarton.png', import.meta.url).href} alt="Papel" />
              <span>PAPEL</span>
            </div>
            <div className="caneca">
              <img src={new URL('./assets/vidrio.png', import.meta.url).href} alt="Vidrio" />
              <span>VIDRIO</span>
            </div>
          </div>

        </div>

        <div className="timeline-panel">
          <div className="timeline-header">
            <span className="timeline-titulo">📜 HISTORIAL</span>
            <span className="timeline-contador">{timeline.length}</span>
          </div>
          <div className="timeline-lista" ref={timelineRef}>
            {timeline.length === 0 && (
              <div className="timeline-vacio">Sin eventos</div>
            )}
            {timeline.map(ev => (
              <div key={ev.id} className="timeline-evento">
                <span className="timeline-hora">{ev.time}</span>
                <span className="timeline-icono">{ev.icon}</span>
                <span className="timeline-texto">{ev.text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;