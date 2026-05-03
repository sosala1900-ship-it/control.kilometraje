// App.jsx — versión PRO con kilometraje y horas complementarias + acceso protegido
import { useEffect, useMemo, useState } from "react";

const API_URL =
  "https://script.google.com/macros/s/AKfycbzEWeK1VVLAWXknILQZxoY8I-AfauaWKpKUDYtWaTPw12LrnmxNKgHk_lw_uZMpbDaBIg/exec";

const ACCESS_PASSWORD = "imagine2026";
const ACCESS_STORAGE_KEY = "km_app_access_ok";

const PRECIO_KM = 0.26;
const REGISTROS_POR_PAGINA = 20;

const meses = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const proyectos = [
  { id: "22_100", nombre: "22_100 MASCAREÑO", activo: true },
  { id: "24_0010", nombre: "24_0010 ETJII", activo: true },
  { id: "24_015", nombre: "24_015 CABINMERS II", activo: true },
  { id: "24_077", nombre: "24_077 CANEDUCA", activo: true },
  { id: "25_008", nombre: "25_008 URSUPARTI", activo: true },
  { id: "25_030", nombre: "25_030 SANTICAMP", activo: true },
  { id: "24_085", nombre: "24_085 GRANAPARTI", activo: true },
  { id: "24_117", nombre: "24_117 PIALTE 24 LOTE 5", activo: true },
  { id: "25_027", nombre: "25_027 ISOARTE", activo: true },
  { id: "25_039", nombre: "25_039 BITACORAS 3", activo: true },
  { id: "25_033", nombre: "25_033 SINPROMI", activo: true },
  { id: "25_041", nombre: "25_041 ARRAIGO", activo: true },
  { id: "25_034", nombre: "25_034 CANDELARIA PUNTA LARGA", activo: true },
  { id: "VENTAS", nombre: "VENTAS", activo: true },
];

const tabs = [
  { id: "dashboard", label: "Dashboard" },
  { id: "registro", label: "Nuevo registro" },
  { id: "horas", label: "Horas complementarias" },
  { id: "informe", label: "Informe mensual" },
  { id: "acumulado", label: "Acumulado por proyecto" },
  { id: "historico", label: "Histórico" },
  { id: "proyectos", label: "Proyectos" },
  { id: "empleados", label: "Empleados" },
];

function cargarDatosJsonp() {
  return new Promise((resolve, reject) => {
    const callbackName = "cb_" + Date.now();
    const script = document.createElement("script");

    window[callbackName] = function (data) {
      delete window[callbackName];
      document.body.removeChild(script);
      resolve(data);
    };

    script.src = API_URL + "?callback=" + callbackName + "&t=" + Date.now();

    script.onerror = function (err) {
      console.error("ERROR JSONP:", err);
      delete window[callbackName];
      document.body.removeChild(script);
      reject(new Error("No se pudieron cargar los datos"));
    };

    console.log("Cargando script:", script.src);
    document.body.appendChild(script);
  });
}

function euros(valor) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(Number(valor) || 0);
}

function numero(valor) {
  return new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(Number(valor) || 0);
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getColorProyecto(proyectoId) {
  const colores = {
    "22_100": "#dbeafe",
    "24_0010": "#dcfce7",
    "24_015": "#ffedd5",
    "24_077": "#f3e8ff",
    "25_008": "#fef9c3",
    "25_030": "#fee2e2",
    "24_085": "#ccfbf1",
    "24_117": "#e0e7ff",
    "25_027": "#fce7f3",
    "25_039": "#ecfccb",
    "25_033": "#cffafe",
    "25_041": "#ffe4e6",
    "25_034": "#d1fae5",
    VENTAS: "#e2e8f0",
  };
  return colores[proyectoId] || "#e5e7eb";
}

function getTextoColorProyecto(proyectoId) {
  const coloresTexto = {
    "22_100": "#1e3a8a",
    "24_0010": "#166534",
    "24_015": "#9a3412",
    "24_077": "#6b21a8",
    "25_008": "#854d0e",
    "25_030": "#991b1b",
    "24_085": "#115e59",
    "24_117": "#3730a3",
    "25_027": "#9d174d",
    "25_039": "#3f6212",
    "25_033": "#155e75",
    "25_041": "#9f1239",
    "25_034": "#065f46",
    VENTAS: "#334155",
  };
  return coloresTexto[proyectoId] || "#374151";
}

function ProjectBadge({ proyectoId, proyecto }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        maxWidth: 320,
        background: getColorProyecto(proyectoId),
        color: getTextoColorProyecto(proyectoId),
        padding: "5px 9px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: "0.1px",
        lineHeight: 1.25,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        boxShadow: "0 1px 4px rgba(15, 23, 42, 0.06)",
      }}
      title={proyecto}
    >
      {proyecto || "Sin proyecto"}
    </span>
  );
}

function getMonth(fecha) {
  if (!fecha) return "";
  const texto = String(fecha);
  if (texto.includes("T")) {
    const d = new Date(texto);
    return String(d.getMonth() + 1).padStart(2, "0");
  }
  if (texto.includes("-")) return texto.slice(5, 7);
  if (texto.includes("/")) return texto.split("/")[1]?.padStart(2, "0") || "";
  return "";
}

function getYear(fecha) {
  if (!fecha) return "";
  const texto = String(fecha);
  if (texto.includes("T")) {
    const d = new Date(texto);
    return String(d.getFullYear());
  }
  if (texto.includes("-")) return texto.slice(0, 4);
  if (texto.includes("/")) return texto.split("/")[2] || "";
  return "";
}

function formatDate(fecha) {
  if (!fecha) return "";
  try {
    const texto = String(fecha);
    if (texto.includes("T")) {
      const d = new Date(texto);
      const dia = String(d.getDate()).padStart(2, "0");
      const mes = String(d.getMonth() + 1).padStart(2, "0");
      const anio = d.getFullYear();
      return `${dia}/${mes}/${anio}`;
    }
    if (texto.includes("/")) return texto;
    if (texto.includes("-")) {
      const [year, month, day] = texto.split("-");
      return `${day}/${month}/${year}`;
    }
    return texto;
  } catch {
    return fecha;
  }
}

