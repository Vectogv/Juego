import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import './styles/Juego.css';
import Caneca from './components/Caneca.jsx';
import fondoImg from './assets/fondo.png';

const ITEM_TYPES = [
  { category: "plastico", emoji: "🧴", label: "Botella plástica", msg: "Las botellas plásticas se reciclan para crear nuevos productos. ¡Van en la caneca AMARILLA!" },
  { category: "plastico", emoji: "🥤", label: "Vaso plástico", msg: "Los vasos de plástico limpios se reciclan. ¡Van en la caneca AMARILLA!" },
  { category: "plastico", emoji: "🧃", label: "Envase plástico", msg: "Los envases plásticos se reciclan fácilmente. ¡Van en la caneca AMARILLA!" },
  { category: "vidrio", emoji: "🍾", label: "Botella de vidrio", msg: "El vidrio se recicla infinitas veces sin perder calidad. ¡Va en la caneca VERDE!" },
  { category: "vidrio", emoji: "🫙", label: "Frasco de vidrio", msg: "Los frascos de vidrio se funden para crear nuevos envases. ¡Van en la caneca VERDE!" },
  { category: "papel", emoji: "📄", label: "Hoja de papel", msg: "El papel se recicla para fabricar hojas nuevas. ¡Va en la caneca AZUL!" },
  { category: "papel", emoji: "📦", label: "Caja de cartón", msg: "El cartón se transforma en nuevas cajas recicladas. ¡Va en la caneca AZUL!" },
  { category: "papel", emoji: "📰", label: "Periódico", msg: "Los periódicos viejos se convierten en papel nuevo. ¡Van en la caneca AZUL!" },
];

const WRONG_MESSAGES = [
  "Ese material va en otro contenedor. ¡Inténtalo de nuevo!",
  "Casi... ese material pertenece a otra categoría.",
  "Revisa bien el material y elige el contenedor correcto.",
];

const BINS = [
  { category: "plastico", color: "yellow", label: "PLÁSTICO" },
  { category: "papel", color: "blue", label: "PAPEL / CARTÓN" },
  { category: "vidrio", color: "green", label: "VIDRIO" },
];

const TOTAL_LEVELS = 3;

const LEVEL_CONFIG = {
  1: { target: 5, tiempo: 60, velocidad: 22, spawnInt: 2500, label: "🌱 FÁCIL", desc: "Solo plástico y papel", categories: ["plastico", "papel"] },
  2: { target: 8, tiempo: 45, velocidad: 35, spawnInt: 1700, label: "🔥 COMPLEJO", desc: "Ahora incluye vidrio", categories: null },
  3: { target: 10, tiempo: 30, velocidad: 50, spawnInt: 1000, label: "⚡ DIFÍCIL", desc: "¡Máxima velocidad!", categories: null },
};

const STREAK_BONUS = { threshold: 3, points: 10 };
const TIME_BONUS_MULTIPLIER = 2;
let idCounter = 1;

