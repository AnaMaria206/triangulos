document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formulario");
  const explicacion = document.getElementById("explicacion");
  const resultados = document.getElementById("resultados");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  // Variables globales para guardar datos del triángulo actuales
  let ladosRes = [NaN, NaN, NaN];
  let angulosRes = [NaN, NaN, NaN];

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    limpiar();

    // Leer inputs, convertir a números o NaN si vacío
    const a = parseFloat(form.ladoA.value);
    const b = parseFloat(form.ladoB.value);
    const c = parseFloat(form.ladoC.value);
    const A = parseFloat(form.anguloA.value);
    const B = parseFloat(form.anguloB.value);
    const C = parseFloat(form.anguloC.value);

    // Contar datos ingresados
    const lados = [a, b, c].filter(x => !isNaN(x) && x > 0);
    const angulos = [A, B, C].filter(x => !isNaN(x) && x > 0);

    // Validaciones básicas
    if (lados.length + angulos.length < 3) {
      explicacion.textContent = "❌ Debes ingresar al menos tres datos, incluyendo al menos un lado.";
      return;
    }

    if (angulos.reduce((acc, val) => acc + val, 0) > 180) {
      explicacion.textContent = "❌ La suma de los ángulos no puede superar 180°.";
      return;
    }

    // Funciones auxiliares
    const rad = deg => deg * Math.PI / 180;
    const deg = rad => rad * 180 / Math.PI;
    const casiIgual = (x, y, tol = 1e-4) => Math.abs(x - y) < tol;

    // Calcular ángulo faltante si hay dos ángulos dados
    let angulosCompletos = {A, B, C};
    if (angulos.length === 2) {
      const sumAng = A + B + C;
      if (sumAng < 180) {
        if (isNaN(A)) angulosCompletos.A = 180 - B - C;
        else if (isNaN(B)) angulosCompletos.B = 180 - A - C;
        else if (isNaN(C)) angulosCompletos.C = 180 - A - B;
      }
    }

    // Releer ángulos actualizados
    const Acomp = angulosCompletos.A;
    const Bcomp = angulosCompletos.B;
    const Ccomp = angulosCompletos.C;

    // Detectar caso según datos dados
    // Lados y ángulos disponibles
    const ladosDatos = [a, b, c];
    const angDatos = [Acomp, Bcomp, Ccomp];

    // Auxiliar para contar valores válidos
    const numLados = ladosDatos.filter(x => !isNaN(x) && x > 0).length;
    const numAng = angDatos.filter(x => !isNaN(x) && x > 0).length;

    // Función para validar desigualdad triangular
    function desigualdadTriangular(x,y,z) {
      return x + y > z && x + z > y && y + z > x;
    }

    // Guardar datos calculados aquí
    ladosRes = [a,b,c];
    angulosRes = [Acomp, Bcomp, Ccomp];
    let explicacionTexto = "";
    let caso = "";
    let error = "";

    // CASO LLL (3 lados)
    if (numLados === 3 && numAng === 0) {
      if (!desigualdadTriangular(...ladosRes)) {
        error = "❌ Los lados no cumplen la desigualdad triangular.";
      } else {
        caso = "Caso Lado-Lado-Lado (LLL): Se usan Ley del Coseno para calcular los ángulos.";
        // Calcular ángulos por ley del coseno
        const [x,y,z] = ladosRes;
        const angA = deg(Math.acos((y**2 + z**2 - x**2) / (2 * y * z)));
        const angB = deg(Math.acos((x**2 + z**2 - y**2) / (2 * x * z)));
        const angC = 180 - angA - angB;
        angulosRes = [angA, angB, angC];
      }
    }
    // CASO LAL (2 lados y el ángulo incluido) o LLA (SSA) con ambigüedad
    else if (numLados === 2 && numAng === 1) {
      // Verificar que el ángulo dado sea el incluido entre los lados dados
      let idxAng = angDatos.findIndex(x => !isNaN(x) && x > 0);
      let ladosIdx = ladosRes.map((v,i) => (!isNaN(v) && v > 0) ? i : -1).filter(i => i !== -1);

      const ladosD = ladosIdx;
      const angIncluidoOk = 
        (ladosD.includes(0) && ladosD.includes(1) && idxAng === 2) ||
        (ladosD.includes(0) && ladosD.includes(2) && idxAng === 1) ||
        (ladosD.includes(1) && ladosD.includes(2) && idxAng === 0);

      if (angIncluidoOk) {
        // --- CASO LAL ---
        caso = "Caso Lado-Ángulo-Lado (LAL): Se usa Ley del Coseno para calcular el tercer lado y luego los ángulos restantes.";
        let [la, lb] = ladosD.map(i => ladosRes[i]);
        let Aang = angDatos[idxAng] * Math.PI/180;

        let ladoOpuestoIdx = [0,1,2].filter(i => !ladosD.includes(i))[0];
        const ladoCalculado = Math.sqrt(la**2 + lb**2 - 2*la*lb*Math.cos(Aang));
        ladosRes[ladoOpuestoIdx] = ladoCalculado;

        const [a1,b1,c1] = ladosRes;
        const angCalcA = deg(Math.acos((b1**2 + c1**2 - a1**2) / (2 * b1 * c1)));
        const angCalcB = deg(Math.acos((a1**2 + c1**2 - b1**2) / (2 * a1 * c1)));
        const angCalcC = 180 - angCalcA - angCalcB;
        angulosRes = [angCalcA, angCalcB, angCalcC];
      } else {
        // --- CASO LLA (SSA) con ambigüedad ---
        caso = "Caso Lado-Lado-Ángulo (LLA): Se usa Ley del Seno. Puede tener dos soluciones (caso ambiguo).";

        let ladoOpuesto = ladosRes[idxAng];
        let ladoAdyacente = ladosRes[ladosD.find(i => i !== idxAng)];
        let idxAdyacente = ladosD.find(i => i !== idxAng);

        const sinB = (ladoAdyacente * Math.sin(rad(angulosRes[idxAng]))) / ladoOpuesto;

        if (sinB > 1) {
          error = "❌ No hay solución: El seno calculado es mayor que 1, triángulo imposible.";
        } else {
          const B1 = deg(Math.asin(sinB));
          const C1 = 180 - angulosRes[idxAng] - B1;
          const c1 = (ladoOpuesto * Math.sin(rad(C1))) / Math.sin(rad(angulosRes[idxAng]));

          explicacion.textContent = `${caso}
Primera solución:
Ángulo opuesto ≈ ${B1.toFixed(2)}°
Ángulo restante ≈ ${C1.toFixed(2)}°
Lado faltante ≈ ${c1.toFixed(2)}
`;

          // Segunda posible solución si existe
          const B2 = 180 - B1;
          const C2 = 180 - angulosRes[idxAng] - B2;
          if (C2 > 0) {
            const c2 = (ladoOpuesto * Math.sin(rad(C2))) / Math.sin(rad(angulosRes[idxAng]));
            explicacion.textContent += `
Segunda solución:
Ángulo opuesto ≈ ${B2.toFixed(2)}°
Ángulo restante ≈ ${C2.toFixed(2)}°
Lado faltante ≈ ${c2.toFixed(2)}
`;
          }

          // Para mostrar resultados con la primera solución
          angulosRes[idxAdyacente] = B1;
          angulosRes[3 - idxAng - idxAdyacente] = C1;
          ladosRes[3 - idxAng - idxAdyacente] = c1;
        }
      }
    }
    // CASO ASA o AAS (2 ángulos y un lado)
    else if (numAng === 2 && numLados === 1) {
      caso = "Caso ASA/AAS: Se usa Ley del Seno para calcular lados y ángulo faltante.";
      // Completar ángulo faltante
      let angFaltanteIdx = angulosRes.findIndex(x => isNaN(x) || x === 0);
      angulosRes[angFaltanteIdx] = 180 - angulosRes.reduce((acc,x) => acc + (isNaN(x)?0:x), 0);

      // Encontrar lado dado y su índice
      let idxLadoDado = ladosRes.findIndex(x => !isNaN(x) && x > 0);

      // Calcular lados con Ley del Seno
      let ladoDado = ladosRes[idxLadoDado];
      let angLadoDado = angulosRes[idxLadoDado];
      for(let i=0; i<3; i++) {
        if (isNaN(ladosRes[i]) || ladosRes[i] === 0) {
          ladosRes[i] = (ladoDado * Math.sin(rad(angulosRes[i]))) / Math.sin(rad(angLadoDado));
        }
      }
    }
    else {
      error = "❌ No se detectó un caso válido o faltan datos necesarios.";
    }

    if (error) {
      explicacion.textContent = error;
      resultados.textContent = "";
      limpiarCanvas();
      return;
    }

    // Validar consistencia final: proporciones ley del seno
    // Comparar a/sin(A), b/sin(B), c/sin(C)
    const razon = ladosRes[0]/Math.sin(rad(angulosRes[0]));
    for(let i=1; i<3; i++) {
      if(!casiIgual(razon, ladosRes[i]/Math.sin(rad(angulosRes[i])))) {
        explicacion.textContent = "❌ Los datos ingresados son inconsistentes y no forman un triángulo válido.";
        resultados.textContent = "";
        limpiarCanvas();
        return;
      }
    }

    // Mostrar explicación y resultados
    explicacion.textContent = caso;
    resultados.textContent = 
      `Lados:\na = ${ladosRes[0].toFixed(2)}\nb = ${ladosRes[1].toFixed(2)}\nc = ${ladosRes[2].toFixed(2)}\n\n` +
      `Ángulos:\nA = ${angulosRes[0].toFixed(2)}°\nB = ${angulosRes[1].toFixed(2)}°\nC = ${angulosRes[2].toFixed(2)}°`;

    // Dibujo del triángulo simple (sin arcos ni etiquetas de ángulo)
    dibujarTriangulo(ctx, ladosRes[0], ladosRes[1], ladosRes[2], angulosRes[0], angulosRes[1], angulosRes[2]);

  });

  // Función para limpiar resultados y canvas
  function limpiar() {
    explicacion.textContent = "";
    resultados.textContent = "";
    limpiarCanvas();
  }

  function limpiarCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

