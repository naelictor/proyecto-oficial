async function iniciarSesion(evento) {
  evento.preventDefault();

  const usuario = document.querySelector("#usuarioLogin").value.trim();
  const contrasena = document.querySelector("#passwordLogin").value;
  const mensaje = document.querySelector("#loginError");

  try {
    const respuesta = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, contrasena }),
    });
    const datos = await respuesta.json();

    if (!respuesta.ok)
      throw new Error(datos.error || "No se pudo iniciar sesión.");

    sessionStorage.setItem("sesionDemo", "activa");
    sessionStorage.setItem("token", datos.token);
    window.location.href = "registros.html";
  } catch (error) {
    mensaje.textContent = error.message;
  }
}

function cerrarSesion() {
  sessionStorage.removeItem("sesionDemo");
  sessionStorage.removeItem("token");
  window.location.href = "index.html";
}

function protegerPanel() {
  if (sessionStorage.getItem("sesionDemo") !== "activa") {
    window.location.href = "index.html";
  }
}

function activarMenuMovil() {
  document.querySelectorAll(".navbar .nav-link").forEach((enlace) => {
    enlace.addEventListener("click", () => {
      const menu = document.querySelector(".navbar-collapse.show");
      if (menu) bootstrap.Collapse.getOrCreateInstance(menu).hide();
    });
  });
}

function mostrarIndicadorDeCarga() {
  const indicador = document.querySelector("#loader");
  if (!indicador) return;

  const ocultar = () => {
    indicador.classList.add("loader--oculto");
  };

  if (document.readyState === "complete") ocultar();
  else window.addEventListener("load", ocultar, { once: true });

  setTimeout(ocultar, 1200);
}

function prepararGaleria() {
  const contenedor = document.querySelector(".gallery-showcase");

  const fotos = [
    [
      "colegio",
      "imagenes/imagen-frente-colegio.png",
      "Nuestra casa de estudios",
    ],
    [
      "colegio",
      "imagenes/6dc11c2c-47e8-43bb-9634-f03996b6d31e.jpg",
      "Nuestra comunidad",
    ],
    [
      "colegio",
      "imagenes/26659f84-ab35-42fe-b3e2-9f4924deec4a.jpg",
      "Aprender juntos",
    ],
    [
      "colegio",
      "imagenes/897a7a94-b7ff-40aa-87ff-4c547bc795a6.jpg",
      "Espacios para crecer",
    ],
    [
      "colegio",
      "imagenes/25db3add-4c7e-4bf6-a4c1-100e771026cc.jpg",
      "Experiencia escolar",
    ],
  
    [
      "deporte",
      "imagenes/WhatsApp Image 2026-09-03 at 06.55.55.jpeg",
      "Pasión en la cancha",
    ],
    [
      "deporte",
      "imagenes/WhatsApp Image 2026-09-03 at 06.55.55 (1).jpeg",
      "Encuentro estudiantil",
    ],

    [
      "identidad",
      "imagenes/f4a2f48a-27e3-4a82-9827-e9b2d58798d0.jpg",
      "Orgullo Socavón",
    ],
    [
      "identidad",
      "imagenes/a0153e1d-133a-432a-b4f1-c2369384ac4a.jpg",
      "Tradición Socavón",
    ],
    [
      "identidad",
      "imagenes/e076c81d-a74f-40d9-afce-2495fdee8594.jpg",
      "Somos comunidad",
    ],
    [
      "identidad",
      "imagenes/000cff73-567a-4e54-a94f-3a8ef92b00eb.jpg",
      "Compromiso y valores",
    ],
  ];

  if (contenedor) {
    contenedor.innerHTML = fotos
      .map(
        ([categoria, ruta, titulo], indice) => `
          <button class="gallery-card ${indice === 0 ? "gallery-card--featured" : ""}" data-category="${categoria}" data-image="${ruta}" data-title="${titulo}" type="button">
            <img src="${ruta}" alt="${titulo}" loading="lazy" />
            <span><small>${categoria.toUpperCase()}</small><strong>${titulo}</strong><i class="bi bi-arrows-fullscreen"></i></span>
          </button>`,
      )
      .join("");
  }

  const tarjetas = document.querySelectorAll(".gallery-card");
  const filtros = document.querySelectorAll(".gallery-filter");
  const lightbox = document.querySelector("#lightbox");

  if (!tarjetas.length || !lightbox) return;

  const imagen = document.querySelector("#lightboxImage");
  const titulo = document.querySelector("#lightboxTitle");

  tarjetas.forEach((tarjeta) => {
    tarjeta.addEventListener("click", () => {
      imagen.src = tarjeta.dataset.image;
      imagen.alt = tarjeta.dataset.title;
      titulo.textContent = tarjeta.dataset.title;
      lightbox.classList.add("lightbox--visible");
      lightbox.setAttribute("aria-hidden", "false");
    });
  });

  filtros.forEach((filtro) => {
    filtro.addEventListener("click", () => {
      filtros.forEach((boton) => boton.classList.remove("is-active"));
      filtro.classList.add("is-active");

      tarjetas.forEach((tarjeta) => {
        const visible =
          filtro.dataset.filter === "todos" ||
          tarjeta.dataset.category === filtro.dataset.filter;
        tarjeta.classList.toggle("gallery-card--hidden", !visible);
      });
    });
  });

  const cerrar = () => {
    lightbox.classList.remove("lightbox--visible");
    lightbox.setAttribute("aria-hidden", "true");
  };

  document.querySelector(".lightbox__close").addEventListener("click", cerrar);
  lightbox.addEventListener("click", (evento) => {
    if (evento.target === lightbox) cerrar();
  });
}

