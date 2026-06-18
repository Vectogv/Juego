const BIN_IMAGES = {
  plastico: new URL('../assets/plastico.png', import.meta.url).href,
  papel: new URL('../assets/papelcarton.png', import.meta.url).href,
  vidrio: new URL('../assets/vidrio.png', import.meta.url).href,
};

function Caneca({ caneca, hover, anim, setRef }) {
  return (
    <div ref={(el) => setRef(caneca.category, el)}
         className={"rg-can" + (hover ? " hover" : "") + (anim ? " " + anim : "")}>
      <img src={BIN_IMAGES[caneca.category]} alt={caneca.label} className="rg-can-img" />
      <span className="rg-etiqueta">{caneca.label}</span>
    </div>
  );
}

export default Caneca;
