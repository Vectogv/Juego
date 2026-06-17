import { useState, useEffect, useRef, useCallback } from "react";

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

const TARGET_PER_LEVEL = 10;
const BASE_TIME = 50;
let idCounter = 1;

const STYLES = `
  .rg-root *{box-sizing:border-box;margin:0;padding:0;}
  .rg-root{
    --amarillo:#f5c244; --amarillo-osc:#d9a72a;
    --azul:#5d8cf0; --azul-osc:#3f6cd6;
    --verde:#4cb878; --verde-osc:#379a5e;
    --cielo:#eaf4fc; --nube:#cfe6f7;
    --cesped:#5fc783;
    --tinta:#27324a; --gris:#7c8aa3; --rojo:#e5594b;
    width:100vw;height:100vh;overflow:hidden;
    font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
    background:#0f1726;position:relative;
    display:flex;flex-direction:column;
    touch-action:none;user-select:none;
  }
  .rg-bar{
    display:flex;gap:8px;padding:12px 16px 6px;z-index:10;
    flex-shrink:0;flex-wrap:wrap;
  }
  .rg-pill{
    background:rgba(255,255,255,.9);border-radius:20px;padding:6px 14px;
    display:flex;align-items:center;gap:6px;
    font-weight:700;font-size:13px;color:var(--tinta);
    box-shadow:0 2px 8px rgba(0,0,0,.08);white-space:nowrap;
  }
  .rg-pill-num{
    width:22px;height:22px;border-radius:50%;background:#3b6fe0;color:#fff;
    display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;
  }
  .rg-pill-star{color:var(--amarillo-osc);font-size:15px;}
  .rg-pill-timer{color:var(--rojo);}
  .rg-pill-timer.late{animation:rgFlash .8s infinite;}
  @keyframes rgFlash{0%,100%{opacity:1;}50%{opacity:.4;}}
  .rg-prog{padding:4px 18px 2px;flex-shrink:0;z-index:10;}
  .rg-prog-row{display:flex;justify-content:space-between;margin-bottom:4px;}
  .rg-prog-lbl{font-size:11px;font-weight:800;letter-spacing:.06em;color:var(--gris);}
  .rg-prog-num{font-size:13px;font-weight:700;color:var(--tinta);}
  .rg-prog-track{height:8px;border-radius:6px;background:rgba(255,255,255,.5);overflow:hidden;}
  .rg-prog-fill{height:100%;border-radius:6px;background:linear-gradient(90deg,#4f86f0,#9b6cf0);transition:width .35s;}
  .rg-area{position:relative;flex:1;overflow:hidden;}
  .rg-sol{
    position:absolute;top:14px;right:20px;width:56px;height:56px;
    border-radius:50%;
    background:radial-gradient(circle at 35% 30%,#fff7b0,#f5d742 70%);
    box-shadow:0 0 36px rgba(245,215,66,.3);pointer-events:none;z-index:1;
  }
  .rg-nube{
    position:absolute;width:80px;height:30px;background:rgba(255,255,255,.7);
    border-radius:40px;pointer-events:none;z-index:1;
  }
  .rg-nube::before,.rg-nube::after{
    content:'';position:absolute;background:rgba(255,255,255,.7);border-radius:50%;
  }
  .rg-nube::before{width:40px;height:40px;top:-18px;left:6px;}
  .rg-nube::after{width:30px;height:30px;top:-12px;left:40px;}
  .rg-pasto{
    position:absolute;bottom:0;left:0;right:0;height:175px;
    background:linear-gradient(180deg,var(--cesped) 0%,var(--verde) 100%);
    border-radius:50% 50% 0 0 / 55px 55px 0 0;z-index:2;pointer-events:none;
  }
  .rg-item{
    position:absolute;display:flex;flex-direction:column;align-items:center;
    cursor:grab;z-index:3;touch-action:none;
    width:70px;pointer-events:auto;
  }
  .rg-item-icono{
    width:54px;height:54px;border-radius:50%;background:#fff;
    display:flex;align-items:center;justify-content:center;
    font-size:26px;box-shadow:0 4px 14px rgba(0,0,0,.14);
    transition:box-shadow .15s,transform .1s;
  }
  .rg-item.arrastrando{z-index:10;}
  .rg-item.arrastrando .rg-item-icono{
    box-shadow:0 12px 28px rgba(0,0,0,.25);transform:scale(1.12);
    cursor:grabbing;
  }
  .rg-item-nombre{
    font-size:10px;font-weight:700;color:var(--tinta);
    background:rgba(255,255,255,.85);padding:1px 7px;border-radius:8px;
    margin-top:3px;white-space:nowrap;pointer-events:none;
    box-shadow:0 1px 4px rgba(0,0,0,.08);
  }
  .rg-bins{
    position:absolute;bottom:16px;left:0;right:0;
    display:flex;justify-content:center;gap:clamp(10px,2.5vw,28px);
    z-index:4;padding:0 12px;
  }
  .rg-can{
    display:flex;flex-direction:column;align-items:center;
    transition:transform .12s;pointer-events:auto;
  }
  .rg-can.hover{transform:translateY(-6px) scale(1.05);}
  .rg-can.latido{animation:rgLatido .45s ease;}
  .rg-can.sacude{animation:rgSacude .35s ease;}
  @keyframes rgLatido{0%{transform:scale(1);}50%{transform:scale(1.12);}100%{transform:scale(1);}}
  @keyframes rgSacude{0%,100%{transform:translateX(0);}25%{transform:translateX(-6px);}75%{transform:translateX(6px);}}
  .rg-caja{
    width:clamp(64px,10vw,96px);height:clamp(78px,12vw,116px);
    border-radius:14px;position:relative;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    box-shadow:0 4px 12px rgba(0,0,0,.15);
    border:3px solid rgba(255,255,255,.5);
  }
  .rg-caja.amarilla{background:linear-gradient(160deg,#f7d264,var(--amarillo));}
  .rg-caja.azul{background:linear-gradient(160deg,#79a4f5,var(--azul));}
  .rg-caja.verde{background:linear-gradient(160deg,#6fce93,var(--verde));}
  .rg-oreja{
    position:absolute;top:-8px;width:16px;height:16px;border-radius:5px;
  }
  .rg-oreja.izq{left:9px;transform:rotate(-12deg);}
  .rg-oreja.der{right:9px;transform:rotate(12deg);}
  .rg-caja.amarilla .rg-oreja{background:var(--amarillo);}
  .rg-caja.azul .rg-oreja{background:var(--azul);}
  .rg-caja.verde .rg-oreja{background:var(--verde);}
  .rg-cara{display:flex;gap:8px;margin-bottom:4px;}
  .rg-ojo{width:6px;height:6px;border-radius:50%;background:#2a2f3a;}
  .rg-boca{width:18px;height:8px;border-bottom:2.5px solid #2a2f3a;border-radius:0 0 9px 9px;}
  .rg-simbolo{position:absolute;bottom:6px;font-size:14px;opacity:.9;}
  .rg-etiqueta{
    margin-top:5px;font-size:clamp(10px,1.2vw,13px);
    font-weight:800;color:var(--tinta);
    background:rgba(255,255,255,.88);padding:2px 10px;border-radius:9px;white-space:nowrap;
  }
  .rg-toast{
    position:absolute;left:14px;right:14px;bottom:14px;
    background:#fff;border-radius:16px;padding:14px;
    display:flex;gap:10px;
    box-shadow:0 -6px 22px rgba(0,0,0,.14);z-index:20;
    animation:rgSube .25s ease;
  }
  @keyframes rgSube{from{transform:translateY(30px);opacity:0;}to{transform:translateY(0);opacity:1;}}
  .rg-toast-icono{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;margin-top:1px;}
  .rg-toast.ok .rg-toast-icono{background:#fff3cf;color:var(--amarillo-osc);}
  .rg-toast.mal .rg-toast-icono{background:#fde2df;color:var(--rojo);}
  .rg-toast-cuerpo{flex:1;min-width:0;}
  .rg-toast-tit{font-weight:800;font-size:14px;margin:0 0 2px;}
  .rg-toast.ok .rg-toast-tit{color:#2f9e58;}
  .rg-toast.mal .rg-toast-tit{color:var(--rojo);}
  .rg-toast-txt{font-size:12.5px;color:var(--tinta);line-height:1.4;margin:0;}
  .rg-toast-x{background:#f1f3f7;border:none;width:24px;height:24px;border-radius:50%;color:var(--gris);font-size:12px;cursor:pointer;flex-shrink:0;margin-top:1px;}
  .rg-overlay{position:absolute;inset:0;background:rgba(15,23,38,.55);display:flex;align-items:center;justify-content:center;z-index:50;padding:20px;}
  .rg-modal{background:#fff;border-radius:22px;width:100%;max-width:350px;padding:24px 20px 20px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.3);animation:rgSube .3s;}
  .rg-medalla{width:72px;height:72px;border-radius:50%;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;font-size:34px;
    background:radial-gradient(circle at 35% 30%,#fff3c4,var(--amarillo) 70%);box-shadow:0 0 0 5px rgba(245,194,68,.22);}
  .rg-medalla.tiempo{background:radial-gradient(circle at 35% 30%,#ffd9d2,var(--rojo) 70%);box-shadow:0 0 0 5px rgba(229,89,75,.2);}
  .rg-badge{display:inline-block;background:#3b6fe0;color:#fff;font-size:10.5px;font-weight:800;padding:4px 13px;border-radius:11px;margin-bottom:8px;}
  .rg-badge.tiempo{background:var(--rojo);}
  .rg-modal h2{margin:0 0 5px;font-size:20px;color:var(--tinta);}
  .rg-modal .rg-desc{margin:0 0 12px;font-size:13px;color:var(--gris);line-height:1.5;}
  .rg-pts{background:#f4f7fb;border-radius:12px;padding:10px;margin-bottom:14px;}
  .rg-pts-lbl{font-size:10px;font-weight:800;letter-spacing:.08em;color:var(--gris);}
  .rg-pts-val{font-size:24px;font-weight:800;color:var(--tinta);margin-top:2px;}
  .rg-btn{width:100%;border:none;border-radius:12px;padding:11px;font-size:14px;font-weight:800;color:#fff;cursor:pointer;box-shadow:0 4px 10px rgba(0,0,0,.1);transition:transform .1s;margin-bottom:7px;}
  .rg-btn:active{transform:scale(.97);}
  .rg-btn.prim{background:linear-gradient(135deg,#5d8cf0,#3b6fe0);}
  .rg-btn.sec{background:linear-gradient(135deg,#5fd690,#379a5e);}
  .rg-btn.reint{background:linear-gradient(135deg,#f08a7f,var(--rojo));}
  .rg-pie{font-size:10px;font-weight:700;color:var(--gris);}
`;