function prepararCarruselPrincipal() {
  const diapositivas = [...document.querySelectorAll(".hero-slide")];
  const puntos = document.querySelector("#heroDots");
  const anterior = document.querySelector("#heroPrev");
  const siguiente = document.querySelector("#heroNext");

  if (!diapositivas.length || !puntos) return;

  let actual = 0;
  const irA = (indice) => {
    actual = (indice + diapositivas.length) % diapositivas.length;
    diapositivas.forEach((diapositiva, posicion) => {
      diapositiva.classList.toggle("is-active", posicion === actual);
    });
    puntos.querySelectorAll("button").forEach((punto, posicion) => {
      punto.classList.toggle("is-active", posicion === actual);
    });
  };

  diapositivas.forEach((_diapositiva, indice) => {
    const punto = document.createElement("button");
    punto.type = "button";
    punto.ariaLabel = `Ver imagen ${indice + 1}`;
    punto.addEventListener("click", () => irA(indice));
    puntos.appendChild(punto);
  });

  anterior.addEventListener("click", () => irA(actual - 1));
  siguiente.addEventListener("click", () => irA(actual + 1));
  irA(0);
  setInterval(() => irA(actual + 1), 5000);
}

function activarBotonesDelPanel() {
  document
    .querySelectorAll(".panel-link, .dashboard-hero + .row .btn")
    .forEach((boton) => {
      boton.addEventListener("click", () => {
        boton.classList.add("is-pressed");
        setTimeout(() => boton.classList.remove("is-pressed"), 250);
      });
    });
}