function fechaParaInput(fecha) {
  if (!fecha) return "";
  try {
    const texto = String(fecha);
    if (texto.includes("T")) {
      const d = new Date(texto);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    if (texto.includes("/")) {
      const [day, month, year] = texto.split("/");
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    if (texto.includes("-")) return texto.slice(0, 10);
    return "";
  } catch {
    return "";
  }
}

function normalizarRegistro(row, index) {
  return {
    id: index + 1,
    idRegistro: row["ID_REGISTRO"] || row["idRegistro"] || "",
    fecha: row["FECHA"] || "",
    empleadoId: row["EMPLEADO ID"] || "",
    empleado: row["EMPLEADO"] || "",
    proyectoId: row["PROYECTO ID"] || "",
    proyecto: row["PROYECTO"] || "",
    origen: row["ORIGEN"] || "",
    destino: row["DESTINO"] || "",
    km: Number(row["KM"]) || 0,
    observaciones: row["OBSERVACIONES"] || "",
    precioKm: Number(row["PRECIO_KM"]) || PRECIO_KM,
    importe: Number(row["IMPORTE"]) || 0,
  };
}

function normalizarHora(row, index) {
  return {
    id: index + 1,
    idRegistro: row["ID_REGISTRO"] || row["idRegistro"] || "",
    fecha: row["FECHA"] || "",
    empleadoId: row["EMPLEADO ID"] || "",
    empleado: row["EMPLEADO"] || "",
    proyectoId: row["PROYECTO ID"] || "",
    proyecto: row["PROYECTO"] || "",
    horas: Number(row["HORAS"]) || 0,
    observaciones: row["OBSERVACIONES"] || "",
  };
}

function esActivo(valor) {
  if (valor === true) return true;
  const normalizado = String(valor ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  return normalizado === "SI";
}

function normalizarProyecto(row) {
  return {
    id: row["ID PROYECTO"] || row["PROYECTO ID"] || row["id"] || "",
    nombre: row["NOMBRE PROYECTO"] || row["PROYECTO"] || row["nombre"] || "",
    activo: esActivo(row["ACTIVO"]),
  };
}

function parseNumero(valor, fallback = 0) {
  if (valor === null || valor === undefined || valor === "") return fallback;
  const limpio = String(valor).replace("€", "").replace(",", ".").trim();
  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : fallback;
}

function normalizarEmpleado(row) {
  return {
    id: row["ID"] || row["EMPLEADO ID"] || row["id"] || "",
    nombre: row["NOMBRE"] || row["EMPLEADO"] || row["nombre"] || "",
    email: row["EMAIL"] || "",
    rol: row["ROL"] || "",
    precioKm: parseNumero(row["€/KM"], PRECIO_KM),
    activo: esActivo(row["ACTIVO"]),
  };
}

function calcularTotales(registros) {
  return registros.reduce(
    (acc, r) => {
      acc.km += Number(r.km || 0);
      acc.importe += Number(r.importe || 0);
      acc.registros += 1;
      return acc;
    },
    { km: 0, importe: 0, registros: 0 }
  );
}

function agruparPorEmpleado(registros) {
  const map = {};
  registros.forEach((r) => {
    const key = r.empleadoId || r.empleado || "SIN EMPLEADO";
    if (!map[key]) {
      map[key] = { empleado: r.empleado || key, km: 0, importe: 0, registros: 0 };
    }
    map[key].km += Number(r.km || 0);
    map[key].importe += Number(r.importe || 0);
    map[key].registros += 1;
  });
  return Object.values(map).sort((a, b) => b.km - a.km);
}

function agruparPorProyecto(registros) {
  const map = {};
  registros.forEach((r) => {
    const key = r.proyectoId || r.proyecto || "SIN PROYECTO";
    if (!map[key]) {
      map[key] = {
        proyectoId: r.proyectoId || key,
        proyecto: r.proyecto || key,
        km: 0,
        importe: 0,
        registros: 0,
      };
    }
    map[key].km += Number(r.km || 0);
    map[key].importe += Number(r.importe || 0);
    map[key].registros += 1;
  });
  return Object.values(map).sort((a, b) => b.km - a.km);
}

export default function App() {
  const hoy = new Date();

  const [accesoAutorizado, setAccesoAutorizado] = useState(() => {
    try {
      return localStorage.getItem(ACCESS_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [passwordAcceso, setPasswordAcceso] = useState("");
  const [errorAcceso, setErrorAcceso] = useState("");

  const [tab, setTab] = useState("dashboard");
  const [registros, setRegistros] = useState([]);
  const [horasComplementarias, setHorasComplementarias] = useState([]);
  const [proyectosApp, setProyectosApp] = useState(proyectos);
  const [empleadosApp, setEmpleadosApp] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState("");
  const [registroEditando, setRegistroEditando] = useState(null);
  const [actualizando, setActualizando] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);

  const [mes, setMes] = useState(String(hoy.getMonth() + 1).padStart(2, "0"));
  const [anio, setAnio] = useState(String(hoy.getFullYear()));
  const [paginaHistorico, setPaginaHistorico] = useState(1);

  const [filtrosHistorico, setFiltrosHistorico] = useState({
    mes: "",
    anio: "",
    empleadoId: "",
    proyectoId: "",
  });

  const [form, setForm] = useState({
    fecha: "",
    empleadoId: "",
    proyectoId: "",
    origen: "",
    destino: "",
    km: "",
    observaciones: "",
  });

  const [formHoras, setFormHoras] = useState({
    fecha: "",
    empleadoId: "",
    proyectoId: "",
    horas: "",
    observaciones: "",
  });

  const empleadoSeleccionado = empleadosApp.find((e) => e.id === form.empleadoId);
  const precioKmAplicado = empleadoSeleccionado ? empleadoSeleccionado.precioKm || PRECIO_KM : PRECIO_KM;
  const importe = form.km ? Number(form.km || 0) * precioKmAplicado : 0;

  useEffect(() => {
    if (accesoAutorizado) cargarDatos();
  }, [accesoAutorizado]);

  function accederApp(e) {
    e.preventDefault();
    if (passwordAcceso.trim() !== ACCESS_PASSWORD) {
      setErrorAcceso("Contraseña incorrecta.");
      return;
    }
    try {
      localStorage.setItem(ACCESS_STORAGE_KEY, "true");
    } catch {}
    setErrorAcceso("");
    setPasswordAcceso("");
    setAccesoAutorizado(true);
  }

  function cerrarSesion() {
    try {
      localStorage.removeItem(ACCESS_STORAGE_KEY);
    } catch {}
    setAccesoAutorizado(false);
    setPasswordAcceso("");
    setErrorAcceso("");
    setMensaje("");
  }

  async function cargarDatos() {
    try {
      setCargando(true);
      setMensaje("Cargando datos del Sheet...");

      const data = await cargarDatosJsonp();
      const registrosSheet = Array.isArray(data) ? data : data?.registros || [];
      const horasSheet = Array.isArray(data?.horas) ? data.horas : [];
      const proyectosSheet = Array.isArray(data?.proyectos) ? data.proyectos : [];
      const empleadosSheet = Array.isArray(data?.empleados) ? data.empleados : [];

      const normalizados = registrosSheet
        .map((row, index) => normalizarRegistro(row, index))
        .filter((r) => r.fecha || r.empleado || r.proyecto || r.km);

      const horasNormalizadas = horasSheet
        .map((row, index) => normalizarHora(row, index))
        .filter((r) => r.fecha || r.empleado || r.proyecto || r.horas);

      if (proyectosSheet.length > 0) {
        const proyectosNormalizados = proyectosSheet
          .map(normalizarProyecto)
          .filter((p) => p.id && p.nombre);
        if (proyectosNormalizados.length > 0) setProyectosApp(proyectosNormalizados);
      }

      if (empleadosSheet.length > 0) {
        const empleadosNormalizados = empleadosSheet
          .map(normalizarEmpleado)
          .filter((e) => e.id && e.nombre && esActivo(e.activo));
        setEmpleadosApp(empleadosNormalizados);
      }

      setRegistros(normalizados.reverse());
      setHorasComplementarias(horasNormalizadas.reverse());
      setMensaje("Datos cargados: " + normalizados.length + " registros de kilometraje y " + horasNormalizadas.length + " registros de horas.");
    } catch (error) {
      console.error(error);
      setMensaje("No se pudieron cargar los datos del Sheet.");
    } finally {
      setCargando(false);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleHorasChange(e) {
    setFormHoras({ ...formHoras, [e.target.name]: e.target.value });
  }

  async function guardarHoras() {
    const horas = parseNumero(formHoras.horas, 0);
    if (!formHoras.fecha || !formHoras.empleadoId || !formHoras.proyectoId || horas <= 0) {
      setMensaje("Completa fecha, empleado, proyecto y horas. Las horas deben ser mayores que 0.");
      return;
    }

    const empleado = empleadosApp.find((e) => e.id === formHoras.empleadoId);
    const proyecto = proyectosApp.find((p) => p.id === formHoras.proyectoId);
    const idTemporal = "hr_tmp_" + Date.now();

    const nuevo = {
      tipo: "horas",
      fecha: formHoras.fecha,
      empleadoId: formHoras.empleadoId,
      empleado: empleado?.nombre || "",
      proyectoId: formHoras.proyectoId,
      proyecto: proyecto?.nombre || "",
      horas,
      observaciones: formHoras.observaciones,
    };

    try {
      setGuardando(true);
      setMensaje("Guardando horas complementarias en Google Sheets...");
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(nuevo),
      });

      setHorasComplementarias((prev) => [
        {
          id: idTemporal,
          idRegistro: idTemporal,
          fecha: nuevo.fecha,
          empleadoId: nuevo.empleadoId,
          empleado: nuevo.empleado,
          proyectoId: nuevo.proyectoId,
          proyecto: nuevo.proyecto,
          horas: nuevo.horas,
          observaciones: nuevo.observaciones,
        },
        ...prev,
      ]);

      setFormHoras({ fecha: "", empleadoId: "", proyectoId: "", horas: "", observaciones: "" });
      setMensaje("Horas complementarias guardadas correctamente.");
      cargarDatos();
    } catch (error) {
      console.error(error);
      setMensaje("Error al guardar las horas complementarias.");
    } finally {
      setGuardando(false);
    }
  }

  async function guardar() {
    if (!form.fecha || !form.empleadoId || !form.proyectoId || !form.origen || !form.destino || !form.km) {
      setMensaje("Completa fecha, empleado, proyecto, origen, destino y km.");
      return;
    }

    const empleado = empleadosApp.find((e) => e.id === form.empleadoId);
    const proyecto = proyectosApp.find((p) => p.id === form.proyectoId);
    const km = Number(form.km);
    const precioKm = empleado?.precioKm || PRECIO_KM;
    const importe = km * precioKm;

    const nuevo = {
      fecha: form.fecha,
      empleadoId: form.empleadoId,
      empleado: empleado?.nombre || "",
      proyectoId: form.proyectoId,
      proyecto: proyecto?.nombre || "",
      origen: form.origen,
      destino: form.destino,
      km,
      observaciones: form.observaciones,
      precioKm,
      importe,
    };

    try {
      if (registroEditando?.idRegistro) {
        setActualizando(true);
        setMensaje("Actualizando registro en Google Sheets...");
        await fetch(API_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "update", idRegistro: registroEditando.idRegistro, ...nuevo }),
        });

        setRegistros((prev) =>
          prev.map((r) =>
            r.idRegistro === registroEditando.idRegistro ? { ...r, ...nuevo, idRegistro: registroEditando.idRegistro } : r
          )
        );

        setRegistroEditando(null);
        setMensaje("Registro actualizado correctamente.");
        cargarDatos();
      } else {
        setGuardando(true);
        setMensaje("Guardando en Google Sheets...");
        await fetch(API_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(nuevo),
        });
        setRegistros([{ id: Date.now(), ...nuevo }, ...registros]);
        setMensaje("Registro guardado correctamente.");
      }

      setForm({ fecha: "", empleadoId: "", proyectoId: "", origen: "", destino: "", km: "", observaciones: "" });
      setTab("dashboard");
    } catch (error) {
      console.error(error);
      setMensaje(registroEditando ? "Error al actualizar el registro." : "Error al guardar el registro.");
    } finally {
      setGuardando(false);
      setActualizando(false);
    }
  }

  function editarRegistro(registro) {
    if (!registro.idRegistro) {
      setMensaje("Este registro no tiene ID_REGISTRO y no se puede editar.");
      return;
    }
    setRegistroEditando(registro);
    setForm({
      fecha: fechaParaInput(registro.fecha),
      empleadoId: registro.empleadoId || "",
      proyectoId: registro.proyectoId || "",
      origen: registro.origen || "",
      destino: registro.destino || "",
      km: registro.km || "",
      observaciones: registro.observaciones || "",
    });
    setTab("registro");
    setMensaje("Editando registro. Modifica los datos y pulsa Actualizar kilometraje.");
  }

  function cancelarEdicion(e) {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setRegistroEditando(null);
    setForm({ fecha: "", empleadoId: "", proyectoId: "", origen: "", destino: "", km: "", observaciones: "" });
    setMensaje("Edición cancelada. Has vuelto al histórico.");
    setPaginaHistorico(1);
    setTab("historico");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function eliminarRegistro(idRegistro) {
    if (!idRegistro) {
      setMensaje("Este registro no tiene ID_REGISTRO y no se puede eliminar.");
      return;
    }
    const confirmar = window.confirm("¿Seguro que quieres eliminar este registro? Esta acción no se puede deshacer.");
    if (!confirmar) return;

    try {
      setEliminandoId(idRegistro);
      setMensaje("Eliminando registro...");
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "delete", idRegistro }),
      });
      setRegistros((prev) => prev.filter((r) => r.idRegistro !== idRegistro));
      setMensaje("Registro eliminado correctamente.");
      cargarDatos();
    } catch (error) {
      console.error(error);
      setMensaje("Error al eliminar el registro.");
    } finally {
      setEliminandoId("");
    }
  }

  function cambiarFiltroHistorico(nombre, valor) {
    setFiltrosHistorico((prev) => ({ ...prev, [nombre]: valor }));
    setPaginaHistorico(1);
  }

  function limpiarFiltrosHistorico() {
    setFiltrosHistorico({ mes: "", anio: "", empleadoId: "", proyectoId: "" });
    setPaginaHistorico(1);
  }

  function getNombreMesSeleccionado() {
    return meses.find((m) => m.value === mes)?.label || mes;
  }

  function imprimirInformeAsesoria() {
    const nombreMes = getNombreMesSeleccionado();
    const filas = informeAsesoria
      .map((r) => `<tr><td>${escapeHtml(r.empleado)}</td><td class="importe">${escapeHtml(euros(r.importe))}</td></tr>`)
      .join("");
    const total = informeAsesoria.reduce((acc, r) => acc + Number(r.importe || 0), 0);

    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8" /><title>Informe asesoría - ${escapeHtml(nombreMes)} ${escapeHtml(anio)}</title><style>*{box-sizing:border-box}body{margin:0;padding:32px;font-family:Arial,sans-serif;color:#0f172a;background:#fff}.documento{max-width:760px;margin:0 auto}.encabezado{border-bottom:2px solid #0f172a;padding-bottom:16px;margin-bottom:24px}h1{margin:0;font-size:22px;letter-spacing:.3px}.subtitulo{margin-top:8px;color:#475569;font-size:14px}table{width:100%;border-collapse:collapse;margin-top:18px;font-size:14px}th{text-align:left;background:#f1f5f9;border-bottom:1px solid #cbd5e1;padding:11px 10px;text-transform:uppercase;font-size:12px;letter-spacing:.3px}td{border-bottom:1px solid #e2e8f0;padding:11px 10px}.importe{text-align:right;font-weight:700}.total td{border-top:2px solid #0f172a;border-bottom:none;font-weight:800;background:#f8fafc}.nota{margin-top:18px;font-size:12px;color:#64748b}.acciones{display:flex;justify-content:flex-end;gap:10px;margin-bottom:20px}button{border:none;border-radius:10px;padding:10px 14px;font-weight:500;cursor:pointer;background:#d1fae5;color:#065f46;border:1px solid #a7f3d0}@media print{body{padding:0}.acciones{display:none}.documento{max-width:none}}</style></head><body><div class="documento"><div class="acciones"><button onclick="window.print()">Imprimir / guardar como PDF</button></div><div class="encabezado"><h1>FUNDACIÓN CANARIA IMAGINE 2050</h1><div class="subtitulo">Informe mensual para asesoría · ${escapeHtml(nombreMes)} ${escapeHtml(anio)}</div></div><table><thead><tr><th>Empleado</th><th style="text-align:right;">Importe</th></tr></thead><tbody>${filas || `<tr><td colspan="2">No hay empleados con importe mayor que 0 en este periodo.</td></tr>`}<tr class="total"><td>Total</td><td class="importe">${escapeHtml(euros(total))}</td></tr></tbody></table><div class="nota">Documento generado desde la app interna de control de kilometraje.</div></div><script>window.onload=function(){window.focus();window.print();};</script></body></html>`;

    const ventana = window.open("", "_blank", "width=900,height=700");
    if (!ventana) {
      setMensaje("El navegador ha bloqueado la ventana de impresión. Permite ventanas emergentes para esta app.");
      return;
    }
    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
  }

  const registrosMes = useMemo(() => registros.filter((r) => getMonth(r.fecha) === mes && getYear(r.fecha) === anio), [registros, mes, anio]);
  const horasMes = useMemo(() => horasComplementarias.filter((r) => getMonth(r.fecha) === mes && getYear(r.fecha) === anio), [horasComplementarias, mes, anio]);
  const totalHorasMes = useMemo(() => horasMes.reduce((acc, r) => acc + Number(r.horas || 0), 0), [horasMes]);

  const horasPorEmpleadoMes = useMemo(() => {
    const map = {};
    horasMes.forEach((r) => {
      const key = r.empleadoId || r.empleado || "SIN EMPLEADO";
      if (!map[key]) map[key] = { empleado: r.empleado || key, horas: 0, registros: 0 };
      map[key].horas += Number(r.horas || 0);
      map[key].registros += 1;
    });
    return Object.values(map).sort((a, b) => b.horas - a.horas);
  }, [horasMes]);

  const horasPorProyectoMes = useMemo(() => {
    const map = {};
    horasMes.forEach((r) => {
      const key = r.proyectoId || r.proyecto || "SIN PROYECTO";
      if (!map[key]) map[key] = { proyectoId: r.proyectoId || key, proyecto: r.proyecto || key, horas: 0, registros: 0 };
      map[key].horas += Number(r.horas || 0);
      map[key].registros += 1;
    });
    return Object.values(map).sort((a, b) => b.horas - a.horas);
  }, [horasMes]);

  const ultimasHoras = useMemo(() => horasComplementarias.slice(0, 8), [horasComplementarias]);
  const totalesMes = useMemo(() => calcularTotales(registrosMes), [registrosMes]);
  const porEmpleadoMes = useMemo(() => agruparPorEmpleado(registrosMes), [registrosMes]);
  const informeAsesoria = useMemo(() => porEmpleadoMes.filter((r) => Number(r.importe || 0) > 0), [porEmpleadoMes]);
  const porProyectoMes = useMemo(() => agruparPorProyecto(registrosMes), [registrosMes]);
  const acumuladoPorProyecto = useMemo(() => agruparPorProyecto(registros), [registros]);

  const historicoFiltrado = useMemo(() => {
    return registros.filter((r) => {
      if (filtrosHistorico.mes && getMonth(r.fecha) !== filtrosHistorico.mes) return false;
      if (filtrosHistorico.anio && getYear(r.fecha) !== filtrosHistorico.anio) return false;
      if (filtrosHistorico.empleadoId && r.empleadoId !== filtrosHistorico.empleadoId) return false;
      if (filtrosHistorico.proyectoId && r.proyectoId !== filtrosHistorico.proyectoId) return false;
      return true;
    });
  }, [registros, filtrosHistorico]);

  const totalPaginasHistorico = Math.max(1, Math.ceil(historicoFiltrado.length / REGISTROS_POR_PAGINA));
  const registrosHistoricoPagina = useMemo(() => {
    const inicio = (paginaHistorico - 1) * REGISTROS_POR_PAGINA;
    return historicoFiltrado.slice(inicio, inicio + REGISTROS_POR_PAGINA);
  }, [historicoFiltrado, paginaHistorico]);

  if (!accesoAutorizado) {
    return (
      <div style={loginPageStyle}>
        <form onSubmit={accederApp} style={loginCardStyle}>
          <div style={loginIconStyle}>🔒</div>
          <h1 style={loginTitleStyle}>Control de Kilometraje</h1>
          <p style={loginSubtitleStyle}>Introduce la contraseña para acceder a la app interna.</p>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Contraseña</span>
            <input
              type="password"
              value={passwordAcceso}
              onChange={(e) => {
                setPasswordAcceso(e.target.value);
                setErrorAcceso("");
              }}
              placeholder="Contraseña de acceso"
              autoFocus
              style={loginInputStyle}
            />
          </label>
          {errorAcceso && <div style={loginErrorStyle}>{errorAcceso}</div>}
          <button type="submit" style={loginButtonStyle}>Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={{ margin: "0", fontSize: 34, letterSpacing: -0.5 }}>Control de Kilometraje</h1>
            <p style={{ color: "#64748b", marginTop: 6 }}>Dashboard mensual, histórico y control acumulado por proyecto.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button onClick={cargarDatos} disabled={cargando} onMouseEnter={() => setHoveredButton("actualizar")} onMouseLeave={() => setHoveredButton(null)} style={buttonStyle(false, "actualizar", hoveredButton)}>
              {cargando ? "Cargando..." : "Actualizar datos"}
            </button>
            <button onClick={cerrarSesion} onMouseEnter={() => setHoveredButton("cerrar-sesion")} onMouseLeave={() => setHoveredButton(null)} style={secondaryButtonStyle("cerrar-sesion", hoveredButton)}>
              Cerrar acceso
            </button>
          </div>
        </header>

        <nav style={navStyle}>
          {tabs.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} onMouseEnter={() => setHoveredButton(item.id)} onMouseLeave={() => setHoveredButton(null)} style={buttonStyle(tab === item.id, item.id, hoveredButton)}>
              {item.label}
            </button>
          ))}
        </nav>

        {mensaje && <div style={messageStyle}>{mensaje}</div>}

        {(tab === "dashboard" || tab === "informe" || tab === "horas") && (
          <Box title="Periodo de trabajo">
            <div style={periodControlsStyle}>
              <div style={{ width: 180 }}>
                <Field label="Mes">
                  <select value={mes} onChange={(e) => setMes(e.target.value)} style={compactInputStyle}>
                    {meses.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </Field>
              </div>
              <div style={{ width: 120 }}>
                <Field label="Año">
                  <select value={anio} onChange={(e) => setAnio(e.target.value)} style={compactInputStyle}>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                  </select>
                </Field>
              </div>
            </div>
          </Box>
        )}

        {tab === "dashboard" && (
          <>
            <div style={cardsGridStyle}>
              <Card title="Registros del mes" value={totalesMes.registros} accent="#bfdbfe" />
              <Card title="Km del mes" value={`${numero(totalesMes.km)} km`} accent="#ccfbf1" />
              <Card title="Importe del mes" value={euros(totalesMes.importe)} accent="#fed7aa" />
            </div>
            <div style={twoColumnsStyle}>
              <Box title="Resumen mensual por proyecto">
                <Table headers={["Proyecto", "Km", "Importe", "Registros"]} rows={porProyectoMes.map((r) => [<ProjectBadge key={r.proyectoId} proyectoId={r.proyectoId} proyecto={r.proyecto} />, numero(r.km), euros(r.importe), r.registros])} />
              </Box>
              <Box title="Resumen mensual por empleado">
                <Table headers={["Empleado", "Km", "Importe", "Registros"]} rows={porEmpleadoMes.map((r) => [r.empleado, numero(r.km), euros(r.importe), r.registros])} />
              </Box>
            </div>
          </>
        )}

        {tab === "registro" && (
          <Box title={registroEditando ? "Editar registro de kilometraje" : "Nuevo registro de kilometraje"}>
            {registroEditando && <div style={editNoticeStyle}>Estás editando un registro existente. Al actualizar, se modificará la fila correspondiente en Google Sheets.</div>}
            <div style={registroFormGridStyle}>
              <div style={registroTwoColumnsStyle}>
                <Field label="Fecha"><input type="date" name="fecha" value={form.fecha} onChange={handleChange} style={compactInputStyle} /></Field>
                <Field label="Empleado"><select name="empleadoId" value={form.empleadoId} onChange={handleChange} style={compactInputStyle}><option value="">Selecciona empleado</option>{empleadosApp.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></Field>
              </div>
              <Field label="Proyecto" full><select name="proyectoId" value={form.proyectoId} onChange={handleChange} style={compactInputStyle}><option value="">Selecciona proyecto</option>{proyectosApp.filter((p) => esActivo(p.activo)).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></Field>
              <div style={registroTwoColumnsStyle}>
                <Field label="Origen"><input name="origen" value={form.origen} onChange={handleChange} placeholder="Ej. Santa Cruz" style={compactInputStyle} /></Field>
                <Field label="Destino"><input name="destino" value={form.destino} onChange={handleChange} placeholder="Ej. La Laguna" style={compactInputStyle} /></Field>
              </div>
              <div style={registroKmResumenStyle}>
                <Field label="Km ida y vuelta"><input type="number" name="km" value={form.km} onChange={handleChange} placeholder="Ej. 42" style={compactInputStyle} /></Field>
                <div style={resumenCalculoStyle}><div style={{ fontSize: 12, color: "#64748B", marginBottom: 4 }}>Precio/Km</div><strong style={{ color: "#334155", fontWeight: 500 }}>{`${numero(precioKmAplicado)} €/km`}</strong></div>
                <div style={resumenCalculoStyle}><div style={{ fontSize: 12, color: "#64748B", marginBottom: 4 }}>Importe</div><strong style={{ color: "#334155", fontWeight: 500 }}>{euros(importe)}</strong></div>
              </div>
              <Field label="Observaciones" full><textarea name="observaciones" value={form.observaciones} onChange={handleChange} placeholder="Opcional" style={{ ...compactInputStyle, minHeight: 76, resize: "vertical" }} /></Field>
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" onClick={guardar} disabled={guardando || actualizando} onMouseEnter={() => setHoveredButton("guardar")} onMouseLeave={() => setHoveredButton(null)} style={primaryButtonStyle("guardar", hoveredButton)}>{actualizando ? "Actualizando..." : guardando ? "Guardando..." : registroEditando ? "Actualizar kilometraje" : "Guardar kilometraje"}</button>
                {registroEditando && <button type="button" onClick={cancelarEdicion} onMouseEnter={() => setHoveredButton("cancelar-edicion")} onMouseLeave={() => setHoveredButton(null)} style={secondaryButtonStyle("cancelar-edicion", hoveredButton)}>Cancelar edición</button>}
              </div>
            </div>
          </Box>
        )}

        {tab === "horas" && (
          <>
            <Box title="Horas complementarias">
              <div style={hoursLayoutStyle}>
                <div style={hoursFormPanelStyle}>
                  <h3 style={sectionTitleStyle}>Nuevo registro de horas</h3>
                  <p style={sectionSubtitleStyle}>Registra horas complementarias por empleado y proyecto sin mezclarlo con kilometraje.</p>
                  <div style={hoursFormGridStyle}>
                    <div style={registroTwoColumnsStyle}>
                      <Field label="Fecha"><input type="date" name="fecha" value={formHoras.fecha} onChange={handleHorasChange} style={compactInputStyle} /></Field>
                      <Field label="Empleado"><select name="empleadoId" value={formHoras.empleadoId} onChange={handleHorasChange} style={compactInputStyle}><option value="">Selecciona empleado</option>{empleadosApp.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></Field>
                    </div>
                    <Field label="Proyecto" full><select name="proyectoId" value={formHoras.proyectoId} onChange={handleHorasChange} style={compactInputStyle}><option value="">Selecciona proyecto</option>{proyectosApp.filter((p) => esActivo(p.activo)).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></Field>
                    <div style={hoursInlineRowStyle}>
                      <Field label="Horas"><input type="number" step="0.25" name="horas" value={formHoras.horas} onChange={handleHorasChange} placeholder="Ej. 2,5" style={compactInputStyle} /></Field>
                      <div style={resumenCalculoStyle}><div style={{ fontSize: 12, color: "#64748B", marginBottom: 4 }}>Total</div><strong style={{ color: "#334155", fontWeight: 500 }}>{numero(parseNumero(formHoras.horas, 0))} h</strong></div>
                    </div>
                    <Field label="Observaciones" full><textarea name="observaciones" value={formHoras.observaciones} onChange={handleHorasChange} placeholder="Opcional" style={{ ...compactInputStyle, minHeight: 76, resize: "vertical" }} /></Field>
                    <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, flexWrap: "wrap" }}><button type="button" onClick={guardarHoras} disabled={guardando} onMouseEnter={() => setHoveredButton("guardar-horas")} onMouseLeave={() => setHoveredButton(null)} style={primaryButtonStyle("guardar-horas", hoveredButton)}>{guardando ? "Guardando..." : "Guardar horas"}</button></div>
                  </div>
                </div>
                <div style={hoursSummaryPanelStyle}>
                  <h3 style={sectionTitleStyle}>Resumen del mes</h3>
                  <div style={miniCardsGridStyle}><div style={miniCardStyle}><span>Registros</span><strong>{horasMes.length}</strong></div><div style={miniCardStyle}><span>Horas</span><strong>{numero(totalHorasMes)} h</strong></div></div>
                  <div style={{ marginTop: 16 }}><Table headers={["Empleado", "Horas", "Registros"]} alignments={["left", "right", "center"]} rows={horasPorEmpleadoMes.map((r) => [r.empleado, `${numero(r.horas)} h`, r.registros])} /></div>
                </div>
              </div>
            </Box>
            <Box title="Horas por empleado para asesoría"><Table headers={["Empleado", "Horas"]} alignments={["left", "right"]} rows={horasPorEmpleadoMes.filter((r) => Number(r.horas || 0) > 0).map((r) => [r.empleado, `${numero(r.horas)} h`])} /></Box>
            <Box title="Horas por proyecto"><Table headers={["Proyecto", "Horas", "Registros"]} alignments={["left", "right", "center"]} rows={horasPorProyectoMes.map((r) => [<ProjectBadge key={r.proyectoId} proyectoId={r.proyectoId} proyecto={r.proyecto} />, `${numero(r.horas)} h`, r.registros])} /></Box>
            <Box title="Últimos registros de horas"><Table headers={["Fecha", "Empleado", "Proyecto", "Horas", "Observaciones"]} alignments={["left", "left", "left", "right", "left"]} rows={ultimasHoras.map((r) => [formatDate(r.fecha), r.empleado, <ProjectBadge key={r.idRegistro || r.id} proyectoId={r.proyectoId} proyecto={r.proyecto} />, `${numero(r.horas)} h`, r.observaciones || ""])} /></Box>
          </>
        )}

        {tab === "informe" && (
          <>
            <Box title="Informe mensual">
              <p>Total km: <strong>{numero(totalesMes.km)} km</strong></p>
              <p>Importe total: <strong>{euros(totalesMes.importe)}</strong></p>
              <button onClick={imprimirInformeAsesoria} onMouseEnter={() => setHoveredButton("exportar-pdf-asesoria")} onMouseLeave={() => setHoveredButton(null)} style={{ ...primaryButtonStyle("exportar-pdf-asesoria", hoveredButton), marginTop: 10 }}>Exportar PDF Asesoría</button>
            </Box>
            <Box title="Resumen por proyecto"><Table headers={["Proyecto", "Km", "Importe", "Registros"]} rows={porProyectoMes.map((r) => [<ProjectBadge key={r.proyectoId} proyectoId={r.proyectoId} proyecto={r.proyecto} />, numero(r.km), euros(r.importe), r.registros])} /></Box>
            <Box title="Resumen por empleado"><Table headers={["Empleado", "Km", "Importe", "Registros"]} rows={porEmpleadoMes.map((r) => [r.empleado, numero(r.km), euros(r.importe), r.registros])} /></Box>
            <Box title="Resumen para asesoría"><Table headers={["Empleado", "Importe (€)"]} rows={informeAsesoria.map((r) => [r.empleado, euros(r.importe)])} /></Box>
          </>
        )}

        {tab === "acumulado" && <Box title="Acumulado por proyecto"><Table headers={["Proyecto", "Km acumulados", "Importe acumulado", "Registros"]} rows={acumuladoPorProyecto.map((r) => [<ProjectBadge key={r.proyectoId} proyectoId={r.proyectoId} proyecto={r.proyecto} />, numero(r.km), euros(r.importe), r.registros])} /></Box>}

        {tab === "historico" && (
          <Box title="Histórico de registros">
            <div style={gridFiltersStyle}>
              <Field label="Mes"><select value={filtrosHistorico.mes} onChange={(e) => cambiarFiltroHistorico("mes", e.target.value)} style={compactInputStyle}><option value="">Todos</option>{meses.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></Field>
              <Field label="Año"><select value={filtrosHistorico.anio} onChange={(e) => cambiarFiltroHistorico("anio", e.target.value)} style={compactInputStyle}><option value="">Todos</option><option value="2026">2026</option><option value="2027">2027</option><option value="2028">2028</option></select></Field>
              <Field label="Empleado"><select value={filtrosHistorico.empleadoId} onChange={(e) => cambiarFiltroHistorico("empleadoId", e.target.value)} style={compactInputStyle}><option value="">Todos</option>{empleadosApp.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></Field>
              <Field label="Proyecto"><select value={filtrosHistorico.proyectoId} onChange={(e) => cambiarFiltroHistorico("proyectoId", e.target.value)} style={compactInputStyle}><option value="">Todos</option>{proyectosApp.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></Field>
            </div>
            <button onClick={limpiarFiltrosHistorico} onMouseEnter={() => setHoveredButton("limpiar-filtros")} onMouseLeave={() => setHoveredButton(null)} style={secondaryButtonStyle("limpiar-filtros", hoveredButton)}>Limpiar filtros</button>
            <p style={{ color: "#64748b" }}>Mostrando {registrosHistoricoPagina.length} de {historicoFiltrado.length} registros filtrados.</p>
            <Table headers={["Fecha", "Empleado", "Proyecto", "Origen", "Destino", "Km", "Importe", "Observaciones", "Acciones"]} rows={registrosHistoricoPagina.map((r) => [formatDate(r.fecha), r.empleado, <ProjectBadge key={r.id} proyectoId={r.proyectoId} proyecto={r.proyecto} />, r.origen || "", r.destino, numero(r.km), euros(r.importe), r.observaciones || "", <div key={`acciones-${r.idRegistro || r.id}`} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button onClick={() => editarRegistro(r)} disabled={!r.idRegistro} onMouseEnter={() => setHoveredButton(`editar-${r.idRegistro || r.id}`)} onMouseLeave={() => setHoveredButton(null)} style={editButtonStyle(`editar-${r.idRegistro || r.id}`, hoveredButton, !r.idRegistro)} title={!r.idRegistro ? "Este registro no tiene ID_REGISTRO" : "Editar registro"}>Editar</button><button onClick={() => eliminarRegistro(r.idRegistro)} disabled={eliminandoId === r.idRegistro || !r.idRegistro} onMouseEnter={() => setHoveredButton(`eliminar-${r.idRegistro || r.id}`)} onMouseLeave={() => setHoveredButton(null)} style={deleteButtonStyle(`eliminar-${r.idRegistro || r.id}`, hoveredButton, eliminandoId === r.idRegistro || !r.idRegistro)} title={!r.idRegistro ? "Este registro no tiene ID_REGISTRO" : "Eliminar registro"}>{eliminandoId === r.idRegistro ? "Eliminando..." : "Eliminar"}</button></div>])} />
            <div style={paginationStyle}><button onClick={() => setPaginaHistorico((p) => Math.max(1, p - 1))} disabled={paginaHistorico <= 1} onMouseEnter={() => setHoveredButton("anterior")} onMouseLeave={() => setHoveredButton(null)} style={buttonStyle(false, "anterior", hoveredButton)}>Anterior</button><span>Página {paginaHistorico} de {totalPaginasHistorico}</span><button onClick={() => setPaginaHistorico((p) => Math.min(totalPaginasHistorico, p + 1))} disabled={paginaHistorico >= totalPaginasHistorico} onMouseEnter={() => setHoveredButton("siguiente")} onMouseLeave={() => setHoveredButton(null)} style={buttonStyle(false, "siguiente", hoveredButton)}>Siguiente</button></div>
          </Box>
        )}

        {tab === "proyectos" && <Box title="Proyectos"><Table headers={["ID", "Proyecto", "Activo"]} rows={proyectosApp.map((p) => [p.id, <ProjectBadge key={p.id} proyectoId={p.id} proyecto={p.nombre} />, p.activo ? "Sí" : "No"])} /></Box>}
        {tab === "empleados" && <Box title="Empleados"><Table headers={["ID", "Empleado", "Email", "Rol", "€/KM", "Activo"]} rows={empleadosApp.map((e) => [e.id, e.nombre, e.email || "", e.rol || "", euros(e.precioKm), e.activo ? "Sí" : "No"])} /></Box>}
      </div>
    </div>
  );
}

function Card({ title, value, accent = "#bfdbfe" }) {
  return <div style={{ ...cardStyle, borderTop: `4px solid ${accent}` }}><p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>{title}</p><h2 style={{ margin: "8px 0 0", fontSize: 28, letterSpacing: -0.4 }}>{value}</h2></div>;
}

function Box({ title, children }) {
  return <div style={boxStyle}><h2 style={{ marginTop: 0, marginBottom: 16 }}>{title}</h2>{children}</div>;
}

function Field({ label, children, full = false }) {
  return <label style={{ display: "grid", gap: 5, gridColumn: full ? "1 / -1" : "auto" }}><span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{label}</span>{children}</label>;
}

function Table({ headers, rows, alignments = [] }) {
  const getAlign = (index) => alignments[index] || "left";
  return <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}><thead><tr>{headers.map((h, index) => <th key={h} style={{ ...thStyle, textAlign: getAlign(index) }}>{h}</th>)}</tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={headers.length} style={{ padding: 14, color: "#64748b", textAlign: "center" }}>No hay registros.</td></tr> : rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} style={{ ...tdStyle, textAlign: getAlign(j) }}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

const pageStyle = { minHeight: "100vh", background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)", padding: 24, fontFamily: "Arial, sans-serif", color: "#0f172a" };
const loginPageStyle = { minHeight: "100vh", display: "grid", placeItems: "center", background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)", padding: 24, fontFamily: "Arial, sans-serif", color: "#0f172a" };
const loginCardStyle = { width: "100%", maxWidth: 420, background: "rgba(255, 255, 255, 0.96)", border: "1px solid #e2e8f0", borderRadius: 22, padding: 28, boxShadow: "0 18px 42px rgba(15, 23, 42, 0.10)", display: "grid", gap: 16 };
const loginIconStyle = { width: 46, height: 46, display: "grid", placeItems: "center", borderRadius: 16, background: "#dbeafe", border: "1px solid #bfdbfe", fontSize: 22 };
const loginTitleStyle = { margin: "0", fontSize: 28, letterSpacing: -0.4 };
const loginSubtitleStyle = { margin: "-8px 0 4px", color: "#64748b", lineHeight: 1.45 };
const loginInputStyle = { width: "100%", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: 13, padding: "12px 13px", fontSize: 15, background: "white", outline: "none" };
const loginButtonStyle = { border: "1px solid #bfdbfe", borderRadius: 14, padding: "13px 18px", background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", color: "#1e3a8a", fontWeight: 600, letterSpacing: "0.1px", cursor: "pointer", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.08)" };
const loginErrorStyle = { background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b", padding: 11, borderRadius: 12, fontSize: 14 };
const containerStyle = { maxWidth: 1250, margin: "0 auto" };
const headerStyle = { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 24 };
const navStyle = { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" };
const gridFiltersStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 };
const registroFormGridStyle = { display: "grid", gridTemplateColumns: "1fr", gap: 12, maxWidth: 880, margin: "0 auto", alignItems: "start" };
const registroTwoColumnsStyle = { display: "grid", gridTemplateColumns: "minmax(180px, 260px) minmax(260px, 1fr)", gap: 12 };
const registroKmResumenStyle = { display: "grid", gridTemplateColumns: "minmax(160px, 220px) minmax(150px, 1fr) minmax(150px, 1fr)", gap: 12, alignItems: "end" };
const resumenCalculoStyle = { minHeight: 42, boxSizing: "border-box", padding: "7px 12px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 11 };
const periodControlsStyle = { display: "flex", justifyContent: "center", alignItems: "end", gap: 16, flexWrap: "wrap", marginBottom: 4 };
const hoursLayoutStyle = { display: "grid", gridTemplateColumns: "minmax(420px, 1.3fr) minmax(320px, 0.7fr)", gap: 18, alignItems: "start" };
const hoursFormPanelStyle = { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: 18 };
const hoursSummaryPanelStyle = { background: "linear-gradient(180deg, #eff6ff, #f8fafc)", border: "1px solid #bfdbfe", borderRadius: 16, padding: 18 };
const hoursFormGridStyle = { display: "grid", gridTemplateColumns: "1fr", gap: 12 };
const hoursInlineRowStyle = { display: "grid", gridTemplateColumns: "minmax(150px, 220px) minmax(140px, 180px)", gap: 12, alignItems: "end" };
const sectionTitleStyle = { margin: "0 0 6px", color: "#0f172a", fontSize: 18, letterSpacing: -0.2 };
const sectionSubtitleStyle = { margin: "0 0 16px", color: "#64748b", fontSize: 14, lineHeight: 1.45 };
const miniCardsGridStyle = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 };
const miniCardStyle = { background: "rgba(255, 255, 255, 0.85)", border: "1px solid #dbeafe", borderRadius: 14, padding: 14, display: "grid", gap: 6, color: "#334155" };
const cardsGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 20 };
const twoColumnsStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 18 };
const cardStyle = { background: "rgba(255, 255, 255, 0.94)", padding: 20, borderRadius: 18, border: "1px solid #e2e8f0", boxShadow: "0 12px 28px rgba(15, 23, 42, 0.07)", transition: "all 0.2s ease" };
const boxStyle = { background: "rgba(255, 255, 255, 0.96)", padding: 22, borderRadius: 18, border: "1px solid #e2e8f0", marginBottom: 20, boxShadow: "0 14px 32px rgba(15, 23, 42, 0.06)" };
const inputStyle = { width: "100%", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: 12, padding: "11px 12px", fontSize: 14, background: "white", outline: "none" };
const compactInputStyle = { ...inputStyle, minHeight: 42, padding: "9px 12px", borderRadius: 11 };
const messageStyle = { background: "white", border: "1px solid #bfdbfe", padding: 12, borderRadius: 14, marginBottom: 18, color: "#1e3a8a", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.08)" };
const editNoticeStyle = { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e3a8a", padding: 12, borderRadius: 14, marginBottom: 16, fontSize: 14 };
const paginationStyle = { display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 16 };
const thStyle = { textAlign: "left", borderBottom: "2px solid #e2e8f0", padding: "12px 10px", color: "#334155", fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.3 };
const tdStyle = { borderBottom: "1px solid #f1f5f9", padding: "12px 10px", verticalAlign: "top", wordBreak: "break-word" };

function buttonStyle(active, id, hoveredButton) {
  const isHover = hoveredButton === id;
  return { border: active ? "1px solid #cbd5e1" : "1px solid #e2e8f0", borderRadius: 14, padding: "10px 16px", background: active ? "linear-gradient(135deg, #e2e8f0, #cbd5e1)" : "linear-gradient(135deg, #ffffff, #f8fafc)", color: "#1f2937", fontWeight: active ? 600 : 500, letterSpacing: "0.1px", cursor: "pointer", boxShadow: isHover ? "0 6px 16px rgba(15, 23, 42, 0.12)" : "0 2px 6px rgba(15, 23, 42, 0.06)", transform: isHover ? "translateY(-1px)" : "translateY(0)", transition: "all 0.2s ease", opacity: 1 };
}

function primaryButtonStyle(id, hoveredButton) {
  const isHover = hoveredButton === id;
  return { border: "1px solid #bfdbfe", borderRadius: 14, padding: "13px 18px", background: isHover ? "linear-gradient(135deg, #bfdbfe, #93c5fd)" : "linear-gradient(135deg, #dbeafe, #bfdbfe)", color: "#1e3a8a", fontWeight: 500, letterSpacing: "0.1px", cursor: "pointer", boxShadow: isHover ? "0 8px 18px rgba(37, 99, 235, 0.14)" : "0 4px 12px rgba(37, 99, 235, 0.08)", transform: isHover ? "translateY(-1px)" : "translateY(0)", transition: "all 0.2s ease" };
}

function editButtonStyle(id, hoveredButton, disabled = false) {
  const isHover = hoveredButton === id && !disabled;
  return { border: "1px solid #bfdbfe", borderRadius: 10, padding: "7px 11px", background: disabled ? "#f8fafc" : isHover ? "linear-gradient(135deg, #dbeafe, #bfdbfe)" : "#dbeafe", color: disabled ? "#94a3b8" : "#1e3a8a", cursor: disabled ? "not-allowed" : "pointer", fontWeight: 500, letterSpacing: "0.1px", boxShadow: isHover ? "0 6px 14px rgba(37, 99, 235, 0.12)" : "0 2px 6px rgba(37, 99, 235, 0.06)", transform: isHover ? "translateY(-1px)" : "translateY(0)", transition: "all 0.2s ease", opacity: disabled ? 0.65 : 1 };
}

function deleteButtonStyle(id, hoveredButton, disabled = false) {
  const isHover = hoveredButton === id && !disabled;
  return { border: "1px solid #fecaca", borderRadius: 10, padding: "7px 11px", background: disabled ? "#f8fafc" : isHover ? "linear-gradient(135deg, #fee2e2, #fecaca)" : "#fee2e2", color: disabled ? "#94a3b8" : "#991b1b", cursor: disabled ? "not-allowed" : "pointer", fontWeight: 500, letterSpacing: "0.1px", boxShadow: isHover ? "0 6px 14px rgba(153, 27, 27, 0.12)" : "0 2px 6px rgba(153, 27, 27, 0.06)", transform: isHover ? "translateY(-1px)" : "translateY(0)", transition: "all 0.2s ease", opacity: disabled ? 0.65 : 1 };
}

function secondaryButtonStyle(id, hoveredButton) {
  const isHover = hoveredButton === id;
  return { marginTop: 0, marginBottom: 12, padding: "9px 13px", borderRadius: 12, border: "1px solid #cbd5e1", background: isHover ? "linear-gradient(135deg, #f1f5f9, #e2e8f0)" : "#ffffff", color: "#334155", cursor: "pointer", fontWeight: 500, letterSpacing: "0.1px", boxShadow: isHover ? "0 5px 14px rgba(15, 23, 42, 0.10)" : "0 2px 6px rgba(15, 23, 42, 0.05)", transform: isHover ? "translateY(-1px)" : "translateY(0)", transition: "all 0.2s ease" };
}