function Caneca({ caneca, hover, anim, setRef }) {
  return (
    <div ref={(el) => setRef(caneca.category, el)}
         className={"rg-can" + (hover ? " hover" : "") + (anim ? " " + anim : "")}>
      <div className={"rg-caja " + caneca.color}>
        <span className="rg-oreja izq"></span>
        <span className="rg-oreja der"></span>
        <div className="rg-cara"><span className="rg-ojo"></span><span className="rg-ojo"></span></div>
        <span className="rg-boca"></span>
        <span className="rg-simbolo">♻</span>
      </div>
      <span className="rg-etiqueta">{caneca.label}</span>
    </div>
  );
}

export default function RecyclingGame() {
  const [nivel, setNivel] = useState(1);
  const [puntos, setPuntos] = useState(0);
  const [reciclados, setReciclados] = useState(0);
  const [tiempo, setTiempo] = useState(BASE_TIME);
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

  const setCanRef = (cat, el) => { canRefs.current[cat] = el; };

  const spawnItem = useCallback(() => {
    const area = areaRef.current;
    if (!area) return;
    const w = area.clientWidth;
    const tipo = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
    setItems((prev) => [...prev, {
      id: idCounter++, category: tipo.category, emoji: tipo.emoji,
      label: tipo.label, msg: tipo.msg,
      x: 24 + Math.random() * (w - 88), y: -70,
    }]);
  }, []);

  useEffect(() => {
    if (fase !== "jugando") return;
    const int = Math.max(2200 - nivel * 180, 900);
    spawnRef.current = setInterval(spawnItem, int);
    return () => clearInterval(spawnRef.current);
  }, [fase, nivel, spawnItem]);

  useEffect(() => {
    if (fase !== "jugando") return;
    let last = performance.now();
    const vel = 22 + nivel * 5;
    const step = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const area = areaRef.current;
      const lim = area ? area.clientHeight - 140 : 600;
      setItems((prev) =>
        prev.map((it) => (it.id === arrId ? it : { ...it, y: it.y + vel * dt }))
          .filter((it) => it.y < lim + 80)
      );
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [fase, nivel, arrId]);

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

  const onDown = (e, item) => {
    e.preventDefault();
    const el = itemRefs.current[item.id];
    if (!el) return;
    const r = el.getBoundingClientRect();
    arrOff.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    setArrId(item.id);
  };

  useEffect(() => {
    if (arrId == null) return;
    const onMove = (e) => {
      const area = areaRef.current;
      if (!area) return;
      const r = area.getBoundingClientRect();
      setItems((prev) => prev.map((it) => (it.id === arrId ? { ...it, x: e.clientX - r.left - arrOff.current.x, y: e.clientY - r.top - arrOff.current.y } : it)));
      let hc = null;
      Object.entries(canRefs.current).forEach(([cat, el]) => {
        if (!el) return;
        const cr = el.getBoundingClientRect();
        if (e.clientX >= cr.left - 10 && e.clientX <= cr.right + 10 && e.clientY >= cr.top - 10 && e.clientY <= cr.bottom + 10) hc = cat;
      });
      setHoverCan(hc);
    };
    const onUp = (e) => {
      const idItem = arrId;
      setArrId(null); setHoverCan(null);
      let catSuelta = null;
      Object.entries(canRefs.current).forEach(([cat, el]) => {
        if (!el) return;
        const cr = el.getBoundingClientRect();
        if (e.clientX >= cr.left - 10 && e.clientX <= cr.right + 10 && e.clientY >= cr.top - 10 && e.clientY <= cr.bottom + 10) catSuelta = cat;
      });
      if (!catSuelta) return;
      setItems((prev) => {
        const item = prev.find((it) => it.id === idItem);
        if (!item) return prev;
        if (item.category === catSuelta) {
          setPuntos((s) => s + 50);
          setReciclados((r) => { const n = r + 1; if (n >= TARGET_PER_LEVEL) setTimeout(() => setFase("nivelCompleto"), 400); return n; });
          setToast({ ok: true, titulo: "¡Correcto!", texto: item.msg });
          setAnimCan((b) => ({ ...b, [catSuelta]: "latido" }));
        } else {
          setPuntos((s) => Math.max(0, s - 10));
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
  }, [arrId]);

  const reset = (nv) => {
    setItems([]); setReciclados(0);
    setTiempo(Math.max(BASE_TIME - (nv - 1) * 3, 22));
    setToast(null); setFase("jugando");
  };
  const sigNivel = () => { const n = nivel + 1; setNivel(n); reset(n); };
  const denuevo = () => { setNivel(1); setPuntos(0); reset(1); };
  const reintentar = () => reset(nivel);

  const mm = Math.floor(tiempo / 60);
  const ss = tiempo % 60;
  const tStr = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;

  return (
    <div className="rg-root">
      <style>{STYLES}</style>

      <div className="rg-bar">
        <div className="rg-pill"><span className="rg-pill-num">{nivel}</span><span>Nivel</span></div>
        <div className="rg-pill"><span className="rg-pill-star">★</span><span>{puntos} pts</span></div>
        <div className={"rg-pill rg-pill-timer" + (tiempo <= 10 ? " late" : "")}><span>⏱</span><span>{tStr}</span></div>
      </div>

      <div className="rg-prog">
        <div className="rg-prog-row">
          <span className="rg-prog-lbl">OBJETOS RECICLADOS</span>
          <span className="rg-prog-num">{reciclados} / {TARGET_PER_LEVEL}</span>
        </div>
        <div className="rg-prog-track">
          <div className="rg-prog-fill" style={{ width: `${(reciclados / TARGET_PER_LEVEL) * 100}%` }}></div>
        </div>
      </div>

      <div className="rg-area" ref={areaRef}>
        <div className="rg-sol"></div>
        <div className="rg-nube" style={{ top: 28, left: "8%" }}></div>
        <div className="rg-nube" style={{ top: 74, left: "55%" }}></div>
        <div className="rg-nube" style={{ top: 135, left: "25%" }}></div>

        {items.map((item) => (
          <div key={item.id} ref={(el) => (itemRefs.current[item.id] = el)}
               className={"rg-item" + (item.id === arrId ? " arrastrando" : "")}
               style={{ left: item.x - 35, top: item.y }}
               onPointerDown={(e) => onDown(e, item)}>
            <div className="rg-item-icono">{item.emoji}</div>
            <span className="rg-item-nombre">{item.label}</span>
          </div>
        ))}

        <div className="rg-pasto"></div>

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

        {fase === "nivelCompleto" && (
          <div className="rg-overlay">
            <div className="rg-modal">
              <div className="rg-medalla">♻</div>
              <span className="rg-badge">¡NIVEL COMPLETADO!</span>
              <h2>¡Felicidades!</h2>
              <p className="rg-desc">Has ayudado a proteger el planeta clasificando correctamente los residuos reciclables.</p>
              <div className="rg-pts"><div className="rg-pts-lbl">PUNTUACIÓN</div><div className="rg-pts-val">★ {puntos}</div></div>
              <button className="rg-btn prim" onClick={sigNivel}>SIGUIENTE NIVEL ▶▶</button>
              <button className="rg-btn sec" onClick={denuevo}>JUGAR DE NUEVO ↻</button>
              <div className="rg-pie">🌍 CUIDANDO EL PLANETA</div>
            </div>
          </div>
        )}

        {fase === "tiempo" && (
          <div className="rg-overlay">
            <div className="rg-modal">
              <div className="rg-medalla tiempo">⏱</div>
              <span className="rg-badge tiempo">¡SE ACABÓ EL TIEMPO!</span>
              <h2>¡Sigue intentando!</h2>
              <p className="rg-desc">No alcanzaste a clasificar todos los residuos. ¡Tú puedes!</p>
              <div className="rg-pts"><div className="rg-pts-lbl">RECICLADOS</div><div className="rg-pts-val">{reciclados} / {TARGET_PER_LEVEL}</div></div>
              <button className="rg-btn reint" onClick={reintentar}>REINTENTAR NIVEL ↻</button>
              <button className="rg-btn sec" onClick={denuevo}>EMPEZAR DE NUEVO</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
