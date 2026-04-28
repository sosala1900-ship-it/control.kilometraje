// App.jsx — versión PRO con hover, colores por proyecto, histórico con filtros y paginación
import { useEffect, useMemo, useState } from "react";

const API_URL =
  "https://script.google.com/macros/s/AKfycbzEWeK1VVLAWXknILQZxoY8I-AfauaWKpKUDYtWaTPw12LrnmxNKgHk_lw_uZMpbDaBIg/exec";

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

const empleados = [
  { id: "emp-001", nombre: "TANIA GUTIÉRREZ", activo: true },
  { id: "emp-002", nombre: "ADALIS PERERA", activo: true },
  { id: "emp-003", nombre: "MIKEL FERRERA", activo: true },
  { id: "emp-004", nombre: "SARA RODRIGUEZ", activo: true },
  { id: "emp-005", nombre: "PABLO MENDOZA", activo: true },
  { id: "emp-006", nombre: "PAMELA GOGLIO", activo: true },
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

    script.onerror = function () {
      delete window[callbackName];
      document.body.removeChild(script);
      reject(new Error("No se pudieron cargar los datos"));
    };

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

function getColorProyecto(proyectoId) {
  const colores = {
    "22_100": "#0ea5e9",
    "24_0010": "#22c55e",
    "24_015": "#f97316",
    "24_077": "#a855f7",
    "25_008": "#eab308",
    "25_030": "#ef4444",
    "24_085": "#14b8a6",
    "24_117": "#6366f1",
    "25_027": "#ec4899",
    "25_039": "#84cc16",
    "25_033": "#06b6d4",
    "25_041": "#f43f5e",
    "25_034": "#10b981",
    VENTAS: "#64748b",
  };

  return colores[proyectoId] || "#94a3b8";
}

function ProjectBadge({ proyectoId, proyecto }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        maxWidth: 320,
        background: getColorProyecto(proyectoId),
        color: "white",
        padding: "5px 9px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1.2,
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.16)",
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

  if (texto.includes("/")) {
    return texto.split("/")[1]?.padStart(2, "0") || "";
  }

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

  if (texto.includes("/")) {
    return texto.split("/")[2] || "";
  }

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

function normalizarRegistro(row, index) {
  return {
    id: index + 1,
    idRegistro: row["ID_REGISTRO"] || row["idRegistro"] || "",
    fecha: row["FECHA"] || "",
    empleadoId: row["EMPLEADO ID"] || "",
    empleado: row["EMPLEADO"] || "",
    proyectoId: row["PROYECTO ID"] || "",
    proyecto: row["PROYECTO"] || "",
    destino: row["DESTINO"] || "",
    km: Number(row["KM"]) || 0,
    observaciones: row["OBSERVACIONES"] || "",
    precioKm: Number(row["PRECIO_KM"]) || PRECIO_KM,
    importe: Number(row["IMPORTE"]) || 0,
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
      map[key] = {
        empleado: r.empleado || key,
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

  const [tab, setTab] = useState("dashboard");
  const [registros, setRegistros] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
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
    destino: "",
    km: "",
    observaciones: "",
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      setMensaje("Cargando datos del Sheet...");

      const data = await cargarDatosJsonp();

      const normalizados = data
        .map((row, index) => normalizarRegistro(row, index))
        .filter((r) => r.fecha || r.empleado || r.proyecto || r.km);

      setRegistros(normalizados.reverse());
      setMensaje(`Datos cargados: ${normalizados.length} registros.`);
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

  async function guardar() {
    if (!form.fecha || !form.empleadoId || !form.proyectoId || !form.km) {
      setMensaje("Completa fecha, empleado, proyecto y km.");
      return;
    }

    const empleado = empleados.find((e) => e.id === form.empleadoId);
    const proyecto = proyectos.find((p) => p.id === form.proyectoId);
    const km = Number(form.km);
    const importe = km * PRECIO_KM;

    const nuevo = {
      fecha: form.fecha,
      empleadoId: form.empleadoId,
      empleado: empleado?.nombre || "",
      proyectoId: form.proyectoId,
      proyecto: proyecto?.nombre || "",
      destino: form.destino,
      km,
      observaciones: form.observaciones,
      precioKm: PRECIO_KM,
      importe,
    };

    try {
      setGuardando(true);
      setMensaje("Guardando en Google Sheets...");

      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(nuevo),
      });

      setRegistros([{ id: Date.now(), ...nuevo }, ...registros]);

      setForm({
        fecha: "",
        empleadoId: "",
        proyectoId: "",
        destino: "",
        km: "",
        observaciones: "",
      });

      setTab("dashboard");
      setMensaje("Registro guardado correctamente.");
    } catch (error) {
      console.error(error);
      setMensaje("Error al guardar el registro.");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarRegistro(idRegistro) {
    if (!idRegistro) {
      alert("Este registro no tiene ID_REGISTRO y no se puede eliminar.");
      return;
    }

    const confirmar = window.confirm(
      "¿Seguro que quieres eliminar este registro? Esta acción no se puede deshacer."
    );

    if (!confirmar) return;

    try {
      setMensaje("Eliminando registro...");

      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "delete",
          idRegistro,
        }),
      });

      setRegistros((prev) =>
        prev.filter((registro) => registro.idRegistro !== idRegistro)
      );

      setMensaje("Registro eliminado correctamente.");

      setTimeout(() => {
        cargarDatos();
      }, 800);
    } catch (error) {
      console.error(error);
      setMensaje("Error al eliminar el registro.");
    }
  }

  function cambiarFiltroHistorico(nombre, valor) {
    setFiltrosHistorico((prev) => ({ ...prev, [nombre]: valor }));
    setPaginaHistorico(1);
  }

  function limpiarFiltrosHistorico() {
    setFiltrosHistorico({
      mes: "",
      anio: "",
      empleadoId: "",
      proyectoId: "",
    });
    setPaginaHistorico(1);
  }

  const registrosMes = useMemo(() => {
    return registros.filter(
      (r) => getMonth(r.fecha) === mes && getYear(r.fecha) === anio
    );
  }, [registros, mes, anio]);

  const totalesMes = useMemo(() => calcularTotales(registrosMes), [registrosMes]);
  const porEmpleadoMes = useMemo(() => agruparPorEmpleado(registrosMes), [registrosMes]);
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

  const totalPaginasHistorico = Math.max(
    1,
    Math.ceil(historicoFiltrado.length / REGISTROS_POR_PAGINA)
  );

  const registrosHistoricoPagina = useMemo(() => {
    const inicio = (paginaHistorico - 1) * REGISTROS_POR_PAGINA;
    return historicoFiltrado.slice(inicio, inicio + REGISTROS_POR_PAGINA);
  }, [historicoFiltrado, paginaHistorico]);

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <div>
            <div style={appBadgeStyle}>Gestión interna</div>
            <h1 style={{ margin: "8px 0 0", fontSize: 34, letterSpacing: -0.5 }}>
              Control de Kilometraje
            </h1>
            <p style={{ color: "#64748b", marginTop: 6 }}>
              Dashboard mensual, histórico y control acumulado por proyecto.
            </p>
          </div>

          <button
            onClick={cargarDatos}
            disabled={cargando}
            onMouseEnter={() => setHoveredButton("actualizar")}
            onMouseLeave={() => setHoveredButton(null)}
            style={buttonStyle(false, "actualizar", hoveredButton)}
          >
            {cargando ? "Cargando..." : "Actualizar datos"}
          </button>
        </header>

        <nav style={navStyle}>
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              onMouseEnter={() => setHoveredButton(item.id)}
              onMouseLeave={() => setHoveredButton(null)}
              style={buttonStyle(tab === item.id, item.id, hoveredButton)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {mensaje && <div style={messageStyle}>{mensaje}</div>}

        {(tab === "dashboard" || tab === "informe") && (
          <Box title="Periodo de trabajo">
            <div style={gridFiltersStyle}>
              <Field label="Mes">
                <select value={mes} onChange={(e) => setMes(e.target.value)} style={inputStyle}>
                  {meses.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Año">
                <select value={anio} onChange={(e) => setAnio(e.target.value)} style={inputStyle}>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                </select>
              </Field>
            </div>
          </Box>
        )}

        {tab === "dashboard" && (
          <>
            <div style={cardsGridStyle}>
              <Card title="Registros del mes" value={totalesMes.registros} accent="#2563eb" />
              <Card title="Km del mes" value={`${numero(totalesMes.km)} km`} accent="#14b8a6" />
              <Card title="Importe del mes" value={euros(totalesMes.importe)} accent="#f97316" />
            </div>

            <div style={twoColumnsStyle}>
              <Box title="Resumen mensual por proyecto">
                <Table
                  headers={["Proyecto", "Km", "Importe", "Registros"]}
                  rows={porProyectoMes.map((r) => [
                    <ProjectBadge key={r.proyectoId} proyectoId={r.proyectoId} proyecto={r.proyecto} />,
                    numero(r.km),
                    euros(r.importe),
                    r.registros,
                  ])}
                />
              </Box>

              <Box title="Resumen mensual por empleado">
                <Table
                  headers={["Empleado", "Km", "Importe", "Registros"]}
                  rows={porEmpleadoMes.map((r) => [
                    r.empleado,
                    numero(r.km),
                    euros(r.importe),
                    r.registros,
                  ])}
                />
              </Box>
            </div>
          </>
        )}

        {tab === "registro" && (
          <Box title="Nuevo registro de kilometraje">
            <div style={{ display: "grid", gap: 12, maxWidth: 650 }}>
              <Field label="Fecha">
                <input type="date" name="fecha" value={form.fecha} onChange={handleChange} style={inputStyle} />
              </Field>

              <Field label="Empleado">
                <select name="empleadoId" value={form.empleadoId} onChange={handleChange} style={inputStyle}>
                  <option value="">Selecciona empleado</option>
                  {empleados.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Proyecto">
                <select name="proyectoId" value={form.proyectoId} onChange={handleChange} style={inputStyle}>
                  <option value="">Selecciona proyecto</option>
                  {proyectos
                    .filter((p) => p.activo)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                </select>
              </Field>

              <Field label="Destino">
                <input name="destino" value={form.destino} onChange={handleChange} placeholder="Ej. Santa Cruz" style={inputStyle} />
              </Field>

              <Field label="Km ida y vuelta">
                <input type="number" name="km" value={form.km} onChange={handleChange} placeholder="Ej. 42" style={inputStyle} />
              </Field>

              <Field label="Observaciones">
                <textarea name="observaciones" value={form.observaciones} onChange={handleChange} placeholder="Opcional" style={{ ...inputStyle, minHeight: 90 }} />
              </Field>

              <button
                onClick={guardar}
                disabled={guardando}
                onMouseEnter={() => setHoveredButton("guardar")}
                onMouseLeave={() => setHoveredButton(null)}
                style={primaryButtonStyle("guardar", hoveredButton)}
              >
                {guardando ? "Guardando..." : "Guardar kilometraje"}
              </button>
            </div>
          </Box>
        )}

        {tab === "informe" && (
          <>
            <Box title="Informe mensual">
              <p>Total km: <strong>{numero(totalesMes.km)} km</strong></p>
              <p>Importe total: <strong>{euros(totalesMes.importe)}</strong></p>
            </Box>

            <Box title="Resumen por proyecto">
              <Table
                headers={["Proyecto", "Km", "Importe", "Registros"]}
                rows={porProyectoMes.map((r) => [
                  <ProjectBadge key={r.proyectoId} proyectoId={r.proyectoId} proyecto={r.proyecto} />,
                  numero(r.km),
                  euros(r.importe),
                  r.registros,
                ])}
              />
            </Box>

            <Box title="Resumen por empleado">
              <Table
                headers={["Empleado", "Km", "Importe", "Registros"]}
                rows={porEmpleadoMes.map((r) => [
                  r.empleado,
                  numero(r.km),
                  euros(r.importe),
                  r.registros,
                ])}
              />
            </Box>

            <Box title="Resumen para asesoría">
              <Table
                headers={["Empleado", "Importe (€)"]}
                rows={porEmpleadoMes.map((r) => [r.empleado, euros(r.importe)])}
              />
            </Box>
          </>
        )}

        {tab === "acumulado" && (
          <Box title="Acumulado por proyecto">
            <Table
              headers={["Proyecto", "Km acumulados", "Importe acumulado", "Registros"]}
              rows={acumuladoPorProyecto.map((r) => [
                <ProjectBadge key={r.proyectoId} proyectoId={r.proyectoId} proyecto={r.proyecto} />,
                numero(r.km),
                euros(r.importe),
                r.registros,
              ])}
            />
          </Box>
        )}

        {tab === "historico" && (
          <Box title="Histórico de registros">
            <div style={gridFiltersStyle}>
              <Field label="Mes">
                <select
                  value={filtrosHistorico.mes}
                  onChange={(e) => cambiarFiltroHistorico("mes", e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Todos</option>
                  {meses.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Año">
                <select
                  value={filtrosHistorico.anio}
                  onChange={(e) => cambiarFiltroHistorico("anio", e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Todos</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                </select>
              </Field>

              <Field label="Empleado">
                <select
                  value={filtrosHistorico.empleadoId}
                  onChange={(e) => cambiarFiltroHistorico("empleadoId", e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Todos</option>
                  {empleados.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Proyecto">
                <select
                  value={filtrosHistorico.proyectoId}
                  onChange={(e) => cambiarFiltroHistorico("proyectoId", e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Todos</option>
                  {proyectos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <button
              onClick={limpiarFiltrosHistorico}
              onMouseEnter={() => setHoveredButton("limpiar-filtros")}
              onMouseLeave={() => setHoveredButton(null)}
              style={secondaryButtonStyle("limpiar-filtros", hoveredButton)}
            >
              Limpiar filtros
            </button>

            <p style={{ color: "#64748b" }}>
              Mostrando {registrosHistoricoPagina.length} de {historicoFiltrado.length} registros filtrados.
            </p>

            <Table
              headers={["Fecha", "Empleado", "Proyecto", "Destino", "Km", "Importe", "Observaciones", "Acciones"]}
              rows={registrosHistoricoPagina.map((r) => [
                formatDate(r.fecha),
                r.empleado,
                <ProjectBadge key={r.id} proyectoId={r.proyectoId} proyecto={r.proyecto} />,
                r.destino,
                numero(r.km),
                euros(r.importe),
                r.observaciones || "",
                <button
                  key={`eliminar-${r.idRegistro || r.id}`}
                  onClick={() => eliminarRegistro(r.idRegistro)}
                  disabled={!r.idRegistro}
                  onMouseEnter={() => setHoveredButton(`eliminar-${r.idRegistro || r.id}`)}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={deleteButtonStyle(`eliminar-${r.idRegistro || r.id}`, hoveredButton, !r.idRegistro)}
                  title={!r.idRegistro ? "Este registro no tiene ID_REGISTRO" : "Eliminar registro"}
                >
                  Eliminar
                </button>,
              ])}
            />

            <div style={paginationStyle}>
              <button
                onClick={() => setPaginaHistorico((p) => Math.max(1, p - 1))}
                disabled={paginaHistorico <= 1}
                onMouseEnter={() => setHoveredButton("anterior")}
                onMouseLeave={() => setHoveredButton(null)}
                style={buttonStyle(false, "anterior", hoveredButton)}
              >
                Anterior
              </button>

              <span>
                Página {paginaHistorico} de {totalPaginasHistorico}
              </span>

              <button
                onClick={() => setPaginaHistorico((p) => Math.min(totalPaginasHistorico, p + 1))}
                disabled={paginaHistorico >= totalPaginasHistorico}
                onMouseEnter={() => setHoveredButton("siguiente")}
                onMouseLeave={() => setHoveredButton(null)}
                style={buttonStyle(false, "siguiente", hoveredButton)}
              >
                Siguiente
              </button>
            </div>
          </Box>
        )}

        {tab === "proyectos" && (
          <Box title="Proyectos">
            <Table
              headers={["ID", "Proyecto", "Activo"]}
              rows={proyectos.map((p) => [
                p.id,
                <ProjectBadge key={p.id} proyectoId={p.id} proyecto={p.nombre} />,
                p.activo ? "Sí" : "No",
              ])}
            />
          </Box>
        )}

        {tab === "empleados" && (
          <Box title="Empleados">
            <Table
              headers={["ID", "Empleado", "Activo"]}
              rows={empleados.map((e) => [e.id, e.nombre, e.activo ? "Sí" : "No"])}
            />
          </Box>
        )}
      </div>
    </div>
  );
}

function Card({ title, value, accent = "#2563eb" }) {
  return (
    <div style={{ ...cardStyle, borderTop: `4px solid ${accent}` }}>
      <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>{title}</p>
      <h2 style={{ margin: "8px 0 0", fontSize: 28, letterSpacing: -0.4 }}>{value}</h2>
    </div>
  );
}

function Box({ title, children }) {
  return (
    <div style={boxStyle}>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function Table({ headers, rows }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} style={thStyle}>
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{ padding: 14, color: "#64748b" }}>
                No hay registros.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} style={tdStyle}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
  padding: 24,
  fontFamily: "Arial, sans-serif",
  color: "#0f172a",
};

const containerStyle = {
  maxWidth: 1250,
  margin: "0 auto",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
  marginBottom: 24,
};

const appBadgeStyle = {
  display: "inline-flex",
  borderRadius: 999,
  padding: "5px 10px",
  background: "#dbeafe",
  color: "#1d4ed8",
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const navStyle = {
  display: "flex",
  gap: 8,
  marginBottom: 20,
  flexWrap: "wrap",
};

const gridFiltersStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  marginBottom: 16,
};

const cardsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  marginBottom: 20,
};

const twoColumnsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
  gap: 18,
};

const cardStyle = {
  background: "rgba(255, 255, 255, 0.94)",
  padding: 20,
  borderRadius: 18,
  border: "1px solid #e2e8f0",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.07)",
  transition: "all 0.2s ease",
};

const boxStyle = {
  background: "rgba(255, 255, 255, 0.96)",
  padding: 22,
  borderRadius: 18,
  border: "1px solid #e2e8f0",
  marginBottom: 20,
  boxShadow: "0 14px 32px rgba(15, 23, 42, 0.06)",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "11px 12px",
  fontSize: 14,
  background: "white",
  outline: "none",
};

const messageStyle = {
  background: "white",
  border: "1px solid #bfdbfe",
  padding: 12,
  borderRadius: 14,
  marginBottom: 18,
  color: "#1e3a8a",
  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.08)",
};

const paginationStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 12,
  marginTop: 16,
};

const thStyle = {
  textAlign: "left",
  borderBottom: "2px solid #e2e8f0",
  padding: "12px 10px",
  color: "#334155",
  fontWeight: 800,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0.3,
};

const tdStyle = {
  borderBottom: "1px solid #f1f5f9",
  padding: "12px 10px",
  verticalAlign: "top",
};

function buttonStyle(active, id, hoveredButton) {
  const isHover = hoveredButton === id;

  return {
    border: "none",
    borderRadius: 14,
    padding: "10px 16px",
    background: active
      ? "linear-gradient(135deg, #1e293b, #0f172a)"
      : "linear-gradient(135deg, #ffffff, #f1f5f9)",
    color: active ? "white" : "#0f172a",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: isHover
      ? "0 8px 22px rgba(15, 23, 42, 0.22)"
      : "0 3px 8px rgba(15, 23, 42, 0.08)",
    transform: isHover ? "translateY(-2px)" : "translateY(0)",
    transition: "all 0.2s ease",
    opacity: 1,
  };
}

function primaryButtonStyle(id, hoveredButton) {
  const isHover = hoveredButton === id;

  return {
    border: "none",
    borderRadius: 14,
    padding: "13px 18px",
    background: isHover
      ? "linear-gradient(135deg, #1d4ed8, #1e40af)"
      : "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: isHover
      ? "0 10px 24px rgba(37, 99, 235, 0.42)"
      : "0 6px 16px rgba(37, 99, 235, 0.32)",
    transform: isHover ? "translateY(-2px)" : "translateY(0)",
    transition: "all 0.2s ease",
  };
}

function secondaryButtonStyle(id, hoveredButton) {
  const isHover = hoveredButton === id;

  return {
    marginTop: 0,
    marginBottom: 12,
    padding: "9px 13px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: isHover
      ? "linear-gradient(135deg, #f8fafc, #e2e8f0)"
      : "white",
    color: "#334155",
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: isHover
      ? "0 6px 16px rgba(15, 23, 42, 0.12)"
      : "0 2px 6px rgba(15, 23, 42, 0.06)",
    transform: isHover ? "translateY(-1px)" : "translateY(0)",
    transition: "all 0.2s ease",
  };
}


function deleteButtonStyle(id, hoveredButton, disabled = false) {
  const isHover = hoveredButton === id && !disabled;

  return {
    padding: "7px 11px",
    borderRadius: 10,
    border: "1px solid rgba(127, 29, 29, 0.16)",
    background: disabled
      ? "#f1f5f9"
      : isHover
        ? "#fecaca"
        : "#fee2e2",
    color: disabled ? "#94a3b8" : "#7f1d1d",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 500,
    letterSpacing: "0.1px",
    boxShadow: isHover
      ? "0 6px 14px rgba(127, 29, 29, 0.12)"
      : "0 2px 6px rgba(15, 23, 42, 0.04)",
    transform: isHover ? "translateY(-1px)" : "translateY(0)",
    transition: "all 0.2s ease",
  };
}