export default function RecyclingGame() {
  const [nivel, setNivel] = useState(1);
  const [puntos, setPuntos] = useState(0);
  const [reciclados, setReciclados] = useState(0);
  const [racha, setRacha] = useState(0);
  const [tiempo, setTiempo] = useState(LEVEL_CONFIG[1].tiempo);
  const [items, setItems] = useState([]);
  const [arrId, setArrId] = useState(null);
  const [toast, setToast] = useState(null);
  const [fase, setFase] = useState("jugando");
  const [hoverCan, setHoverCan] = useState(null);
  const [animCan, setAnimCan] = useState({});

  const areaRef = useRef(null);
  const canRefs = useRef({});
  const itemRefs = useRef({});
  const arrOff = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const spawnRef = useRef(null);
  const tickRef = useRef(null);
  const tiempoRef = useRef(tiempo);
  const completadoRef = useRef(false);

  const cfg = useMemo(() => LEVEL_CONFIG[nivel], [nivel]);

  const setCanRef = useCallback((cat, el) => { canRefs.current[cat] = el; }, []);
  const getBinAt = (e) => {
    for (const [cat, el] of Object.entries(canRefs.current)) {
      if (!el) continue;
      const cr = el.getBoundingClientRect();
      if (e.clientX >= cr.left - 10 && e.clientX <= cr.right + 10 && e.clientY >= cr.top - 10 && e.clientY <= cr.bottom + 10) return cat;
    }
    return null;
  };

  useEffect(() => { tiempoRef.current = tiempo; }, [tiempo]);

  const spawnItem = useCallback(() => {
    const area = areaRef.current;
    if (!area) return;
    const w = area.clientWidth;
    const disponibles = cfg.categories
      ? ITEM_TYPES.filter((t) => cfg.categories.includes(t.category))
      : ITEM_TYPES;
    if (disponibles.length === 0) return;
    const tipo = disponibles[Math.floor(Math.random() * disponibles.length)];
    setItems((prev) => [...prev, {
      id: idCounter++, category: tipo.category, emoji: tipo.emoji,
      label: tipo.label, msg: tipo.msg,
      x: 24 + Math.random() * (w - 88), y: -70,
    }]);
  }, [cfg]);

  useEffect(() => {
    if (fase !== "jugando") return;
    spawnRef.current = setInterval(spawnItem, cfg.spawnInt);
    return () => clearInterval(spawnRef.current);
  }, [fase, cfg.spawnInt, spawnItem]);

  useEffect(() => {
    if (fase !== "jugando") return;
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const area = areaRef.current;
      const lim = area ? area.clientHeight - 140 : 600;
      setItems((prev) =>
        prev.map((it) => (it.id === arrId ? it : { ...it, y: it.y + cfg.velocidad * dt }))
          .filter((it) => it.y < lim + 80)
      );
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [fase, cfg.velocidad, arrId]);

  useEffect(() => {
    if (fase !== "jugando") return;
    tickRef.current = setInterval(() => {
      setTiempo((t) => {
        if (t <= 1) { clearInterval(tickRef.current); setFase("tiempo"); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [fase]);

  const onDown = useCallback((e, item) => {
    e.preventDefault();
    const el = itemRefs.current[item.id];
    if (!el) return;
    const r = el.getBoundingClientRect();
    arrOff.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    setArrId(item.id);
  }, []);

  useEffect(() => {
    if (arrId == null) return;
    const onMove = (e) => {
      const area = areaRef.current;
      if (!area) return;
      const r = area.getBoundingClientRect();
      setItems((prev) => prev.map((it) => (it.id === arrId ? { ...it, x: e.clientX - r.left - arrOff.current.x, y: e.clientY - r.top - arrOff.current.y } : it)));
      setHoverCan(getBinAt(e));
    };
    const onUp = (e) => {
      const idItem = arrId;
      setArrId(null); setHoverCan(null);
      const catSuelta = getBinAt(e);
      if (!catSuelta) return;
      setItems((prev) => {
        const item = prev.find((it) => it.id === idItem);
        if (!item) return prev;
        if (item.category === catSuelta) {
          setPuntos((s) => s + 50);
          setRacha((r) => {
            const newR = r + 1;
            if (newR >= STREAK_BONUS.threshold) {
              setPuntos((s2) => s2 + STREAK_BONUS.points);
              setToast({ ok: true, titulo: `¡Racha de ${newR}! 🔥`, texto: `+${STREAK_BONUS.points} pts extra. ${item.msg}` });
            } else {
              setToast({ ok: true, titulo: "¡Correcto!", texto: item.msg });
            }
            return newR;
          });
          setReciclados((r) => {
            const n = r + 1;
            if (!completadoRef.current && n >= cfg.target) {
              completadoRef.current = true;
              setFase("completando");
              setTimeout(() => setFase(nivel >= TOTAL_LEVELS ? "victoria" : "nivelCompleto"), 400);
            }
            return n;
          });
          setAnimCan((b) => ({ ...b, [catSuelta]: "latido" }));
        } else {
          setPuntos((s) => Math.max(0, s - 10));
          setRacha(0);
          setToast({ ok: false, titulo: "Incorrecto", texto: WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)] });
          setAnimCan((b) => ({ ...b, [catSuelta]: "sacude" }));
        }
        setTimeout(() => setAnimCan((b) => ({ ...b, [catSuelta]: null })), 500);
        return prev.filter((it) => it.id !== idItem);
      });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [arrId, cfg.target, nivel]);

  useEffect(() => {
    if (fase === "nivelCompleto" || fase === "victoria") {
      const bonus = Math.max(0, tiempoRef.current) * TIME_BONUS_MULTIPLIER;
      if (bonus > 0) setPuntos((s) => s + bonus);
    }
  }, [fase]);

  const reset = useCallback((nv) => {
    const c = LEVEL_CONFIG[nv];
    setItems([]); setReciclados(0); setRacha(0);
    setTiempo(c.tiempo); setToast(null); setFase("jugando");
    completadoRef.current = false;
  }, []);

  const sigNivel = useCallback(() => {
    const n = nivel + 1;
    if (n > TOTAL_LEVELS) return;
    setNivel(n);
    reset(n);
  }, [nivel, reset]);

  const denuevo = useCallback(() => {
    setNivel(1); setPuntos(0); reset(1);
  }, [reset]);

  const reintentar = useCallback(() => reset(nivel), [nivel, reset]);

  const modal = (() => {
    if (fase === "nivelCompleto") return {
      medalla: "♻", badge: "¡NIVEL COMPLETADO!", badgeCls: "", medallaCls: "",
      titulo: "¡Felicidades!",
      desc: `Nivel ${nivel} superado.${tiempoRef.current > 0 ? ` Bonus de tiempo: +${Math.max(0, tiempoRef.current) * TIME_BONUS_MULTIPLIER} pts` : ""}`,
      ptsLbl: "PUNTUACIÓN TOTAL",
      botones: <button className="rg-btn prim" onClick={sigNivel}>SIGUIENTE NIVEL ▶▶</button>,
    };
    if (fase === "victoria") return {
      medalla: "🏆", badge: "🎉 ¡JUEGO COMPLETADO!", badgeCls: " victoria", medallaCls: " oro",
      titulo: "¡Eres un experto reciclador!",
      desc: "Has superado los 3 niveles. ¡El planeta te lo agradece! 🌍",
      ptsLbl: "🏆 PUNTUACIÓN FINAL", ptsStyle: { border: '2px solid var(--amarillo-osc)' },
      botones: null,
    };
    if (fase === "tiempo") return {
      medalla: "⏱", badge: "¡SE ACABÓ EL TIEMPO!", badgeCls: " tiempo", medallaCls: " tiempo",
      titulo: "¡Sigue intentando!",
      desc: "No alcanzaste a clasificar todos los residuos. ¡Tú puedes!",
      ptsLbl: "RECICLADOS", ptsVal: `${reciclados} / ${cfg.target}`,
      botones: <button className="rg-btn reint" onClick={reintentar}>REINTENTAR NIVEL ↻</button>,
    };
    return null;
  })();

  const tStr = `${String(Math.floor(tiempo / 60)).padStart(2, "0")}:${String(tiempo % 60).padStart(2, "0")}`;

  return (
    <div className="rg-root">
      <div className="rg-bar">
        <div className="rg-pill"><span className="rg-pill-num">{nivel}</span><span>{cfg.label}</span></div>
        <div className="rg-pill"><span className="rg-pill-star">★</span><span>{puntos} pts</span></div>
        {racha >= 2 && <div className="rg-pill"><span>🔥</span><span>Racha {racha}</span></div>}
        <div className={"rg-pill rg-pill-timer" + (tiempo <= 10 ? " late" : "")}><span>⏱</span><span>{tStr}</span></div>
      </div>

      <div className="rg-prog">
        <div className="rg-prog-row">
          <span className="rg-prog-lbl">{cfg.desc}</span>
          <span className="rg-prog-num">{reciclados} / {cfg.target}</span>
        </div>
        <div className="rg-prog-track">
          <div className="rg-prog-fill" style={{ width: `${(reciclados / cfg.target) * 100}%` }}></div>
        </div>
      </div>

      <div className="rg-area" ref={areaRef} style={{ backgroundImage: `url(${fondoImg})`, backgroundSize: 'cover', backgroundPosition: 'center bottom' }}>
        {items.map((item) => (
          <div key={item.id} ref={(el) => (itemRefs.current[item.id] = el)}
               className={"rg-item" + (item.id === arrId ? " arrastrando" : "")}
               style={{ transform: `translate(${item.x - 35}px, ${item.y}px)` }}
               onPointerDown={(e) => onDown(e, item)}>
            <div className="rg-item-icono">{item.emoji}</div>
            <span className="rg-item-nombre">{item.label}</span>
          </div>
        ))}

        <div className="rg-bins">
          {BINS.map((c) => (
            <Caneca key={c.category} caneca={c} hover={hoverCan === c.category} anim={animCan[c.category]} setRef={setCanRef} />
          ))}
        </div>

        {toast && (
          <div className={"rg-toast " + (toast.ok ? "ok" : "mal")}>
            <div className="rg-toast-icono">{toast.ok ? "★" : "✕"}</div>
            <div className="rg-toast-cuerpo">
              <p className="rg-toast-tit">{toast.titulo}</p>
              <p className="rg-toast-txt">{toast.texto}</p>
            </div>
            <button className="rg-toast-x" onClick={() => setToast(null)}>✕</button>
          </div>
        )}

        {modal && (
          <div className="rg-overlay">
            <div className="rg-modal">
              <div className={"rg-medalla" + modal.medallaCls}>{modal.medalla}</div>
              <span className={"rg-badge" + modal.badgeCls}>{modal.badge}</span>
              <h2>{modal.titulo}</h2>
              <p className="rg-desc">{modal.desc}</p>
              <div className="rg-pts" style={modal.ptsStyle}><div className="rg-pts-lbl">{modal.ptsLbl}</div><div className="rg-pts-val">★ {modal.ptsVal ?? puntos}</div></div>
              {modal.botones}
              <button className="rg-btn sec" onClick={denuevo}>JUGAR DE NUEVO ↻</button>
              <div className="rg-pie">🌍 CUIDANDO EL PLANETA</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
