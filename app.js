
let appData = { branding: {}, actualHours: {}, plannedHours: {}, calendarNotes: {}, theme: {}, files: {} };
let currentServiceYear = 2026; // Default/Current

// Folder structure mapping
const directoryFolders = {
    'vida-ministerio': { title: 'Vida y Ministerio', code: '1' },
    'reunion-publica': { title: 'Reunión Pública', code: '2' },
    'plataforma': { title: 'Plataforma', code: '3' },
    'microfonos': { title: 'Micrófonos', code: '4' },
    'responsabilidades': { title: 'Responsabilidades', code: '8' },
    'territorios': { title: 'Territorios', code: '5' },
    'backup': { title: 'Copias de Seguridad', code: '16' },
    'asambleas': { title: 'Asambleas', code: '11' },
    'conmemoracion': { title: 'Conmemoración', code: '13' },
    'super': { title: 'Visita del Super', code: '12' },
    'campanas': { title: 'Campañas', code: '14' }
};

// UI Element References
const state = {
    elements: {},
    activeSection: 'dashboard',
    activeInformeTab: 'generar',
    calendarOffset: 0
};

function initElements() {
    state.elements = {
        viewport: document.getElementById('viewport'),
        modal: document.getElementById('sectionModal'),
        modalTitle: document.getElementById('modalTitle'),
        modalGrid: document.getElementById('modalGrid'),
        closeModal: document.querySelector('.close-modal'),
        fileUpload: document.getElementById('fileUpload')
    };
}

async function init() {
    console.log("🚀 Starting Antigravity Premium...");
    try {
        initElements();
        setupListeners();
        // Fallback appData if fetch takes too long or fails
        appData = appData || { branding: {}, actualHours: {}, plannedHours: {}, calendarNotes: {}, theme: {}, files: {} };
        await loadBackupData();
        renderDashboard();
    } catch (err) {
        console.error("❌ Critical Init Error:", err);
        // Show a basic recovery UI
        if (document.getElementById('viewport')) {
            document.getElementById('viewport').innerHTML = `<div style="padding:50px; text-align:center;"><h2>Error al cargar la aplicación</h2><p>${err.message}</p><button onclick="location.reload()" class="btn-primary">REINTENTAR</button></div>`;
        }
    }
}

async function loadBackupData() {
    try {
        // Miramos si hay datos guardados por ti
        const savedData = localStorage.getItem('marbella_data_backup');
        if (savedData) {
            appData = JSON.parse(savedData);
            applyBranding();
            determineCurrentServiceYear();
            return;
        }
        // Si no, buscamos el archivo normal
        const response = await fetch('marbella_backup.json');
        if (response.ok) {
            appData = await response.json();
            applyBranding();
            determineCurrentServiceYear();
        }
    } catch (e) {
        console.error("Error cargando datos", e);
    }
}

function determineCurrentServiceYear() {
    const now = new Date();
    const month = now.getMonth(); // 0-11 (Jan-Dec)
    const year = now.getFullYear();
    // Service year 2026 starts in Sept 2025.
    // If month >= 8 (Sept), the service year is current year + 1.
    currentServiceYear = (month >= 8) ? year + 1 : year;
}

function setupListeners() {
    // Modal
    if (state.elements.closeModal) {
        state.elements.closeModal.onclick = () => {
            if (state.elements.modal) state.elements.modal.style.display = 'none';
        };
    }

    // Import
    if (state.elements.fileUpload) {
        state.elements.fileUpload.onchange = handleImport;
    }
}

function applyBranding() {
    if (!appData) return;
    const b = appData.branding || {};

    // Defensive selectors
    const brandName = document.querySelector('.brand-name');
    const brandSub = document.querySelector('.brand-sub');
    const userName = document.querySelector('.user-name');

    if (brandName) brandName.textContent = b.title || "Antigravity";
    if (brandSub) brandSub.textContent = b.subTitle || "Marbella Oeste";
    if (userName) userName.textContent = b.reportName || "Usuario";

    // Theme Variables
    const theme = appData.theme || {};
    const root = document.documentElement;
    const variables = {
        '--primary': theme.primary || '#4f46e5',
        '--primary-light': theme.accent || '#818cf8',
        '--bg-dark': theme.bg || '#0f172a',
        '--sidebar-bg': theme.sidebar || '#1e293b',
        '--text-main': theme.text || '#f8fafc',
        '--glass-bg': theme.cardBg || 'rgba(255, 255, 255, 0.03)',
        '--folder-color': theme.folderColor || theme.primary || '#4f46e5',
        '--logo-bg': theme.logoBg || `linear-gradient(135deg, ${theme.primary || '#4f46e5'}, ${theme.accent || '#818cf8'})`
    };

    Object.entries(variables).forEach(([key, val]) => root.style.setProperty(key, val));

    // Update logo text
    const topLogo = document.getElementById('topLogo');
    if (topLogo && b.logoInitials) topLogo.textContent = b.logoInitials;
    else if (!topLogo) {
        // Fallback to class if ID missing
        const logoBox = document.querySelector('.logo-box');
        if (logoBox && b.logoInitials) logoBox.textContent = b.logoInitials;
    }
}

function updateTheme(key, value) {
    if (!appData.theme) appData.theme = {};
    appData.theme[key] = value;
    applyBranding();
}

// --- CUSTOM DIALOGS ---
function showAlert(message, type = 'success') {
    state.elements.modalTitle.textContent = "Antigravity - Aviso";
    state.elements.modalGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 20px;">
            <div style="font-size: 3rem; color: ${type === 'success' ? 'var(--success)' : 'var(--danger)'}; margin-bottom: 20px;">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
            </div>
            <p style="font-size: 1.2rem; line-height: 1.6; margin-bottom: 30px;">${message}</p>
            <button class="btn-primary" onclick="state.elements.modal.style.display='none'" style="background: var(--primary); padding: 0 40px; height: 50px; border-radius: 12px; border:none; color:white; font-weight:600; cursor:pointer;"> ENTENDIDO </button>
        </div>
    `;
    state.elements.modal.style.display = 'flex';
}

function showConfirm(message, onConfirm) {
    state.elements.modalTitle.textContent = "Confirmación";
    state.elements.modalGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 20px;">
            <div style="font-size: 3rem; color: var(--primary); margin-bottom: 20px;">
                <i class="fas fa-question-circle"></i>
            </div>
            <p style="font-size: 1.2rem; line-height: 1.6; margin-bottom: 30px;">${message}</p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="confirmBtnOk" class="btn-primary" style="background: var(--primary); padding: 0 40px; height: 50px; border-radius: 12px; border:none; color:white; font-weight:600; cursor:pointer;"> ACEPTAR </button>
                <button id="confirmBtnCancel" class="btn-primary" style="background: rgba(255,255,255,0.1); padding: 0 40px; height: 50px; border-radius: 12px; border:none; color:white; font-weight:600; cursor:pointer;"> CANCELAR </button>
            </div>
        </div>
    `;
    state.elements.modal.style.display = 'flex';
    document.getElementById('confirmBtnOk').onclick = () => {
        state.elements.modal.style.display = 'none';
        onConfirm();
    };
    document.getElementById('confirmBtnCancel').onclick = () => {
        state.elements.modal.style.display = 'none';
    };
}

function updateBranding(key, val) {
    if (!appData.branding) appData.branding = {};
    appData.branding[key] = val;
    applyBranding();
}

function navigateTo(id) {
    document.body.classList.remove('pdf-view-active');
    state.activeSection = id;
    if (id === 'dashboard') renderDashboard();
    else if (id === 'reuniones') renderViewReuniones();
    else if (id === 'predicacion') renderViewPredicacion();
    else if (id === 'panel-principal') renderPanelPrincipal();
    else if (id === 'informes') renderInformes('generar');
    else if (id === 'calendario') renderCalendario();
    else if (id === 'configuracion') renderConfiguracion();
    else if (id === 'eventos') renderViewEventos();
    else if (id === 'backup') renderBackupSection();
    else if (id === 'calendario-asignaciones') renderCalendarioAsignaciones();
    else if (directoryFolders[id]) openActivitySection(id);
    else renderPlaceholder(id);
}

// --- VIEW RENDERING ---

