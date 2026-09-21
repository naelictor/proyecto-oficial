const cargarPartidos = async () => {
    const partidos = await api("partidos");
    document.querySelector("#vistaPartidos").innerHTML =
      partidos
        .map((p) => {
          const fecha = new Date(`${p.fecha}T12:00:00`);
          return `<div class="schedule-card__head">
                    <span>Próximo encuentro</span></div>
                    <div class="schedule-card__match">
                      <div>
                        <span>${fecha.toLocaleString("es", { month: "short" }).replace(".", "").toUpperCase()}</span></time>
                        <div><small>${escapar(p.categoria)} · ${escapar(p.cancha)}</small></div>
                        <h3 class="fw-bold">${escapar(p.local)} <b>VS</b> ${escapar(p.visitante)}</h3>
                      </div>
                      <div>
                      <p><i class="bi bi-clock"></i> ${escapar(p.hora)}</p>
                      </div>
                    </div>`;
        })
        .join("") || "<p>No hay partidos programados.</p>";
  };