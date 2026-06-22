import './styles/Tablero.css';

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

function App() {
  return (
    <div className="contenedor">

      <div className="encabezado">
        <h1>♻️ EcoRecicla</h1>
        <button className="reiniciar">↻</button>
      </div>

      <div className="puntos">
        <div className="caja"><span>PUNTOS</span><span>0</span></div>
        <div className="caja"><span>RECICLADOS</span><span>0</span></div>
        <div className="caja"><span>RECORD</span><span className="dorado">0</span></div>
      </div>

      <div className="tablero">
        {emojis.map((emoji, i) => (
          <div key={i} className="celda">{emoji}</div>
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
  );
}

export default App;