// 1. CONFIGURACIÓN DE TU APP 

const firebaseConfig = {
    databaseURL: "https://ciudad-limpia-be2e9-default-rtdb.firebaseio.com/" 
};

// 2. CONSTRUCCIÓN DE LA URL FINAL
const API_URL = `${firebaseConfig.databaseURL}/reportes.json`;

// 3. CAPTURA DE ELEMENTOS DEL DOM
const reportForm = document.getElementById('reportForm');
const tipoSelect = document.getElementById('tipo');
const otroContainer = document.getElementById('otroContainer');
const otroDetalleInput = document.getElementById('otroDetalle');
const statusMsg = document.getElementById('status');
const btnEnviar = document.getElementById('btnEnviar');

// 4. LÓGICA PARA MOSTRAR "OTRO CASO"
tipoSelect.addEventListener('change', () => {
    if (tipoSelect.value === 'Otro') {
        otroContainer.style.display = 'block';
        otroDetalleInput.required = true;
    } else {
        otroContainer.style.display = 'none';
        otroDetalleInput.required = false;
    }
});

// 5. FUNCIÓN PARA ENVIAR DATOS (MÉTODO POST)
reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Feedback visual
    btnEnviar.disabled = true;
    btnEnviar.innerText = "Enviando reporte...";

    // Preparar el valor del tipo de reporte
    let tipoFinal = tipoSelect.value;
    if (tipoFinal === 'Otro') {
        tipoFinal = `Otro: ${otroDetalleInput.value}`;
    }

    // Objeto JSON a enviar
    const nuevoReporte = {
        usuario: document.getElementById('usuario').value,
        tipo: tipoFinal,
        ubicacion: document.getElementById('ubicacion').value,
        descripcion: document.getElementById('descripcion').value,
        estado: "Pendiente",
        fecha: new Date().toLocaleString()
    };

    try {
        // Petición HTTP POST
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevoReporte)
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Éxito, ID generado:", data.name);
            
            statusMsg.innerHTML = "✅ ¡Reporte enviado! Tu folio es: " + data.name;
            statusMsg.style.color = "#2d5a27";
            reportForm.reset();
            otroContainer.style.display = 'none';
        } else {
            throw new Error("Error en la respuesta del servidor");
        }
    } catch (error) {
        console.error("Error:", error);
        statusMsg.innerHTML = "❌ No se pudo enviar el reporte. Revisa la consola.";
        statusMsg.style.color = "red";
    } finally {
        btnEnviar.disabled = false;
        btnEnviar.innerText = "Enviar Reporte";
    }
});