function dibujarTriangulo(ctx, a, b, c, A, B, C) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.strokeStyle = "#007bff";
  ctx.lineWidth = 2;

  const padding = 40;
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;

  // Punto A en (0,0), punto B en (c,0), punto C con ley del coseno (ángulo C)
  const Ax = 0;
  const Ay = 0;

  const Bx = c;
  const By = 0;

  const angC_rad = (C * Math.PI) / 180;
  const Cx = b * Math.cos(angC_rad);
  const Cy = b * Math.sin(angC_rad);

  // Límites reales del triángulo (sin escalar)
  const minX = Math.min(Ax, Bx, Cx);
  const maxX = Math.max(Ax, Bx, Cx);
  const minY = Math.min(Ay, By, Cy);
  const maxY = Math.max(Ay, By, Cy);

  const triWidth = maxX - minX;
  const triHeight = maxY - minY;

  // Escala basada en ancho y alto reales
  const escala = Math.min(
    (canvasWidth - 2 * padding) / triWidth,
    (canvasHeight - 2 * padding) / triHeight
  );

  // Offsets para centrar
  const offsetX = padding + (canvasWidth - 2 * padding - triWidth * escala) / 2 - minX * escala;
  const offsetY = padding + (canvasHeight - 2 * padding - triHeight * escala) / 2 - minY * escala;

  // Coordenadas escaladas e invertidas en Y para el canvas
  const AX = Ax * escala + offsetX;
  const AY = canvasHeight - (Ay * escala + offsetY);

  const BX = Bx * escala + offsetX;
  const BY = canvasHeight - (By * escala + offsetY);

  const CX = Cx * escala + offsetX;
  const CY = canvasHeight - (Cy * escala + offsetY);

  // Dibujo
  ctx.beginPath();
  ctx.moveTo(AX, AY);
  ctx.lineTo(BX, BY);
  ctx.lineTo(CX, CY);
  ctx.closePath();
  ctx.stroke();

  // Etiquetas de lados (en puntos medios)
  ctx.fillStyle = "#333";
  ctx.font = "14px sans-serif";
  ctx.fillText(`a = ${a.toFixed(2)}`, (BX + CX) / 2, (BY + CY) / 2);
  ctx.fillText(`b = ${b.toFixed(2)}`, (AX + CX) / 2, (AY + CY) / 2);
  ctx.fillText(`c = ${c.toFixed(2)}`, (AX + BX) / 2, (AY + BY) / 2);
}

  // --- Implementación ajustarCanvas y redibujar ---
  function ajustarCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.width; // cuadrado
  }

  window.addEventListener('load', () => {
    ajustarCanvas();
    // Sólo redibujar si ya hay datos calculados válidos
    if (ladosRes.every(x => !isNaN(x)) && angulosRes.every(x => !isNaN(x))) {
      dibujarTriangulo(ctx, ladosRes[0], ladosRes[1], ladosRes[2], angulosRes[0], angulosRes[1], angulosRes[2]);
    }
  });

  window.addEventListener('resize', () => {
    ajustarCanvas();
    // Sólo redibujar si ya hay datos calculados válidos
    if (ladosRes.every(x => !isNaN(x)) && angulosRes.every(x => !isNaN(x))) {
      dibujarTriangulo(ctx, ladosRes[0], ladosRes[1], ladosRes[2], angulosRes[0], angulosRes[1], angulosRes[2]);
    }
  });
});

