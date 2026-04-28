import React, { useState, useEffect } from "react";

const API_URL = "TU_URL_APPS_SCRIPT_AQUI";

export default function App() {
  const [registros, setRegistros] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [empleados, setEmpleados] = useState([]);

  const [fecha, setFecha] = useState("");
  const [empleadoId, setEmpleadoId] = useState("");
  const [proyectoId, setProyectoId] = useState("");
  const [destino, setDestino] = useState("");
  const [km, setKm] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [precioKm, setPrecioKm] = useState(0.26);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const res = await fetch(API_URL);
    const data = await res.json();

    setRegistros(data.registros || []);
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

    const empleado = empleados.find((e) => String(e.ID) === String(id));

    if (empleado) {
      const precio = parseFloat(empleado["€/KM"]);
      setPrecioKm(!isNaN(precio) ? precio : 0.26);
    } else {
      setPrecioKm(0.26);
    }
  };

  const importe = (parseFloat(km) || 0) * precioKm;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const empleado = empleados.find((e) => String(e.ID) === empleadoId);
    const proyecto = proyectos.find(
      (p) => String(p["ID PROYECTO"]) === proyectoId
    );

    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        fecha,
        empleadoId,
        empleado: empleado?.NOMBRE || "",
        proyectoId,
        proyecto: proyecto?.["NOMBRE PROYECTO"] || "",
        destino,
        km,
        observaciones,
        precioKm,
        importe,
      }),
    });

    // Reset formulario
    setFecha("");
    setEmpleadoId("");
    setProyectoId("");
    setDestino("");
    setKm("");
    setObservaciones("");
    setPrecioKm(0.26);

    cargarDatos();
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      <h2>Nuevo registro de kilometraje</h2>

      <form onSubmit={handleSubmit}>
        {/* FILA 1: Fecha + Empleado */}
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={{ flex: 1 }}
          />

          <select
            value={empleadoId}
            onChange={(e) => handleEmpleadoChange(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">Empleado</option>
            {empleadosActivos.map((e) => (
              <option key={e.ID} value={e.ID}>
                {e.NOMBRE}
              </option>
            ))}
          </select>
        </div>

        {/* PROYECTO */}
        <div style={{ marginTop: "10px" }}>
          <select
            value={proyectoId}
            onChange={(e) => setProyectoId(e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="">Proyecto</option>
            {proyectosActivos.map((p) => (
              <option key={p["ID PROYECTO"]} value={p["ID PROYECTO"]}>
                {p["NOMBRE PROYECTO"]}
              </option>
            ))}
          </select>
        </div>

        {/* DESTINO */}
        <input
          type="text"
          placeholder="Destino"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          style={{ width: "100%", marginTop: "10px" }}
        />

        {/* KM + PRECIO + IMPORTE */}
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <input
            type="number"
            placeholder="Km ida y vuelta"
            value={km}
            onChange={(e) => setKm(e.target.value)}
            style={{ flex: 1 }}
          />

          <div
            style={{
              flex: 1,
              padding: "10px",
              background: "#f3f4f6",
              borderRadius: "6px",
            }}
          >
            Precio/Km: <strong>{precioKm.toFixed(2)} €</strong>
          </div>

          <div
            style={{
              flex: 1,
              padding: "10px",
              background: "#f3f4f6",
              borderRadius: "6px",
            }}
          >
            Importe: <strong>{importe.toFixed(2)} €</strong>
          </div>
        </div>

        {/* OBSERVACIONES */}
        <textarea
          placeholder="Observaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          style={{ width: "100%", marginTop: "10px" }}
        />

        <button type="submit" style={{ marginTop: "10px" }}>
          Guardar kilometraje
        </button>
      </form>
    </div>
  );
}