document.addEventListener("DOMContentLoaded", () => {
  const montoInput = document.getElementById("monto");
  const resultadoEl = document.getElementById("resultado");
  const costoEnvioEl = document.getElementById("costoEnvio");
  const montoConvertirEl = document.getElementById("montoConvertir");
  const tipoCambioEl = document.getElementById("tipoCambio");
  const fechaEntregaEl = document.getElementById("fechaEntrega");

  // Fecha estimada de entrega
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 1);
  fechaEntregaEl.textContent = fecha.toLocaleDateString("es-ES", { day: "numeric", month: "long" });

  // Calcular conversión
  montoInput.addEventListener("input", async () => {
    const monto = parseFloat(montoInput.value);

    if (isNaN(monto) || monto < 10000) {
      resultadoEl.textContent = "Monto mínimo: 10,000 COP";
      costoEnvioEl.textContent = "-";
      montoConvertirEl.textContent = "-";
      tipoCambioEl.textContent = "-";
      return;
    }

    try {
      const res = await fetch("/api/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto })
      });

      const data = await res.json();

      if (!res.ok) {
        resultadoEl.textContent = data.error || "Error en la conversión";
        return;
      }

      const { monto_neto, tasa, resultado_ves } = data;

      costoEnvioEl.textContent = (monto - monto_neto).toLocaleString("es-CO", { style: "currency", currency: "COP" });
      montoConvertirEl.textContent = monto_neto.toLocaleString("es-CO", { style: "currency", currency: "COP" });
      resultadoEl.textContent = `${resultado_ves.toFixed(2)} VES`;
      tipoCambioEl.textContent = `1 COP = ${tasa.toFixed(6)} VES`;

    } catch {
      resultadoEl.textContent = "Error de servidor";
    }
  });

  // Vista previa comprobante
  document.getElementById("comprobante").addEventListener("change", function (e) {
    const file = e.target.files[0];
    const preview = document.getElementById("preview");
    preview.innerHTML = '';

    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const img = document.createElement('img');
        img.src = event.target.result;
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  });

  // Enviar datos + comprobante
  document.getElementById("formulario-transferencia").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const res = await fetch("/api/comprobante", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Transacción enviada con éxito");
        e.target.reset();
        document.getElementById("preview").innerHTML = "";
        closeModal(document.getElementById("modal"));
      } else {
        alert("❌ Error: " + data.error);
      }
    } catch {
      alert("❌ Fallo de red o servidor");
    }
  });

  // Abrir/Cerrar menú móvil
  const menuToggle = document.getElementById("menu-toggle");
  const navMenu = document.getElementById("nav-menu");
  const navLinks = document.querySelectorAll('#nav-menu a');

  menuToggle.addEventListener("click", () => navMenu.classList.toggle("active"));
  navLinks.forEach(link => link.addEventListener("click", () => navMenu.classList.remove("active")));

  // Botones para abrir/cerrar modales
  document.querySelectorAll("[data-open-modal]").forEach(btn => {
    btn.addEventListener("click", () => {
      const modal = document.getElementById(btn.dataset.openModal);
      openModal(modal);
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach(btn => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal");
      closeModal(modal);
    });
  });
});

// Funciones modales con animación de rebote
function openModal(modal) {
  modal.classList.add("show");
  modal.classList.remove("closing");
}

function closeModal(modal) {
  modal.classList.add("closing");
  setTimeout(() => {
    modal.classList.remove("show", "closing");
  }, 300); // Duración igual al CSS de salida
}

// Campos dinámicos para Venezuela
function mostrarCamposBanco() {
  const banco = document.getElementById("bancoVe").value;
  const contenedor = document.getElementById("contenedorCamposBanco");

  if (banco === "banesco" || banco === "venezuela") {
    contenedor.innerHTML = `<input type="number" id="numeroCuenta" name="cuenta" placeholder="Número de cuenta" required />`;
  } else if (banco === "pagoMovil") {
    contenedor.innerHTML = `
      <input type="number" id="telefonoPagoMovil" name="telefono" placeholder="Teléfono (pago móvil)" required />
      <input type="number" id="cedulaReceptor" name="cedula" placeholder="Cédula" required />
      <select id="bancoReceptor" name="banco_receptor" required>
        <option value="" disabled selected>Seleccione tipo de banco</option>
        <option value="Mercantil">Mercantil</option>
        <option value="Banesco">Banesco</option>
        <option value="Venezuela">Banco de Venezuela</option>
        <option value="Provincial">Provincial</option>
        <option value="Tesoro">Banco del Tesoro</option>
        <option value="Otro">Otro</option>
      </select>
      <input type="text" id="bancoOtro" name="banco_otro" placeholder="Nombre del banco" style="display: none; margin-top: 8px;" />
    `;
    document.getElementById("bancoReceptor").addEventListener("change", function () {
      const bancoOtro = document.getElementById("bancoOtro");
      bancoOtro.style.display = this.value === "Otro" ? "block" : "none";
      bancoOtro.required = this.value === "Otro";
    });
  } else {
    contenedor.innerHTML = "";
  }
}

// Campos dinámicos para Colombia
function actualizarCamposBancoCO() {
  const tipo = document.getElementById("bancoCo").value;
  const contenedor = document.getElementById("camposCO");
  contenedor.innerHTML = "";

  const cuentas = {
    nequi: "NEQUI - 3506463582",
    daviplata: "DAVIPLATA - No disponible",
    bancolombia: "Cuenta Bancolombia: No disponible",
    qr: `<img src="https://fakeimg.pl/250x250/?text=QR" alt="Código QR de pago">`
  };

  contenedor.innerHTML = `<div>${cuentas[tipo] || ""}</div>`;
}

// Efecto máquina de escribir
const texto = 'TRANSFERENCIAS A VENEZUELA';
let i = 0;
function typeWriter() {
  if (i < texto.length) {
    document.getElementById("typewriter").innerHTML += texto.charAt(i);
    i++;
    setTimeout(typeWriter, 50);
  }
}
window.onload = typeWriter;
