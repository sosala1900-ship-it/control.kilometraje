import React, { useState, useEffect } from "react";

const API_URL = "TU_URL_APPS_SCRIPT_AQUI";

export default function App() {
  const [registros, setRegistros] = useState([]);
  const [horas, setHoras] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [empleados, setEmpleados] = useState([]);

  const [fecha, setFecha] = useState("");
  const [empleadoId, setEmpleadoId] = useState("");
  const [proyectoId, setProyectoId] = useState("");
  const [destino, setDestino] = useState("");
  const [km, setKm] = useState("");
  const [horasInput, setHorasInput] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [precioKm, setPrecioKm] = useState(0.26);
  const [tab, setTab] = useState("km");

  const [mes, setMes] = useState(new Date().getMonth());
  const [anio, setAnio] = useState(new Date().getFullYear());

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const res = await fetch(API_URL);
    const data = await res.json();

    setRegistros(data.registros || []);
    setHoras(data.horas || []);
    setProyectos(data.proyectos || []);
    setEmpleados(data.empleados || []);
  };

  const empleadosActivos = empleados.filter(
    (e) => String(e.ACTIVO).toUpperCase() === "SI"
  );

  const proyectosActivos = proyectos.filter(
    (p) => String(p.ACTIVO).toUpperCase() === "SI"
  );

  const handleEmpleadoChange = (id) => {
    setEmpleadoId(id);
    const emp = empleados.find((e) => String(e.ID) === String(id));
    const precio = parseFloat(emp?.["€/KM"]);
    setPrecioKm(!isNaN(precio) ? precio : 0.26);
  };

  const importe = (parseFloat(km) || 0) * precioKm;

  // FILTRO HORAS MES
  const horasMes = horas.filter((h) => {
    const f = new Date(h.FECHA);
    return f.getMonth() === mes && f.getFullYear() === anio;
  });

  const totalHoras = horasMes.reduce(
    (acc, h) => acc + Number(h.HORAS || 0),
    0
  );

  // HORAS POR EMPLEADO
  const horasPorEmpleado = {};
  horasMes.forEach((h) => {
    if (!horasPorEmpleado[h.EMPLEADO]) {
      horasPorEmpleado[h.EMPLEADO] = 0;
    }
    horasPorEmpleado[h.EMPLEADO] += Number(h.HORAS || 0);
  });

  const resumenEmpleados = Object.entries(horasPorEmpleado)
    .map(([empleado, horas]) => ({ empleado, horas }))
    .sort((a, b) => b.horas - a.horas);

  // HORAS POR PROYECTO
  const horasPorProyecto = {};
  horasMes.forEach((h) => {
    if (!horasPorProyecto[h.PROYECTO]) {
      horasPorProyecto[h.PROYECTO] = { horas: 0, registros: 0 };
    }
    horasPorProyecto[h.PROYECTO].horas += Number(h.HORAS || 0);
    horasPorProyecto[h.PROYECTO].registros++;
  });

  const resumenProyectos = Object.entries(horasPorProyecto).map(
    ([proyecto, data]) => ({
      proyecto,
      ...data,
    })
  );

  // GUARDAR HORAS
  const guardarHoras = async (e) => {
    e.preventDefault();

    const empleado = empleados.find((e) => String(e.ID) === empleadoId);
    const proyecto = proyectos.find(
      (p) => String(p["ID PROYECTO"]) === proyectoId
    );

    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        tipo: "horas",
        fecha,
        empleadoId,
        empleado: empleado?.NOMBRE,
        proyectoId,
        proyecto: proyecto?.["NOMBRE PROYECTO"],
        horas: parseFloat(horasInput),
        observaciones,
      }),
    });

    setHorasInput("");
    setObservaciones("");
    cargarDatos();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Control de Kilometraje</h1>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setTab("km")}>Kilometraje</button>
        <button onClick={() => setTab("horas")}>Horas</button>
      </div>

      {tab === "horas" && (
        <>
          <h2>Horas complementarias</h2>

          <h3>Total horas del mes: {totalHoras.toFixed(2)} h</h3>

          {/* HORAS POR EMPLEADO */}
          <div>
            <h3>Horas por empleado para asesoría</h3>
            <table style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Horas</th>
                </tr>
              </thead>
              <tbody>
                {resumenEmpleados.map((e, i) => (
                  <tr key={i}>
                    <td>{e.empleado}</td>
                    <td>{e.horas.toFixed(2)} h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* HORAS POR PROYECTO */}
          <div>
            <h3>Horas por proyecto</h3>
            <table style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Horas</th>
                  <th>Registros</th>
                </tr>
              </thead>
              <tbody>
                {resumenProyectos.map((p, i) => (
                  <tr key={i}>
                    <td>{p.proyecto}</td>
                    <td>{p.horas.toFixed(2)} h</td>
                    <td>{p.registros}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ÚLTIMOS REGISTROS */}
          <div>
            <h3>Últimos registros de horas</h3>
            <table style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Empleado</th>
                  <th>Proyecto</th>
                  <th>Horas</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {horas.slice(-5).map((h, i) => (
                  <tr key={i}>
                    <td>{h.FECHA}</td>
                    <td>{h.EMPLEADO}</td>
                    <td>{h.PROYECTO}</td>
                    <td>{h.HORAS}</td>
                    <td>{h.OBSERVACIONES}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FORMULARIO */}
          <form onSubmit={guardarHoras}>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />

            <select value={empleadoId} onChange={(e) => setEmpleadoId(e.target.value)}>
              <option>Empleado</option>
              {empleadosActivos.map((e) => (
                <option key={e.ID} value={e.ID}>{e.NOMBRE}</option>
              ))}
            </select>

            <select value={proyectoId} onChange={(e) => setProyectoId(e.target.value)}>
              <option>Proyecto</option>
              {proyectosActivos.map((p) => (
                <option key={p["ID PROYECTO"]} value={p["ID PROYECTO"]}>
                  {p["NOMBRE PROYECTO"]}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Horas"
              value={horasInput}
              onChange={(e) => setHorasInput(e.target.value)}
            />

            <textarea
              placeholder="Observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />

            <button type="submit">Guardar horas</button>
          </form>
        </>
      )}
    </div>
  );
}