function activarPanelAdministrativo() {
  const pestañas = document.querySelectorAll(".admin-tab");
  const paneles = document.querySelectorAll(".admin-panel");
  const toast = document.querySelector("#demoToast");

  pestañas.forEach((pestaña) => {
    pestaña.addEventListener("click", () => {
      pestañas.forEach((item) => item.classList.remove("is-active"));
      paneles.forEach((item) => item.classList.remove("is-active"));
      pestaña.classList.add("is-active");
      document
        .querySelector(`#${pestaña.dataset.panel}`)
        .classList.add("is-active");
    });
  });

  const token = sessionStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  const avisar = (mensaje, error = false) => {
    toast.querySelector("span").textContent = mensaje;
    toast.classList.toggle("demo-toast--error", error);
    toast.classList.add("demo-toast--visible");
    setTimeout(() => toast.classList.remove("demo-toast--visible"), 3000);
  };
  const escapar = (texto) => {
    const caracteres = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return String(texto).replace(
      /[&<>"']/g,
      (caracter) => caracteres[caracter],
    );
  };
  const api = async (ruta, opciones = {}) => {
    const respuesta = await fetch(`/api/${ruta}`, {
      ...opciones,
      headers: { "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
       },
    });
    const datos = await respuesta.json();
    if (!respuesta.ok)
      throw new Error(datos.error || "No se pudo realizar la operación");
    return datos;
  };

  const cargarJugadores = async () => {
    const jugadores = await api("jugadores");
    const tabla = document.querySelector("#tablaJugadores");
    tabla.innerHTML =
      jugadores
        .map(
          (j) =>
            `<tr><td><div class="player-cell"><span>${escapar(`${j.nombre[0]}${j.apellido[0]}`)}</span><strong>${escapar(`${j.nombre} ${j.apellido}`)}</strong></div></td><td>${escapar(j.equipo)}</td><td>${escapar(j.curso)}</td><td><b class="status status--green">Habilitado</b></td><td><button class="icon-action edit-item" data-type="jugadores" data-id="${j.id}" data-item="${encodeURIComponent(JSON.stringify(j))}" aria-label="Editar jugador"><i class="bi bi-pencil"></i></button><button class="icon-action delete-item" data-type="jugadores" data-id="${j.id}" aria-label="Eliminar jugador"><i class="bi bi-trash"></i></button></td></tr>`,
        )
        .join("") ||
      `<tr><td colspan="5">Aún no hay jugadores registrados.</td></tr>`;
  };
  const cargarPartidos = async () => {
    const partidos = await api("partidos");
    const lista = document.querySelector("#listaPartidos");
    if (lista) {
      lista.innerHTML = partidos.length > 0 ? 
      partidos.map((p) => {
          const fecha = new Date(`${p.fecha}T12:00:00`);
          return `<article><time><strong>${fecha.getDate()}</strong><span>${fecha.toLocaleString("es", { month: "short" }).replace(".", "").toUpperCase()}</span></time><div><small>${escapar(p.categoria)} · ${escapar(p.cancha)}</small><h3>${escapar(p.local)} <b>VS</b> ${escapar(p.visitante)}</h3><p><i class="bi bi-clock"></i> ${escapar(p.hora)}</p></div><button class="icon-action edit-item" data-type="partidos" data-id="${p.id}" data-item="${encodeURIComponent(JSON.stringify(p))}" aria-label="Editar partido"><i class="bi bi-pencil"></i></button><button class="icon-action delete-item" data-type="partidos" data-id="${p.id}" aria-label="Eliminar partido"><i class="bi bi-trash"></i></button></article>`;
        }).join(""):
        "<p>No hay partidos programados.</p>";
    }
        const vista = document.querySelector("#Partidos-vista");
        if (vista) {
          vista.innerHTML =
          partidos.length > 0 ?
          partidos.map((p) => {
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
          }).join(""): "<p>No hay partidos en vista.</p>";
        }
  };
  document.addEventListener("DOMContentLoaded", cargarPartidos);

  const cargarAnuncios = async () => {
    const anuncios = await api("anuncios");
    const lista = document.querySelector("#listaAnuncios");
    if (lista) {
      lista.innerHTML = anuncios.length > 0 ?
      anuncios.map((a) =>
            `<article><span class="notice-list__icon"><i class="bi bi-megaphone-fill"></i></span><div><small>${new Date(`${a.creado_en}Z`).toLocaleDateString("es")}</small><h3>${escapar(a.titulo)}</h3><p>${escapar(a.contenido)}</p></div><button class="icon-action edit-item" data-type="anuncios" data-id="${a.id}" data-item="${encodeURIComponent(JSON.stringify(a))}" aria-label="Editar anuncio"><i class="bi bi-pencil"></i></button><button class="icon-action delete-item" data-type="anuncios" data-id="${a.id}" aria-label="Eliminar anuncio"><i class="bi bi-trash"></i></button></article>`,
        ).join(""): "<p>No hay anuncios publicados.</p>";
    }
        const vista = document.querySelector("#Anuncios");
        if (vista) {
          vista.innerHTML = anuncios.length > 0 ? 
          anuncios.map((a) => `
          <article>
          <div class="bg-light rounded text-dark p-2 my-2">
            <h3 class="fw-bold">${escapar(a.titulo)}</h3>
            <p class="text-muted">${escapar(a.contenido)}</p>
          </div>
          </article>
          `).join(""): "<p>No hay anuncios en vista.</p>";
        }
  };
  document.addEventListener("DOMContentLoaded", () => {
    cargarAnuncios();
  });


  const cargarTodo = async () => {
    try {
      await cargarJugadores(); } catch (e){ console.error("Jugadores:", e); }
      try { await cargarPartidos(); } catch (e) { console.error("Partidos:", e);}
      try { await cargarAnuncios(); } catch (e) { console.error("Anuncios:", e); }
  };

  document.querySelector("#formJugador")
    ?.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      try {
        await api("jugadores", {
          method: "POST",
          body: JSON.stringify({
            nombre: document.querySelector("#jugadorNombre").value,
            apellido: document.querySelector("#jugadorApellido").value,
            edad: document.querySelector("#jugadorEdad").value,
            ci: document.querySelector("#jugadorCi").value,
            curso: document.querySelector("#jugadorCurso").value,
            nacimiento: document.querySelector("#jugadorNacimiento").value,
            categoria: document.querySelector("#jugadorCategoria").value,
            celular: document.querySelector("#jugadorCelular").value,
            equipo: document.querySelector("#jugadorEquipo").value,
            estado: "Habilitado",
          }),
        });
        evento.target.reset();
        await cargarJugadores();
        avisar("Jugador registrado correctamente.");
      } catch (error) {
        avisar(error.message, true);
      }
    });
  document.querySelector("#formPartido")?.addEventListener("submit", async (e) => {
      e.preventDefault();
        await api("partidos", {
          method: "POST",
          body: JSON.stringify({
            local: document.querySelector("#partidoLocal").value,
            visitante: document.querySelector("#partidoVisitante").value,
            fecha: document.querySelector("#partidoFecha").value,
            hora: document.querySelector("#partidoHora").value,
            cancha: document.querySelector("#partidoCancha").value,
            categoria: "Futsal",
          }),
        });
        e.target.reset();
        cargarPartidos();
    });

  document.querySelector("#formAnuncio")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    await api("anuncios", {
      method: "POST",
      body: JSON.stringify({
        titulo: document.querySelector("#anuncioTitulo").value,
        contenido: document.querySelector("#anuncioContenido").value,
      }),
    });
    e.target.reset();
    cargarAnuncios();
  });

  document.addEventListener("click", async (evento) => {
    const editar = evento.target.closest(".edit-item");
    if (editar) {
      const item = JSON.parse(decodeURIComponent(editar.dataset.item));
      let datos;
      if (editar.dataset.type === "jugadores") {
        const nombre = prompt("Nombres:", item.nombre);
        if (nombre === null) return;
        const apellido = prompt("Apellidos:", item.apellido);
        if (apellido === null) return;
        const equipo = prompt("Equipo:", item.equipo);
        if (equipo === null) return;
        datos = { ...item, nombre, apellido, equipo };
      } else if (editar.dataset.type === "partidos") {
        const local = prompt("Equipo local:", item.local);
        if (local === null) return;
        const visitante = prompt("Equipo visitante:", item.visitante);
        if (visitante === null) return;
        datos = { ...item, local, visitante };
      } else {
        const titulo = prompt("Título:", item.titulo);
        if (titulo === null) return;
        const contenido = prompt("Mensaje:", item.contenido);
        if (contenido === null) return;
        datos = { ...item, titulo, contenido };
      }
      try {
        await api(`${editar.dataset.type}/${editar.dataset.id}`, {
          method: "PUT",
          body: JSON.stringify(datos),
        });
        await cargarTodo();
        avisar("Registro actualizado.");
      } catch (error) {
        avisar(error.message, true);
      }
      return;
    }
    const boton = evento.target.closest(".delete-item");
    if (!boton || !confirm("¿Seguro que deseas eliminar este registro?"))
      return;
    try {
      await api(`${boton.dataset.type}/${boton.dataset.id}`, {
        method: "DELETE",
      });
      await cargarTodo();
      avisar("Registro eliminado.");
    } catch (error) {
      avisar(error.message, true);
    }
  });
  document
    .querySelector("#buscarJugadores")
    ?.addEventListener("input", (evento) => {
      const texto = evento.target.value.toLowerCase();
      document.querySelectorAll("#tablaJugadores tr").forEach((fila) => {
        fila.hidden = !fila.textContent.toLowerCase().includes(texto);
      });
    });
  document.querySelector("#generarRol")?.addEventListener("click", () => {
    avisar("Registra los encuentros desde el formulario para armar el rol.");
  });
  cargarTodo();
}

document.addEventListener("DOMContentLoaded", () => {
  activarMenuMovil();
  mostrarIndicadorDeCarga();
  prepararGaleria();
  prepararCarruselPrincipal();
  activarBotonesDelPanel();
  activarPanelAdministrativo();
});