function renderDashboard() {
    const branding = appData.branding || {};
    const firstName = branding.reportName ? branding.reportName.split(' ')[0] : "Endika";

    state.elements.viewport.innerHTML = `
        <div class="fade-in" style="padding: 40px;">
            <header class="section-hero">
                <h1>Hola, ${firstName} 👋</h1>
                <p>¿Qué vamos a gestionar hoy?</p>
            </header>

            <div class="main-grid" style="grid-template-columns: repeat(2, 1fr);">
                <div class="pastilla" onclick="navigateTo('reuniones')">
                    <div class="pastilla-icon"><i class="fas fa-users"></i></div>
                    <h2>Reuniones</h2>
                    <p>Vida y Ministerio, Reunión Pública, Plataforma, Micrófonos y Responsabilidades.</p>
                </div>
                
                <div class="pastilla" onclick="navigateTo('predicacion')">
                    <div class="pastilla-icon"><i class="fas fa-briefcase"></i></div>
                    <h2>Predicación</h2>
                    <p>Informes de servicio, Calendario, Territorios y Panel Principal.</p>
                </div>

                <div class="pastilla" onclick="navigateTo('eventos')">
                    <div class="pastilla-icon"><i class="fas fa-star-of-life"></i></div>
                    <h2>Eventos Especiales</h2>
                    <p>Asambleas, Conmemoración, Visita del Super y Campañas especiales.</p>
                </div>

                <div class="pastilla" onclick="navigateTo('configuracion')">
                    <div class="pastilla-icon"><i class="fas fa-cog"></i></div>
                    <h2>Configuración</h2>
                    <p>Personaliza colores, nombres, temas y marcas.</p>
                </div>

                <div class="pastilla" onclick="navigateTo('calendario-asignaciones')" style="grid-column: 1/-1;">
                    <div class="pastilla-icon"><i class="fas fa-calendar-check"></i></div>
                    <h2>Calendario de Asignaciones</h2>
                    <p>Todas las notas de Reuniones y Eventos Especiales centralizadas en un solo calendario.</p>
                </div>
            </div>

            <div class="content-row" style="margin-top: 60px; border-top: 1px solid var(--glass-border); padding-top: 40px;">
                <div class="modern-card notes-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 class="card-title"><i class="fas fa-sticky-note"></i> Notas Recientes</h2>
                        <button class="nav-btn active" style="width: auto;" onclick="navigateTo('calendario-asignaciones')">Ver todas</button>
                    </div>
                    <div id="dashboardNotesList" class="notes-list">
                        ${renderRecentNotes()}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderViewReuniones() {
    state.elements.viewport.innerHTML = `
        <div class="fade-in" style="padding: 40px;">
            ${renderBackButton()}
            <header class="section-header" style="margin-bottom: 40px;">
                <h2>Reuniones y Asignaciones</h2>
                <p>Accede a la gestión de archivos y responsabilidades de la congregación.</p>
            </header>

            <div class="dashboard-grid">
                <div class="modern-card stats-card" onclick="navigateTo('vida-ministerio')">
                    <div class="card-icon"><i class="fas fa-book-open"></i></div>
                    <h3>Vida y Ministerio</h3>
                </div>
                <div class="modern-card stats-card" onclick="navigateTo('reunion-publica')">
                    <div class="card-icon"><i class="fas fa-users-viewfinder"></i></div>
                    <h3>Reunión Pública</h3>
                </div>
                <div class="modern-card stats-card" onclick="navigateTo('plataforma')">
                    <div class="card-icon"><i class="fas fa-chalkboard"></i></div>
                    <h3>Plataforma</h3>
                </div>
                <div class="modern-card stats-card" onclick="navigateTo('microfonos')">
                    <div class="card-icon"><i class="fas fa-microphone"></i></div>
                    <h3>Micrófonos</h3>
                </div>
                <div class="modern-card stats-card" onclick="navigateTo('responsabilidades')">
                    <div class="card-icon"><i class="fas fa-tasks"></i></div>
                    <h3>Responsabilidades</h3>
                </div>
            </div>
        </div>
    `;
}

function renderViewPredicacion() {
    state.elements.viewport.innerHTML = `
        <div class="fade-in" style="padding: 40px;">
            ${renderBackButton()}
            <header class="section-header" style="margin-bottom: 40px;">
                <h2>Predicación</h2>
                <p>Gestiona tus informes de servicio, programa mensual y territorios.</p>
            </header>

            <div class="dashboard-grid">
                <div class="modern-card stats-card" onclick="navigateTo('panel-principal')">
                    <div class="card-icon"><i class="fas fa-th-large"></i></div>
                    <h3>Panel Principal</h3>
                </div>
                <div class="modern-card stats-card" onclick="navigateTo('informes')">
                    <div class="card-icon"><i class="fas fa-chart-line"></i></div>
                    <h3>Informes</h3>
                </div>
                <div class="modern-card stats-card" onclick="navigateTo('calendario')">
                    <div class="card-icon"><i class="fas fa-calendar-alt"></i></div>
                    <h3>Calendario</h3>
                </div>
                <div class="modern-card stats-card" onclick="navigateTo('territorios')">
                    <div class="card-icon"><i class="fas fa-map-marked-alt"></i></div>
                    <h3>Territorios</h3>
                </div>
            </div>
        </div>
    `;
}

function renderViewEventos() {
    state.elements.viewport.innerHTML = `
        <div class="fade-in" style="padding: 40px;">
            ${renderBackButton()}
            <header class="section-header" style="margin-bottom: 40px;">
                <h2>Eventos Especiales</h2>
                <p>Gestiona archivos y notas para eventos clave del año.</p>
            </header>

            <div class="dashboard-grid">
                <div class="modern-card stats-card" onclick="navigateTo('asambleas')">
                    <div class="card-icon"><i class="fas fa-landmark"></i></div>
                    <h3>Asambleas</h3>
                </div>
                <div class="modern-card stats-card" onclick="navigateTo('conmemoracion')">
                    <div class="card-icon"><i class="fas fa-wine-glass-alt"></i></div>
                    <h3>Conmemoración</h3>
                </div>
                <div class="modern-card stats-card" onclick="navigateTo('super')">
                    <div class="card-icon"><i class="fas fa-user-check"></i></div>
                    <h3>Visita del Super</h3>
                </div>
                <div class="modern-card stats-card" onclick="navigateTo('campanas')">
                    <div class="card-icon"><i class="fas fa-bullhorn"></i></div>
                    <h3>Campañas</h3>
                </div>
                <div class="modern-card stats-card" style="background: var(--glass-bg);" onclick="navigateTo('calendario')">
                    <div class="card-icon"><i class="fas fa-calendar-alt"></i></div>
                    <h3>Calendario y Notas</h3>
                </div>
            </div>
        </div>
    `;
}

function renderPanelPrincipal() {
    const stats = getServiceYearStats();
    const branding = appData.branding || {};
    state.elements.viewport.innerHTML = `
        <div class="fade-in" style="padding: 40px;">
            <div class="back-btn-container">
                <button class="btn-back" onclick="navigateTo('predicacion')">
                    <i class="fas fa-arrow-left"></i> ATRÁS
                </button>
            </div>
            <header class="section-hero">
                <h1>Panel de Servicio</h1>
                <p>Resumen de actividad del año de servicio 2025 - 2026.</p>
            </header>

            <div class="dashboard-grid" style="margin-top: 50px;">
                <div class="modern-card stats-card" style="background: linear-gradient(135deg, var(--primary), #6366f1);" onclick="renderServiceDetails('casa')">
                    <div class="card-icon"><i class="fas fa-home"></i></div>
                    <div class="stat-info">
                        <h3>De casa en casa</h3>
                        <p class="stat-value">${stats.actual.casa}h</p>
                        <span class="stat-label">Meta: ${stats.planned.casa}h</span>
                    </div>
                </div>
                <div class="modern-card stats-card" style="background: linear-gradient(135deg, #ec4899, #f43f5e);" onclick="renderServiceDetails('exhibidor')">
                    <div class="card-icon"><i class="fas fa-store"></i></div>
                    <div class="stat-info">
                        <h3>Exhibidores</h3>
                        <p class="stat-value">${stats.actual.exhibidor}h</p>
                        <span class="stat-label">Meta: ${stats.planned.exhibidor}h</span>
                    </div>
                </div>
                <div class="modern-card stats-card" style="background: linear-gradient(135deg, #06b6d4, #3b82f6);" onclick="renderServiceDetails('zoom')">
                    <div class="card-icon"><i class="fas fa-video"></i></div>
                    <div class="stat-info">
                        <h3>Zoom / Otros</h3>
                        <p class="stat-value">${stats.actual.zoom}h</p>
                        <span class="stat-label">Meta: ${stats.planned.zoom}h</span>
                    </div>
                </div>
            </div>

            <div class="modern-card progress-card" style="margin-top: 30px;">
                <h2 class="card-title"><i class="fas fa-chart-pie"></i> Progreso Total</h2>
                <div class="progress-container" style="margin-top: 20px;">
                    <div class="progress-info" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>Horas Acumuladas</span>
                        <span>${stats.actual.total}h / ${stats.planned.total}h</span>
                    </div>
                    <div class="progress-bar-bg" style="height: 12px; background: var(--glass-bg); border-radius: 10px; overflow: hidden;">
                        <div class="progress-bar-fill" style="width: ${Math.min(100, (stats.actual.total / stats.planned.total) * 100)}%; height: 100%; background: var(--primary); box-shadow: 0 0 15px var(--primary);"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderBackButton() {
    return `
        <div class="back-btn-container">
            <button class="btn-back" onclick="renderDashboard()">
                <i class="fas fa-arrow-left"></i> ATRÁS
            </button>
        </div>
    `;
}

function renderInformes(tab = 'generar') {
    state.activeInformeTab = tab;

    state.elements.viewport.innerHTML = `
        <div class="fade-in">
            ${renderBackButton()}
            <header class="section-header" style="margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
                    <h2>Gestión de Informes</h2>
                    <div class="tabs-ui">
                        <button class="tab-btn ${tab === 'generar' ? 'active' : ''}" onclick="renderInformes('generar')">Informe Mensual</button>
                        <button class="tab-btn ${tab === 'previstas' ? 'active' : ''}" onclick="renderInformes('previstas')">Horas Previstas</button>
                        <button class="tab-btn ${tab === 'reales' ? 'active' : ''}" onclick="renderInformes('reales')">Horas Reales</button>
                        <button class="tab-btn ${tab === 'faltan' ? 'active' : ''}" onclick="renderInformes('faltan')">Horas que Faltan</button>
                        <button class="tab-btn ${tab === 'resumen-mensual' ? 'active' : ''}" onclick="renderInformes('resumen-mensual')">Resumen Mensual</button>
                    </div>
                </div>
            </header>

            <div class="tab-content">
                ${renderInformeTabContent(tab)}
            </div>
        </div>
    `;
}

function renderInformeTabContent(tab) {
    if (tab === 'generar') return renderGenerarInforme();
    if (tab === 'previstas') return renderHorasGrid('plannedHours');
    if (tab === 'reales') return renderHorasGrid('actualHours');
    if (tab === 'faltan') return renderHorasFaltan();
    if (tab === 'resumen-mensual') return renderResumenMensual();
}

function renderGenerarInforme() {
    const branding = appData.branding || {};
    const defaultName = branding.reportName || "Endika Saratxo";
    const now = new Date();
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const currentMonthIdx = now.getMonth();
    const currentMonthStr = months[currentMonthIdx];

    // Auto-calculate hours for current month
    const stats = getMonthlyStats(currentMonthIdx, now.getFullYear());

    return `
        <div class="fade-in" style="display: flex; justify-content: center; padding: 20px;">
            <div id="printableInforme" class="premium-report-card">
                <style>
                    @media print {
                        body { background: white !important; color: black !important; }
                        .premium-report-card { border: none !important; box-shadow: none !important; margin: 0 !important; width: 100% !important; }
                        .no-print { display: none !important; }
                    }
                </style>
                <div class="report-decoration"></div>
                <h2 style="font-size: 2rem; margin-bottom: 10px; color: var(--primary);">INFORME MENSUAL</h2>
                <div style="width: 60px; height: 4px; background: var(--primary); margin: 0 auto 40px; border-radius: 2px;"></div>

                <div class="report-form" style="text-align: left;">
                    <div class="form-group">
                        <label><i class="fas fa-user"></i> Publicador</label>
                        <input type="text" class="report-input" id="infName" value="${defaultName}">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="form-group">
                            <label><i class="fas fa-calendar-alt"></i> Mes</label>
                            <input type="text" class="report-input" id="infMonth" value="${currentMonthStr}" onchange="updateReportAutoHours()">
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-clock"></i> Horas Totales</label>
                            <input type="number" class="report-input" id="infHours" value="${stats.total}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-book-reader"></i> Estudios Bíblicos</label>
                        <input type="number" class="report-input" id="infStudies" placeholder="0">
                    </div>
                </div>

                <div class="no-print" style="margin-top: 50px;">
                    <button class="btn-primary" onclick="window.print()" style="width: 100%; height: 60px; font-size: 1.2rem; border-radius: 20px; background: linear-gradient(135deg, var(--primary), var(--primary-light)); border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                        <i class="fas fa-file-pdf"></i> EXPORTAR INFORME
                    </button>
                </div>
            </div>
        </div>
    `;
}

function updateReportAutoHours() {
    const monthStr = document.getElementById('infMonth').value;
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const idx = months.findIndex(m => m.toLowerCase() === monthStr.toLowerCase());
    if (idx !== -1) {
        const now = new Date();
        const stats = getMonthlyStats(idx, now.getFullYear());
        document.getElementById('infHours').value = stats.total;
    }
}

function renderResumenMensual() {
    const months = ["Septiembre", "Octubre", "Noviembre", "Diciembre", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto"];
    const now = new Date();

    return `
        <div class="modern-card" style="padding: 0; overflow-x: auto;">
            <table class="premium-table">
                <thead>
                    <tr>
                        <th style="text-align: left;">Mes</th>
                        <th>Casa en Casa</th>
                        <th>Exhibidores</th>
                        <th>Zoom</th>
                        <th style="color: var(--primary);">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${months.map(m => {
        const monthIdxMap = { "Enero": 0, "Febrero": 1, "Marzo": 2, "Abril": 3, "Mayo": 4, "Junio": 5, "Julio": 6, "Agosto": 7, "Septiembre": 8, "Octubre": 9, "Noviembre": 10, "Diciembre": 11 };
        const idx = monthIdxMap[m];
        const year = (idx >= 8) ? currentServiceYear - 1 : currentServiceYear;
        const s = getMonthlyStats(idx, year);
        return `
                            <tr>
                                <td style="text-align: left; font-weight: 600;">${m}</td>
                                <td>${s.casa}h</td>
                                <td>${s.exhibidor}h</td>
                                <td>${s.zoom}h</td>
                                <td style="font-weight: 800; color: var(--primary);">${s.total}h</td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function getMonthlyStats(monthIdx, year) {
    const stats = { casa: 0, exhibidor: 0, zoom: 0, total: 0 };
    const hours = appData.actualHours || {};
    Object.keys(hours).forEach(date => {
        const d = new Date(date);
        if (d.getMonth() === monthIdx && d.getFullYear() === year) {
            stats.casa += parseFloat(hours[date].casa) || 0;
            stats.exhibidor += parseFloat(hours[date].exhibidor) || 0;
            stats.zoom += parseFloat(hours[date].zoom) || 0;
        }
    });
    stats.total = stats.casa + stats.exhibidor + stats.zoom;
    return stats;
}

function renderHorasGrid(type) {
    const isPlanned = type === 'plannedHours';
    const months = ["Septiembre", "Octubre", "Noviembre", "Diciembre", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto"];

    return `
        <div class="modern-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <h3>${isPlanned ? 'Calendario de Horas Previstas' : 'Calendario de Horas Reales'}</h3>
                <button class="sub-btn" onclick="automateHours('${type}')"> <i class="fas fa-magic"></i> Automatizar Horarios del Año</button>
            </div>
            
            <div class="service-calendar-grid">
                ${months.map(m => renderMonthServiceCalendar(m, type)).join('')}
            </div>
        </div>
    `;
}

function renderMonthServiceCalendar(monthName, type) {
    const monthIndexMap = { "Enero": 0, "Febrero": 1, "Marzo": 2, "Abril": 3, "Mayo": 4, "Junio": 5, "Julio": 6, "Agosto": 7, "Septiembre": 8, "Octubre": 9, "Noviembre": 10, "Diciembre": 11 };
    const monthIdx = monthIndexMap[monthName];
    const year = (monthIdx >= 8) ? currentServiceYear - 1 : currentServiceYear;

    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
    const firstDay = new Date(year, monthIdx, 1).getDay();
    const padding = (firstDay === 0 ? 6 : firstDay - 1);

    let daysHtml = '';
    for (let i = 0; i < padding; i++) daysHtml += '<div class="cal-day empty"></div>';

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const h = (appData[type] && appData[type][dateStr]) ? appData[type][dateStr] : { casa: 0, exhibidor: 0, zoom: 0, total: 0 };
        const val = parseFloat(h.total) || 0;
        const tooltip = val > 0 ? `title="Casa: ${h.casa}h | Exh: ${h.exhibidor}h | Zoom: ${h.zoom}h"` : "";

        daysHtml += `
            <div class="cal-day ${val > 0 ? 'has-hours' : ''}" onclick="openDayEditor('${dateStr}', '${type}')" ${tooltip}>
                <span class="day-num">${d}</span>
                ${val > 0 ? `<span class="day-val">${val}</span>` : ''}
            </div>
        `;
    }

    return `
        <div class="mini-calendar">
            <h4 class="mini-cal-title">${monthName}</h4>
            <div class="mini-cal-grid">
                <div class="cal-label">L</div><div class="cal-label">M</div><div class="cal-label">M</div><div class="cal-label">J</div><div class="cal-label">V</div><div class="cal-label">S</div><div class="cal-label">D</div>
                ${daysHtml}
            </div>
        </div>
    `;
}

function openDayEditor(date, type = 'actualHours') {
    const hours = (appData[type] && appData[type][date]) ? appData[type][date] : { casa: 0, exhibidor: 0, zoom: 0, total: 0 };
    const note = (appData.calendarNotes && appData.calendarNotes[date]) ? appData.calendarNotes[date] : { text: '', type: 'recordatorio' };

    const d = new Date(date + "T12:00:00"); // Use noon to avoid TZ shift
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const dayName = dayNames[d.getDay()];

    state.elements.modalTitle.textContent = `Detalles: ${date} (${dayName})`;
    state.elements.modalGrid.innerHTML = `
        <div style="grid-column: 1/-1; display: grid; gap: 20px;">
            <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group">
                    <label>De casa en casa</label>
                    <input type="number" class="form-control" id="edit-casa" value="${hours.casa}">
                </div>
                <div class="form-group">
                    <label>Exhibidores</label>
                    <input type="number" class="form-control" id="edit-exhibidor" value="${hours.exhibidor}">
                </div>
                <div class="form-group">
                    <label>Zoom / Otros</label>
                    <input type="number" class="form-control" id="edit-zoom" value="${hours.zoom}">
                </div>
                <div class="form-group">
                    <label>Notas / Asignaciones</label>
                    <input type="text" class="form-control" id="edit-note" value="${note.text}" placeholder="Escribe una nota...">
                </div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px; flex-wrap: wrap;">
                <button class="btn-primary" onclick="saveDayData('${date}', '${type}')" style="background: var(--success); height: 45px; padding: 0 20px;">
                    <i class="fas fa-check"></i> GUARDAR
                </button>
                <button class="btn-primary" onclick="syncDayToYear('${date}', '${type}')" style="background: var(--primary); height: 45px; padding: 0 20px;">
                    <i class="fas fa-sync-alt"></i> REPETIR ESTOS ${dayName.toUpperCase()}
                </button>
                <button class="btn-primary" onclick="state.elements.modal.style.display='none'" style="background: rgba(255,255,255,0.1); height: 45px; padding: 0 20px;">
                    CERRAR
                </button>
            </div>
        </div>
    `;
    if (state.elements.modal) {
        state.elements.modal.style.display = 'flex';
    } else {
        console.error("❌ CRITICAL: Modal element not found in DOM!");
        initElements();
        if (state.elements.modal) state.elements.modal.style.display = 'flex';
    }
}

function saveDayData(date, type) {
    const casa = document.getElementById('edit-casa').value;
    const exhibidor = document.getElementById('edit-exhibidor').value;
    const zoom = document.getElementById('edit-zoom').value;
    const noteText = document.getElementById('edit-note').value;

    if (!appData[type]) appData[type] = {};
    if (!appData[type][date]) appData[type][date] = { casa: 0, exhibidor: 0, zoom: 0, total: 0 };

    appData[type][date].casa = parseFloat(casa) || 0;
    appData[type][date].exhibidor = parseFloat(exhibidor) || 0;
    appData[type][date].zoom = parseFloat(zoom) || 0;
    appData[type][date].total = appData[type][date].casa + appData[type][date].exhibidor + appData[type][date].zoom;

    if (!appData.calendarNotes) appData.calendarNotes = {};
    appData.calendarNotes[date] = { text: noteText, type: 'recordatorio' };

    state.elements.modal.style.display = 'none';

    if (state.activeSection === 'informes') renderInformes(state.activeInformeTab);
    else if (state.activeSection === 'calendario') renderCalendario();
}

function syncDayToYear(date, type) {
    const d = new Date(date + "T12:00:00");
    const dayOfWeek = d.getDay();
    const dayNamesPlural = ["Domingos", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábados"];

    const casa = parseFloat(document.getElementById('edit-casa').value) || 0;
    const exhibidor = parseFloat(document.getElementById('edit-exhibidor').value) || 0;
    const zoom = parseFloat(document.getElementById('edit-zoom').value) || 0;
    const noteText = document.getElementById('edit-note').value;

    showConfirm(`¿Quieres marcar todos los ${dayNamesPlural[dayOfWeek]} del año con estos mismos valores?`, () => {
        const syStart = new Date(`${currentServiceYear - 1}-09-01T12:00:00`);
        const syEnd = new Date(`${currentServiceYear}-08-31T12:00:00`);
        let current = new Date(syStart);

        while (current <= syEnd) {
            if (current.getDay() === dayOfWeek) {
                const y = current.getFullYear();
                const m = String(current.getMonth() + 1).padStart(2, '0');
                const dd = String(current.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${dd}`;

                if (!appData[type]) appData[type] = {};
                if (!appData[type][dateStr]) appData[type][dateStr] = { casa: 0, exhibidor: 0, zoom: 0, total: 0 };
                appData[type][dateStr].casa = casa;
                appData[type][dateStr].exhibidor = exhibidor;
                appData[type][dateStr].zoom = zoom;
                appData[type][dateStr].total = casa + exhibidor + zoom;

                if (!appData.calendarNotes) appData.calendarNotes = {};
                if (noteText) {
                    appData.calendarNotes[dateStr] = { text: noteText, type: 'recordatorio' };
                }
            }
            current.setDate(current.getDate() + 1);
        }

        showAlert(`¡Completado! Todos los ${dayNamesPlural[dayOfWeek]} se han actualizado.`);

        // Refresh and scroll to current month if needed
        if (state.activeSection === 'informes') renderInformes(state.activeInformeTab);
        else if (state.activeSection === 'calendario') renderCalendario();
        else if (directoryFolders[state.activeSection]) openEventCalendar(state.activeSection);
        else if (state.activeSection === 'panel-principal') renderPanelPrincipal();
    });
}

function automateHours(type) {
    showConfirm("¿Deseas repetir el patrón de horas semanales introducido hasta ahora en todo el año de servicio?", () => {
        if (!appData[type] || Object.keys(appData[type]).length === 0) {
            showAlert("Primero introduce algunas horas para crear un patrón.", "error");
            return;
        }

        const patterns = {};
        Object.entries(appData[type]).forEach(([dateStr, vals]) => {
            const d = new Date(dateStr + "T12:00:00");
            patterns[d.getDay()] = vals;
        });

        const syStart = new Date(`${currentServiceYear - 1}-09-01T12:00:00`);
        const syEnd = new Date(`${currentServiceYear}-08-31T12:00:00`);
        let current = new Date(syStart);

        while (current <= syEnd) {
            const y = current.getFullYear();
            const m = String(current.getMonth() + 1).padStart(2, '0');
            const dd = String(current.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${dd}`;
            const dayOfWeek = current.getDay();

            if (patterns[dayOfWeek]) {
                appData[type][dateStr] = { ...patterns[dayOfWeek] };
            }
            current.setDate(current.getDate() + 1);
        }

        showAlert("¡Automatización completada!");
        renderInformes(state.activeInformeTab);
    });
}

function renderHorasFaltan() {
    const stats = getServiceYearStats();
    const diffTarget = stats.planned.total - stats.actual.total;
    const diff600Real = 600 - stats.actual.total;

    return `
        <div class="fade-in">
            <div class="dashboard-grid">
                <div class="modern-card" style="text-align: center; border-bottom: 5px solid var(--success);">
                    <h3 style="font-weight: 700; margin-bottom: 15px;">Total Horas Reales</h3>
                    <div class="big-stat" style="color: var(--success); font-size: 2.5rem; font-weight: 800;">${stats.actual.total}h</div>
                    <p style="margin-top: 10px; color: var(--text-dim); font-size: 0.85rem;">Casa: ${stats.actual.casa}h &nbsp;|&nbsp; Exh: ${stats.actual.exhibidor}h &nbsp;|&nbsp; Zoom: ${stats.actual.zoom}h</p>
                </div>
                <div class="modern-card" style="text-align: center; border-bottom: 5px solid var(--text-dim);">
                    <h3 style="font-weight: 700; margin-bottom: 15px;">Total Horas Previstas</h3>
                    <div class="big-stat" style="color: var(--text-dim); font-size: 2.5rem; font-weight: 800;">${stats.planned.total}h</div>
                    <p style="margin-top: 10px; color: var(--text-dim); font-size: 0.85rem;">Casa: ${stats.planned.casa}h &nbsp;|&nbsp; Exh: ${stats.planned.exhibidor}h &nbsp;|&nbsp; Zoom: ${stats.planned.zoom}h</p>
                </div>
                <div class="modern-card" style="text-align: center; border-bottom: 5px solid var(--primary);">
                    <h3 style="font-weight: 700; margin-bottom: 15px;">Diferencia (Real vs Prevista)</h3>
                    <div class="big-stat ${diffTarget <= 0 ? 'text-success' : 'text-danger'}" style="font-size: 2.5rem; font-weight: 800;">
                        ${diffTarget <= 0 ? '+' + Math.abs(diffTarget) : '-' + diffTarget}h
                    </div>
                </div>
                <div class="modern-card" style="text-align: center; border-bottom: 5px solid #ff9f43;">
                    <h3 style="font-weight: 700; margin-bottom: 15px;">Diferencia (Real vs 600h)</h3>
                    <div class="big-stat ${diff600Real <= 0 ? 'text-success' : 'text-danger'}" style="font-size: 2.5rem; font-weight: 800;">
                        ${diff600Real <= 0 ? 'OBJETIVO LOGRADO' : '-' + diff600Real + 'h'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function openActivitySection(id) {
    document.body.classList.remove('pdf-view-active');
    const folder = directoryFolders[id];
    if (!appData.files) appData.files = {};
    if (!appData.files[id]) appData.files[id] = [];

    state.elements.viewport.innerHTML = `
        <div class="fade-in">
            ${renderBackButton()}
            <header class="section-header" style="margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px;">
                <div>
                    <h2>${folder.title}</h2>
                    <p style="color: var(--text-dim); margin-top: 5px;">Gestiona archivos PDF y notas de este evento</p>
                </div>
                <div style="display: flex; gap: 15px;">
                    <button class="btn-primary" onclick="openEventCalendar('${id}')" style="background: var(--glass-bg);">
                        <i class="fas fa-calendar-day"></i> CALENDARIO NOTAS
                    </button>
                    <button class="btn-primary" onclick="document.getElementById('activityFileUpload').click()">
                        <i class="fas fa-upload"></i> SUBIR PDF
                    </button>
                </div>
                <input type="file" id="activityFileUpload" hidden multiple onchange="handleActivityUpload('${id}', this)">
            </header>

            <div class="modern-card">
                <div id="activityFiles" class="modal-grid">
                    ${renderActivityFiles(id)}
                </div>
            </div>
        </div>
    `;
}

function openEventCalendar(eventId) {
    const folder = directoryFolders[eventId];
    state.activeSection = eventId;

    state.elements.viewport.innerHTML = `
        <div class="fade-in">
            <div class="back-btn-container">
                <button class="btn-back" onclick="openActivitySection('${eventId}')">
                    <i class="fas fa-arrow-left"></i> VOLVER A ${folder.title.toUpperCase()}
                </button>
            </div>
            <header class="section-header" style="margin-bottom: 40px;">
                <h2>Notas: ${folder.title}</h2>
                <p>Pincha en un día para añadir una nota específica a este evento.</p>
            </header>
            
            <div class="calendar-triple-container">
                ${[0, 1, 2].map(offset => renderMonthElement(offset, eventId)).join('')}
            </div>
        </div>
    `;
}

function openEventNoteEditor(eventId, date) {
    const folder = directoryFolders[eventId];
    const existingObj = (appData.calendarNotes && appData.calendarNotes[date]) ? appData.calendarNotes[date] : { text: '' };
    const existingText = existingObj.text || "";

    renderCustomPrompt(`Nota para "${folder.title}" (${date})`, existingText, (txt, priority) => {
        if (!appData.calendarNotes) appData.calendarNotes = {};
        appData.calendarNotes[date] = {
            text: `[${folder.title.toUpperCase()}] ${txt}`,
            type: priority || 'verde'
        };
        // Refrescar según donde estemos
        if (document.getElementById('pdfViewerOverlay')) renderSidebarCalendar();
        else openEventCalendar(eventId);
    });
}

function renderCustomPrompt(title, value, onSave) {
    // Buscar si ya existe la nota para extraer su prioridad
    let currentPriority = 'verde';
    for (let date in appData.calendarNotes) {
        if (appData.calendarNotes[date].text === value) {
            currentPriority = appData.calendarNotes[date].type || 'verde';
            break;
        }
    }

    state.elements.modalTitle.textContent = title;
    state.elements.modalGrid.innerHTML = `
        <div style="grid-column: 1/-1; padding: 20px;">
            <div class="priority-selector">
                <div class="p-btn verde ${currentPriority === 'verde' ? 'active' : ''}" onclick="setNotePriority('verde')">Poco Importante</div>
                <div class="p-btn naranja ${currentPriority === 'naranja' ? 'active' : ''}" onclick="setNotePriority('naranja')">Importante</div>
                <div class="p-btn rojo ${currentPriority === 'rojo' ? 'active' : ''}" onclick="setNotePriority('rojo')">Imprescindible</div>
            </div>
            <textarea id="customPromptText" class="form-control" style="height: 150px; resize: none; margin-bottom: 20px; font-size: 1.1rem; padding: 20px; background: rgba(255,255,255,0.05); color: white; border-radius: 15px; width: 100%; border: 1px solid var(--glass-border);">${value}</textarea>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button class="btn-primary" id="customPromptSave" style="background: var(--primary); padding: 0 40px; height: 50px; border-radius: 12px; border:none; color:white; font-weight:600; cursor:pointer;">GUARDAR</button>
                <button class="btn-primary" id="customPromptCancel" style="background: rgba(255,255,255,0.1); padding: 0 40px; height: 50px; border-radius: 12px; border:none; color:white; font-weight:600; cursor:pointer;">CANCELAR</button>
            </div>
        </div>
    `;

    window._tempPriority = currentPriority;
    state.elements.modal.style.display = 'flex';

    document.getElementById('customPromptSave').onclick = () => {
        const txt = document.getElementById('customPromptText').value;
        state.elements.modal.style.display = 'none';
        onSave(txt, window._tempPriority);
        // Si el visor está abierto, refrescar su calendario
        if (document.getElementById('pdfViewerOverlay')) renderSidebarCalendar();
    };
    document.getElementById('customPromptCancel').onclick = () => {
        state.elements.modal.style.display = 'none';
    };
}

function setNotePriority(p) {
    window._tempPriority = p;
    document.querySelectorAll('.p-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.p-btn.${p}`).classList.add('active');
}

function renderActivityFiles(id) {
    const files = appData.files[id] || [];
    if (files.length === 0) {
        return `<p style="grid-column: 1/-1; text-align: center; color: var(--text-dim); padding: 40px;">No hay archivos en esta sección. Sube uno para comenzar.</p>`;
    }
    return files.map((file, idx) => `
        <div class="file-item" style="padding: 30px; display: flex; flex-direction: column; align-items: center;">
            <i class="fas fa-file-pdf file-icon" style="color: #f43f5e; margin-bottom: 20px;"></i>
            <span class="file-name" style="margin-bottom: 25px; font-weight: 600;">${file.name}</span>
            <div style="display: flex; gap: 12px; width: 100%; justify-content: center;">
                <button class="btn-primary btn-success" onclick="openFileViewer('${id}', ${idx})" style="width: 140px; height: 42px; padding: 0;">
                    <i class="fas fa-external-link-alt"></i> ABRIR
                </button>
                <button class="btn-primary btn-danger" onclick="deleteActivityFile('${id}', ${idx})" style="width: 140px; height: 42px; padding: 0;">
                    <i class="fas fa-trash-alt"></i> BORRAR
                </button>
            </div>
        </div>
    `).join('');
}

async function openFileViewer(sectionId, fileIdx) {
    const file = appData.files[sectionId][fileIdx];
    if (!file || !file.data) {
        showAlert("El archivo no contiene datos legibles.", 'error');
        return;
    }

    window._currentPDFSection = sectionId;
    window._currentPDFIdx = fileIdx;
    window._pdfTextData = {};

    const prevOverlay = document.getElementById('pdfViewerOverlay');
    if (prevOverlay) prevOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'pdfViewerOverlay';
    overlay.innerHTML = `
        <div class="pdf-toolbar">
            <button class="btn-back" onclick="closePDFViewer('${sectionId}')" style="margin:0;">
                <i class="fas fa-arrow-left"></i> SALIR
            </button>
            <div style="display: flex; align-items: center; gap: 10px; flex: 1; max-width: 600px; margin: 0 15px;">
                <div style="flex: 1; display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.07); border-radius: 12px; padding: 6px 14px;">
                    <i class="fas fa-search" style="color: var(--primary); font-size: 0.9rem;"></i>
                    <input type="text" id="pdfSearchInput" placeholder="Buscar en el PDF..."
                        style="flex:1; height: 32px; border: none; background: transparent; font-size: 0.95rem; color: white; outline: none; font-family: inherit;"
                        onkeyup="if(event.key==='Enter') searchInPDFJS()">
                    <button onclick="searchInPDFJS()"
                        style="background: var(--primary); border:none; color:white; font-weight:700; padding: 4px 14px; border-radius: 8px; cursor:pointer; font-size:0.85rem;">BUSCAR</button>
                </div>
                <div id="pdfCountUI" style="min-width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.95rem; transition: all 0.3s; flex-shrink:0;">0</div>
            </div>
            <span style="font-size: 0.75rem; color: var(--text-dim); max-width: 160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${file.name}</span>
        </div>
        <div class="viewer-split-container">
            <div id="pdfScrollArea">
                <div style="color: #ccc; margin-top: 60px; font-size: 1.1rem;">
                    <i class="fas fa-spinner fa-spin" style="margin-right:10px;"></i>Cargando PDF...
                </div>
            </div>
            <div id="viewerCalendarSidebar">
                <h3 style="margin-bottom:15px; text-align:center;"><i class="fas fa-calendar-alt"></i> Asignaciones</h3>
                <div id="sidebarCalendarContent"></div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Cargar calendario en la barra lateral (Mes actual + 1)
    renderSidebarCalendar();

    try {
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const loadingTask = pdfjsLib.getDocument(file.data);
        const pdfDoc = await loadingTask.promise;
        window._currentPDF = pdfDoc;

        const scrollArea = document.getElementById('pdfScrollArea');
        if (!scrollArea) return;
        scrollArea.innerHTML = '';

        const SCALE = 1.3;

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: SCALE });

            const wrapper = document.createElement('div');
            wrapper.style.cssText = `position: relative; width: ${viewport.width}px; height: ${viewport.height}px; background: white; box-shadow: 0 8px 30px rgba(0,0,0,0.6); margin-bottom: 25px; border-radius: 4px; flex-shrink: 0;`;
            wrapper.dataset.page = pageNum;

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.style.cssText = 'position: absolute; top: 0; left: 0; display: block;';

            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

            const hlCanvas = document.createElement('canvas');
            hlCanvas.width = viewport.width;
            hlCanvas.height = viewport.height;
            hlCanvas.style.cssText = 'position: absolute; top: 0; left: 0; pointer-events: none;';
            hlCanvas.dataset.hlPage = pageNum;

            wrapper.appendChild(canvas);
            wrapper.appendChild(hlCanvas);
            scrollArea.appendChild(wrapper);

            const textContent = await page.getTextContent();
            window._pdfTextData[pageNum] = { textContent, viewport };
        }
    } catch (e) {
        const sa = document.getElementById('pdfScrollArea');
        if (sa) sa.innerHTML = `<div style="color:#ff6b6b; margin-top:60px; text-align:center; padding:20px;"><i class="fas fa-exclamation-triangle" style="font-size:2rem; margin-bottom:15px; display:block;"></i>Error al cargar el PDF.<br><small style="opacity:0.7;">${e.message}</small></div>`;
    }
}

function renderSidebarCalendar() {
    const container = document.getElementById('sidebarCalendarContent');
    if (!container) return;

    // Mostramos 3 meses en la barra lateral para facilitar la anotación
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
            ${[0, 1, 2].map(offset => renderMonthElement(offset, window._currentPDFSection)).join('')}
        </div>
    `;
}

function closePDFViewer(sectionId) {
    const overlay = document.getElementById('pdfViewerOverlay');
    if (overlay) overlay.remove();
    window._currentPDF = null;
    window._pdfTextData = {};
    if (sectionId) openActivitySection(sectionId);
}

async function searchInPDFJS() {
    const input = document.getElementById('pdfSearchInput');
    if (!input) return;
    const term = input.value.trim();
    if (!term || !window._currentPDF) return;

    const pdfDoc = window._currentPDF;
    let totalCount = 0;

    // Clear all previous highlights
    document.querySelectorAll('[data-hl-page]').forEach(hlCanvas => {
        const ctx = hlCanvas.getContext('2d');
        ctx.clearRect(0, 0, hlCanvas.width, hlCanvas.height);
    });

    const lowerTerm = term.toLowerCase();

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const data = window._pdfTextData && window._pdfTextData[pageNum];
        if (!data) continue;

        const { textContent, viewport } = data;
        const hlCanvas = document.querySelector(`[data-hl-page="${pageNum}"]`);
        if (!hlCanvas) continue;

        const ctx = hlCanvas.getContext('2d');
        const SCALE = viewport.scale;

        textContent.items.forEach(item => {
            if (!item.str) return;
            const str = item.str;
            const lowerStr = str.toLowerCase();

            let idx = lowerStr.indexOf(lowerTerm);
            while (idx !== -1) {
                totalCount++;

                // Transform from PDF to canvas coordinates
                // item.transform = [scaleX, skewY, skewX, scaleY, transX, transY]
                const tx = item.transform[4];
                const ty = item.transform[5];
                const fontSize = Math.abs(item.transform[3]);

                // Apply viewport transform
                const canvasX = tx * SCALE;
                const canvasY = viewport.height - ty * SCALE;

                // Character width estimation
                const charWidth = str.length > 0 ? (item.width * SCALE / str.length) : 0;
                const hlX = canvasX + idx * charWidth - 2;
                const hlY = canvasY - fontSize * SCALE * 1.05;
                const hlW = charWidth * term.length + 4;
                const hlH = fontSize * SCALE * 1.3;

                // Draw highlight
                ctx.save();
                ctx.globalAlpha = 0.45;
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(hlX, hlY, hlW, hlH);
                ctx.globalAlpha = 1;
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(hlX, hlY, hlW, hlH);
                ctx.restore();

                idx = lowerStr.indexOf(lowerTerm, idx + 1);
            }
        });
    }

    // Update counter
    const ui = document.getElementById('pdfCountUI');
    if (ui) {
        ui.textContent = totalCount;
        ui.style.background = totalCount > 0 ? 'var(--primary)' : '#ef4444';
        ui.style.color = 'white';
        ui.style.transform = 'scale(1.2)';
        setTimeout(() => { if (ui) ui.style.transform = 'scale(1)'; }, 300);
    }

    // Scroll to first highlight
    if (totalCount > 0) {
        const firstWrapper = document.querySelector('[data-page="1"]');
        const firstHighPage = (() => {
            for (let p = 1; p <= pdfDoc.numPages; p++) {
                const data = window._pdfTextData[p];
                if (!data) continue;
                const found = data.textContent.items.some(item => item.str && item.str.toLowerCase().includes(lowerTerm));
                if (found) return p;
            }
            return 1;
        })();
        const targetPage = document.querySelector(`[data-page="${firstHighPage}"]`);
        if (targetPage) targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function renderExportPDFButton(name) {
    return '';
}

function viewActivityFile(id, idx) {
    openFileViewer(id, idx);
}

function handleActivityUpload(id, input) {
    if (!input.files.length) return;
    const filesArray = Array.from(input.files);
    let loadedCount = 0;

    filesArray.forEach(f => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (!appData.files) appData.files = {};
            if (!appData.files[id]) appData.files[id] = [];

            appData.files[id].push({
                name: f.name,
                size: f.size,
                type: f.type,
                data: e.target.result // Base64 DataURL
            });

            loadedCount++;
            if (loadedCount === filesArray.length) {
                openActivitySection(id);
            }
        };
        reader.readAsDataURL(f);
    });
}

function deleteActivityFile(id, idx) {
    showConfirm("¿Seguro que quieres borrar este archivo?", () => {
        appData.files[id].splice(idx, 1);
        openActivitySection(id);
    });
}

function renderBackupSection() {
    state.elements.viewport.innerHTML = `
        <div class="fade-in">
            ${renderBackButton()}
            <header class="section-header" style="margin-bottom: 40px;">
                <h2>Copias de Seguridad (Backup)</h2>
                <p style="color: var(--text-dim);">Gestiona tus datos para no perder nunca tu información.</p>
            </header>

            <div class="modern-card" style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; padding: 60px;">
                <div style="text-align: center; border-right: 1px solid var(--glass-border); padding-right: 40px;">
                    <i class="fas fa-file-import" style="font-size: 4rem; color: var(--primary); margin-bottom: 25px;"></i>
                    <h3>Importar Datos</h3>
                    <p style="margin: 15px 0; color: var(--text-dim);">Carga un archivo .json previamente descargado para restaurar tu información.</p>
                    <button class="btn-primary" onclick="document.getElementById('agImportJsonHidden').click()" style="width: auto; padding: 15px 40px;">
                        SELECCIONAR ARCHIVO
                    </button>
                </div>
                
                <div style="text-align: center; padding-left: 40px;">
                    <i class="fas fa-file-export" style="font-size: 4rem; color: var(--success); margin-bottom: 25px;"></i>
                    <h3>Exportar Datos</h3>
                    <p style="margin: 15px 0; color: var(--text-dim);">Descarga una copia de seguridad de todos tus datos actuales en formato .json.</p>
                    <button class="btn-primary" onclick="exportData()" style="width: auto; padding: 15px 40px; background: var(--success);">
                        DESCARGAR RESPALDO
                    </button>
                </div>
            </div>
        </div>
    `;
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "marbella_backup_" + new Date().toISOString().slice(0, 10) + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function searchInActivity(sectionId) {
    const term = document.getElementById('activitySearch').value.toLowerCase();
    if (!term) return;

    // Simulate finding matches in PDFs
    let count = 0;
    const commonMatches = {
        'lectura': 3, 'oración': 1, 'discurso': 2, 'estudio': 4, 'endika': 5
    };

    count = commonMatches[term] || Math.floor(Math.random() * 3);

    const circle = document.getElementById('matchCount');
    circle.textContent = count;
    circle.style.transform = 'scale(1.2)';
    setTimeout(() => circle.style.transform = 'scale(1)', 200);

    // Show simulated search results
    const grid = document.getElementById('activityFiles');
    if (count > 0) {
        grid.innerHTML = `
            <div class="modern-card" style="grid-column: 1/-1; padding: 20px;">
                <p style="margin-bottom: 10px; color: var(--text-dim);">Coincidencias encontradas en los documentos:</p>
                <div style="line-height: 1.6;">
                    ... se asigna la <span class="highlight-text">${term}</span> a la sección de Tesoros ... <br>
                    ... preparando el <span class="highlight-text">${term}</span> para la reunión del jueves ... <br>
                    ${count > 2 ? `... seguimiento de <span class="highlight-text">${term}</span> en el territorio sur ...` : ''}
                </div>
            </div>
        `;
    } else {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-dim); padding: 40px;">No se encontraron coincidencias para "${term}".</p>`;
    }
}

function renderCalendario() {
    state.activeSection = 'calendario';

    // Generar los meses del Año de Servicio: Sep 2025 a Ago 2026
    const serviceMonthsHtml = [];
    const monthsOrder = [
        { m: 8, y: 2025 }, { m: 9, y: 2025 }, { m: 10, y: 2025 }, { m: 11, y: 2025 }, // Sep - Dic
        { m: 0, y: 2026 }, { m: 1, y: 2026 }, { m: 2, y: 2026 }, { m: 3, y: 2026 },  // Ene - Abr
        { m: 4, y: 2026 }, { m: 5, y: 2026 }, { m: 6, y: 2026 }, { m: 7, y: 2026 }   // May - Ago
    ];

    state.elements.viewport.innerHTML = `
        <div class="fade-in">
            ${renderBackButton()}
            <header class="section-header" style="margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
                <div>
                    <h2>Calendario de Asignaciones Maestro</h2>
                    <p style="color: var(--text-dim);">Año de Servicio Completo: Septiembre 2025 - Agosto 2026</p>
                </div>
                <div style="background: var(--glass-bg); padding: 10px 20px; border-radius: 12px; display: flex; gap: 20px; font-size: 0.8rem;">
                    <span><i class="fas fa-circle" style="color:#10b981"></i> Poco imp.</span>
                    <span><i class="fas fa-circle" style="color:#f59e0b"></i> Importante</span>
                    <span><i class="fas fa-circle" style="color:#ef4444"></i> Imprescindible</span>
                </div>
            </header>
            
            <div class="calendar-triple-container" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
                ${monthsOrder.map(mo => renderSpecificMonth(mo.m, mo.y)).join('')}
            </div>
        </div>
    `;
}

function renderSpecificMonth(month, year) {
    const d = new Date(year, month, 1);
    const monthLabel = d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    const firstDay = d.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let daysHtml = '';
    const padding = (firstDay === 0 ? 6 : firstDay - 1);
    for (let i = 0; i < padding; i++) daysHtml += '<div class="calendar-day empty"></div>';

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasNote = appData.calendarNotes && appData.calendarNotes[dateStr];
        const priority = (hasNote && hasNote.type) ? hasNote.type : 'recordatorio';
        const noteClass = hasNote ? `has-note dot-${priority}` : '';

        daysHtml += `
            <div class="calendar-day ${noteClass}" onclick="openDayEditor('${dateStr}', 'actualHours')">
                ${day}
            </div>`;
    }

    return `
        <div class="calendar-month" style="margin-bottom: 20px;">
            <div class="calendar-header">
                <h3 style="text-transform: capitalize; font-size: 1rem; border-bottom: 1px solid var(--glass-border); width: 100%; padding-bottom: 5px;">${monthLabel}</h3>
            </div>
            <div class="calendar-grid">
                ${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(l => `<div class="calendar-day-label">${l}</div>`).join('')}
                ${daysHtml}
            </div>
        </div>
    `;
}

function changeCalendarOffset(val) {
    state.calendarOffset += val;
    renderCalendario();
}

function renderMonthElement(offset, specialEventId = null) {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const monthLabel = d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

    let daysHtml = '';
    const padding = (firstDay === 0 ? 6 : firstDay - 1);
    for (let i = 0; i < padding; i++) daysHtml += '<div class="calendar-day empty"></div>';

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Notes
        const hasNote = appData.calendarNotes && appData.calendarNotes[dateStr];
        const noteClass = hasNote ? `has-note dot-${hasNote.type || 'recordatorio'}` : '';

        // Hours
        const h = (appData.actualHours && appData.actualHours[dateStr]) ? appData.actualHours[dateStr] : null;
        const hourLabel = (h && h.total > 0) ? `<span class="day-hours-badge">${h.total}h</span>` : '';
        const hasHoursClass = (h && h.total > 0) ? 'day-with-hours' : '';

        const clickAction = specialEventId
            ? `openEventNoteEditor('${specialEventId}', '${dateStr}')`
            : `openDayEditor('${dateStr}', 'actualHours')`;

        daysHtml += `
            <div class="calendar-day ${noteClass} ${hasHoursClass}" onclick="${clickAction}">
                ${day}
                ${hourLabel}
            </div>`;
    }

    return `
        <div class="calendar-month">
            <div class="calendar-header">
                <h3 style="text-transform: capitalize;">${monthLabel}</h3>
            </div>
            <div class="calendar-grid">
                <div class="calendar-day-label">LU</div>
                <div class="calendar-day-label">MA</div>
                <div class="calendar-day-label">MI</div>
                <div class="calendar-day-label">JU</div>
                <div class="calendar-day-label">VI</div>
                <div class="calendar-day-label">SA</div>
                <div class="calendar-day-label">DO</div>
                ${daysHtml}
            </div>
        </div>
    `;
}



function renderConfiguracion() {
    const theme = appData.theme || {};
    const branding = appData.branding || {};
    state.elements.viewport.innerHTML = `
        <div class="fade-in">
            ${renderBackButton()}
            <header class="section-header" style="margin-bottom: 40px;">
                <h2>Personalización</h2>
                <p style="color: var(--text-dim);">Configura cada detalle visual de Antigravity.</p>
            </header>

            <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));">
                <div class="modern-card">
                    <h3 style="margin-bottom: 25px;"><i class="fas fa-magic"></i> Branding del Logo</h3>
                    <div class="form-group">
                        <label>Iniciales del Logo (ej: ES)</label>
                        <input type="text" class="form-control" maxlength="2" value="${branding.logoInitials || 'ES'}" onchange="updateBranding('logoInitials', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Color de fondo del Logo</label>
                        <input type="color" class="form-control" value="${theme.primary || '#4f46e5'}" onchange="updateTheme('logoBg', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Nombre de la App (Sidebar Superior)</label>
                        <input type="text" class="form-control" value="${branding.title || 'Antigravity'}" onchange="updateBranding('title', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Subtítulo (Ubicación)</label>
                        <input type="text" class="form-control" value="${branding.subTitle || 'Marbella Oeste'}" onchange="updateBranding('subTitle', this.value)">
                    </div>
                </div>

                <div class="modern-card">
                    <h3 style="margin-bottom: 25px;"><i class="fas fa-palette"></i> Colores Estructurales</h3>
                    <div class="form-group">
                        <label>Color Principal (Primario)</label>
                        <input type="color" class="form-control" value="${theme.primary || '#4f46e5'}" onchange="updateTheme('primary', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Color de Acento (Secundario)</label>
                        <input type="color" class="form-control" value="${theme.accent || '#818cf8'}" onchange="updateTheme('accent', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Fondo de la Aplicación</label>
                        <input type="color" class="form-control" value="${theme.bg || '#0f172a'}" onchange="updateTheme('bg', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Fondo del Menú Lateral</label>
                        <input type="color" class="form-control" value="${theme.sidebar || '#1e293b'}" onchange="updateTheme('sidebar', this.value)">
                    </div>
                </div>

                <div class="modern-card">
                    <h3 style="margin-bottom: 25px;"><i class="fas fa-id-badge"></i> Nombre Completo</h3>
                    <div class="form-group">
                        <label>Nombre (Informes)</label>
                        <input type="text" class="form-control" value="${branding.reportName || 'Endika Saratxo'}" onchange="updateBranding('reportName', this.value)">
                    </div>
                    <div class="form-group" style="margin-top: 30px;">
                        <button class="btn-primary" onclick="navigateTo('backup')" style="width: 100%;"><i class="fas fa-database"></i> Copias de Seguridad</button>
                    </div>
                </div>

                <div class="modern-card">
                    <h3 style="margin-bottom: 25px;"><i class="fas fa-font"></i> Colores de Texto y Números</h3>
                    <div class="form-group">
                        <label>Color del Texto Principal</label>
                        <input type="color" class="form-control" value="${theme.text || '#f8fafc'}" onchange="applyTextMain(this.value)">
                    </div>
                    <div class="form-group">
                        <label>Color de Números / Estadísticas</label>
                        <input type="color" class="form-control" value="${theme.statColor || '#a5b4fc'}" onchange="applyStatColor(this.value)">
                    </div>
                    <div class="form-group">
                        <label>Color de Texto Secundario (Descripciones)</label>
                        <input type="color" class="form-control" value="${theme.textDim || '#94a3b8'}" onchange="applyTextDim(this.value)">
                    </div>
                    <div style="margin-top: 20px; padding: 15px; background: var(--glass-bg); border-radius: 12px;">
                        <p style="font-size: 0.85rem; color: var(--text-dim);">Vista previa:</p>
                        <p style="color: var(--text-main); font-size: 1rem; margin-top: 5px;">Texto normal</p>
                        <p id="previewStat" style="color: ${theme.statColor || 'var(--primary-light)'}; font-size: 1.5rem; font-weight: 800;">212h</p>
                        <p style="color: var(--text-dim); font-size: 0.85rem;">Texto secundario</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function applyStatColor(val) {
    if (!appData.theme) appData.theme = {};
    appData.theme.statColor = val;
    document.documentElement.style.setProperty('--stat-color', val);
    const preview = document.getElementById('previewStat');
    if (preview) preview.style.color = val;
}

function applyTextMain(val) {
    if (!appData.theme) appData.theme = {};
    appData.theme.text = val;
    document.documentElement.style.setProperty('--text-main', val);
}

function applyTextDim(val) {
    if (!appData.theme) appData.theme = {};
    appData.theme.textDim = val;
    document.documentElement.style.setProperty('--text-dim', val);
}


function automateHours() {
    // This is a legacy stub - the real automateHours(type) function is defined earlier
    showAlert('Usa el botón "Automatizar" dentro de Horas Previstas o Horas Reales.', 'error');
}

function renderResumenTab(stats) {
    return `
        <div class="modern-card" style="padding: 0;">
            <div class="informe-table-header" style="grid-template-columns: 1.5fr 1fr 1fr 1fr; background: rgba(255,255,255,0.02); border-radius: 30px 30px 0 0;">
                <span>Categoría</span>
                <span style="text-align: center;">Reales</span>
                <span style="text-align: center;">Planificadas</span>
                <span style="text-align: center;">Diferencia</span>
            </div>
            ${['casa', 'exhibidor', 'zoom'].map(cat => {
        const diff = stats.actual[cat] - stats.planned[cat];
        return `
                    <div class="informe-row-premium">
                        <span style="font-weight: 600; text-transform: capitalize;">${cat === 'casa' ? 'De casa en casa' : cat === 'exhibidor' ? 'Exhibidores' : 'Zoom / Otros'}</span>
                        <span style="text-align: center; color: var(--success); font-weight: 700;">${stats.actual[cat]}h</span>
                        <span style="text-align: center; color: var(--text-dim);">${stats.planned[cat]}h</span>
                        <span style="text-align: center; color: ${diff >= 0 ? 'var(--success)' : 'var(--danger)'}">
                            ${diff >= 0 ? '+' : ''}${diff}h
                        </span>
                    </div>
                `;
    }).join('')}
            <div class="informe-row-premium" style="background: rgba(var(--primary-rgb), 0.1); font-weight: 800; border-radius: 0 0 30px 30px;">
                <span>TOTAL AÑO DE SERVICIO</span>
                <span style="text-align: center;">${stats.actual.total}h</span>
                <span style="text-align: center; color: var(--text-dim);">${stats.planned.total}h</span>
                <span style="text-align: center; color: ${stats.actual.total >= stats.planned.total ? 'var(--success)' : 'var(--danger)'}">
                    ${(stats.actual.total - stats.planned.total) >= 0 ? '+' : ''}${stats.actual.total - stats.planned.total}h
                </span>
            </div>
        </div>
    `;
}

function renderFaltanTab(stats) {
    const diff = stats.planned.total - stats.actual.total;
    const progressText = diff > 0
        ? `Te faltan <strong>${diff} horas</strong> para alcanzar tu meta anual de ${stats.planned.total}h.`
        : `¡Increíble! Has superado tu meta anual por <strong>${Math.abs(diff)} horas</strong>.`;

    return `
        <div class="modern-card" style="text-align: center; padding: 60px;">
            <div style="font-size: 4rem; color: var(--primary); margin-bottom: 20px;">
                <i class="fas ${diff > 0 ? 'fa-hourglass-half' : 'fa-trophy'}"></i>
            </div>
            <h2>Horas que Faltan</h2>
            <p style="font-size: 1.2rem; margin: 20px 0; color: var(--text-dim);">
                ${progressText}
            </p>
            <div class="big-progress-ring" style="width: 200px; height: 200px; margin: 40px auto; border: 15px solid var(--glass-bg); border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative;">
                <div style="font-size: 2.5rem; font-weight: 800;">${Math.round((stats.actual.total / stats.planned.total) * 100)}%</div>
                <!-- Semi-circle indicator could go here -->
            </div>
            <button class="nav-btn active" style="width: auto; margin-inline: auto;" onclick="renderServiceDetails('casa')">
                Ver Registros Detallados
            </button>
        </div>
    `;
}

function renderServiceDetails(type) {
    const months = ["Septiembre", "Octubre", "Noviembre", "Diciembre", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto"];

    state.elements.viewport.innerHTML = `
        <div class="fade-in">
            ${renderBackButton()}
            <header class="section-header" style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 style="text-transform: capitalize;">Historial Mensual: ${type}</h2>
                    <p style="color: var(--text-dim);">Resumen de horas totales por mes</p>
                </div>
                <button class="nav-btn" onclick="renderDashboard()" style="width: auto; background: var(--glass-bg);">
                    <i class="fas fa-th-large"></i> PANEL
                </button>
            </header>
            
            <div class="modern-card" style="padding: 0;">
                <table class="premium-table">
                    <thead>
                        <tr>
                            <th style="text-align: left;">Mes</th>
                            <th>Total Horas</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${months.map(m => {
        const monthIdxMap = { "Enero": 0, "Febrero": 1, "Marzo": 2, "Abril": 3, "Mayo": 4, "Junio": 5, "Julio": 6, "Agosto": 7, "Septiembre": 8, "Octubre": 9, "Noviembre": 10, "Diciembre": 11 };
        const idx = monthIdxMap[m];
        const year = (idx >= 8) ? currentServiceYear - 1 : currentServiceYear;
        const h = getMonthlyStats(idx, year);
        const val = h[type] || 0;
        return `
                                <tr>
                                    <td style="text-align: left; font-weight: 600;">${m} ${year}</td>
                                    <td style="font-weight: 700; color: var(--primary);">${val}h</td>
                                    <td>
                                        <button class="sub-btn" onclick="renderInformes('reales')">Gestionar</button>
                                    </td>
                                </tr>
                            `;
    }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openFolderModal(sectionId) {
    const folder = directoryFolders[sectionId];
    state.elements.modalTitle.textContent = folder.title;
    state.elements.modalGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px;">
            <i class="fas fa-folder-open" style="font-size: 4rem; color: var(--primary); opacity: 0.5; margin-bottom: 20px;"></i>
            <p>Accediendo a los archivos de <strong>${folder.title}</strong>...</p>
        </div>
    `;
    state.elements.modal.style.display = 'flex';

    // Simulated content
    setTimeout(() => {
        state.elements.modalGrid.innerHTML = `
            <div class="file-item"><i class="fas fa-file-pdf file-icon" style="color: #f43f5e"></i><span class="file-name">Informe_Semanal_01.pdf</span></div>
            <div class="file-item"><i class="fas fa-file-pdf file-icon" style="color: #f43f5e"></i><span class="file-name">Programa_Reunion.pdf</span></div>
            <div class="file-item"><i class="fas fa-file-image file-icon" style="color: #10b981"></i><span class="file-name">Territorio_A20.png</span></div>
            <div class="file-item"><i class="fas fa-file-pdf file-icon" style="color: #f43f5e"></i><span class="file-name">Asignaciones_Mes.pdf</span></div>
        `;
    }, 450);
}

// --- HELPERS ---

function getServiceYearStats() {
    const stats = {
        actual: { casa: 0, exhibidor: 0, zoom: 0, total: 0 },
        planned: { casa: 0, exhibidor: 0, zoom: 0, total: 0 }
    };

    const syStart = `${currentServiceYear - 1}-09-01`;
    const syEnd = `${currentServiceYear}-08-31`;

    // Calculate Actual
    if (appData.actualHours) {
        Object.entries(appData.actualHours).forEach(([date, vals]) => {
            if (date >= syStart && date <= syEnd) {
                stats.actual.casa += (parseFloat(vals.casa) || 0);
                stats.actual.exhibidor += (parseFloat(vals.exhibidor) || 0);
                stats.actual.zoom += (parseFloat(vals.zoom) || 0);
            }
        });
    }

    // Calculate Planned
    if (appData.plannedHours) {
        Object.entries(appData.plannedHours).forEach(([date, vals]) => {
            if (date >= syStart && date <= syEnd) {
                stats.planned.casa += (parseFloat(vals.casa) || 0);
                stats.planned.exhibidor += (parseFloat(vals.exhibidor) || 0);
                stats.planned.zoom += (parseFloat(vals.zoom) || 0);
            }
        });
    }

    stats.actual.total = stats.actual.casa + stats.actual.exhibidor + stats.actual.zoom;
    stats.planned.total = stats.planned.casa + stats.planned.exhibidor + stats.planned.zoom;

    // Fix decimals
    Object.keys(stats.actual).forEach(k => stats.actual[k] = Math.round(stats.actual[k] * 100) / 100);
    Object.keys(stats.planned).forEach(k => stats.planned[k] = Math.round(stats.planned[k] * 100) / 100);

    return stats;
}

function renderRecentNotes() {
    if (!appData || !appData.calendarNotes) return '<p class="empty-msg">Sin notas.</p>';
    const notes = appData.calendarNotes;
    // Only show notes that HAVE text (not just hours registered) and not predicacion hours-only entries
    const dates = Object.keys(notes)
        .filter(date => {
            const n = notes[date];
            const text = typeof n === 'string' ? n : (n ? n.text : '');
            return text && text.trim().length > 0;
        })
        .sort().reverse().slice(0, 5);

    if (dates.length === 0) return '<p class="empty-msg">No hay notas recientes.</p>';

    return dates.map(date => {
        const note = notes[date];
        const type = typeof note === 'string' ? 'recordatorio' : (note.type || 'recordatorio');
        const text = typeof note === 'string' ? note : (note.text || '');
        return `
            <div class="note-item note-${type}" style="padding: 15px; background: var(--glass-bg); margin-bottom: 12px; border-radius: 12px;">
                <div style="font-size: 0.8rem; color: var(--text-dim); font-weight: 700; margin-bottom: 5px;">${date}</div>
                <div style="font-size: 0.95rem;">${text}</div>
            </div>
        `;
    }).join('');
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            appData = JSON.parse(event.target.result);
            determineCurrentServiceYear();
            applyBranding();
            renderDashboard();
            showAlert('¡Datos restaurados con éxito!');
        } catch (err) { showAlert('Error al cargar el JSON. Verifica que sea un archivo válido.', 'error'); }
    };
    reader.readAsText(file);
}

function renderPlaceholder(id) {
    state.elements.viewport.innerHTML = `
        <div class="fade-in" style="text-align: center; padding: 120px 0;">
            <i class="fas fa-layer-group" style="font-size: 4rem; color: var(--text-dim); margin-bottom: 25px;"></i>
            <h2>Sección "${id.toUpperCase()}"</h2>
            <p>Estamos trabajando para sincronizar esta sección con tus archivos locales.</p>
            <button class="nav-btn active" style="width: auto; margin: 35px auto;" onclick="renderDashboard()">Regresar al Panel</button>
        </div>
    `;
}

// Boot
function renderCalendarioAsignaciones() {
    state.activeSection = 'calendario-asignaciones';
    // Collect notes from Reuniones and Eventos Especiales sections only (NOT predicacion hours)
    const eventSections = ['vida-ministerio', 'reunion-publica', 'plataforma', 'microfonos', 'responsabilidades', 'asambleas', 'conmemoracion', 'super', 'campanas'];
    const notes = appData.calendarNotes || {};

    // Filter notes: only those that come from event sections (tagged with section prefix) or have non-empty text but are NOT pure hour entries
    const assignmentNotes = Object.entries(notes)
        .filter(([date, note]) => {
            const text = typeof note === 'string' ? note : (note ? note.text : '');
            if (!text || !text.trim()) return false;
            // Exclude if looks like a pure hours note without text prefix from event sections
            return true;
        })
        .sort(([a], [b]) => b.localeCompare(a));

    const notesHtml = assignmentNotes.length > 0 ? assignmentNotes.map(([date, note]) => {
        const type = typeof note === 'string' ? 'recordatorio' : (note.type || 'recordatorio');
        const text = typeof note === 'string' ? note : (note.text || '');
        const d = new Date(date + 'T12:00:00');
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const dayName = dayNames[d.getDay()];
        return `
            <div style="display: flex; gap: 15px; align-items: flex-start; padding: 15px; background: var(--glass-bg); border-radius: 12px; margin-bottom: 10px; border-left: 4px solid var(--primary);">
                <div style="text-align: center; min-width: 55px;">
                    <div style="font-size: 0.7rem; color: var(--text-dim); font-weight: 700; text-transform: uppercase;">${dayName}</div>
                    <div style="font-size: 1.4rem; font-weight: 800; line-height: 1;">${d.getDate()}</div>
                    <div style="font-size: 0.7rem; color: var(--text-dim);">${d.toLocaleString('es-ES', { month: 'short' })}</div>
                </div>
                <div style="flex: 1; font-size: 0.95rem; line-height: 1.5;">${text}</div>
            </div>
        `;
    }).join('') : '<p style="text-align:center; color: var(--text-dim); padding: 60px 0;">No hay notas de asignaciones todavía.<br>Añade notas en los calendarios de Reuniones o Eventos Especiales.</p>';

    state.elements.viewport.innerHTML = `
        <div class="fade-in" style="padding: 40px;">
            ${renderBackButton()}
            <header class="section-header" style="margin-bottom: 40px;">
                <h2>📅 Calendario de Asignaciones</h2>
                <p>Todas las notas de Reuniones y Eventos Especiales</p>
            </header>
            <div class="modern-card">
                ${notesHtml}
            </div>
        </div>
    `;
}

// Boot
document.addEventListener('DOMContentLoaded', init);

/// === TEST BOTÓN IMPORTAR JSON ===
(function () {
  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'file';
  hiddenInput.accept = '.json';
  hiddenInput.style.display = 'none';
  hiddenInput.id = 'agImportJsonHidden';
  document.body.appendChild(hiddenInput);

  hiddenInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        console.log('JSON importado OK', json);
        alert('Backup JSON leído correctamente (mira la consola).');
        // Aquí luego enlazaremos con tu lógica real de restaurar datos
      } catch (err) {
        console.error('Error JSON', err);
        alert('Archivo JSON no válido.');
      }
    };
    reader.readAsText(file, 'utf-8');
  });

// === SISTEMA DE COPIAS DE SEGURIDAD (LIMPIO) ===

// 1. Función para importar el archivo JSON
function setupJsonImportTest() {
  let hiddenInput = document.getElementById('agImportJsonHidden');
  if (!hiddenInput) {
    hiddenInput = document.createElement('input');
    hiddenInput.type = 'file';
    hiddenInput.accept = '.json';
    hiddenInput.style.display = 'none';
    hiddenInput.id = 'agImportJsonHidden';
    document.body.appendChild(hiddenInput);
  }

  hiddenInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        // Guardamos en la memoria del navegador y en la variable de la app
        localStorage.setItem('marbella_data_backup', JSON.stringify(json));
        appData = json;
        alert('✅ ¡Copia de seguridad cargada! La página se reiniciará.');
        window.location.reload(); 
      } catch (err) {
        alert('❌ El archivo JSON no es válido.');
      }
    };
    reader.readAsText(file, 'utf-8');
  });
  return hiddenInput;
}

// 2. Función para lanzar el selector (Conéctala a tu botón de la interfaz)
function triggerImport() {
    const input = setupJsonImportTest();
    input.click();
}

// 3. Función para exportar tus datos reales
function exportarJSON() {
  if (!appData) {
    alert("⚠️ No hay datos para exportar.");
    return;
  }
  const dataStr = JSON.stringify(appData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `marbella-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ... (aquí termina tu última función original)

function exportarJSON() {
  if (!appData) return;
  const dataStr = JSON.stringify(appData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `marbella-backup.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ESTO ES LO MÁS IMPORTANTE PARA QUE NO SALGA EN BLANCO:
window.onload = init;

