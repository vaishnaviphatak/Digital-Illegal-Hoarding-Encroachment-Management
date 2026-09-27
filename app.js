/**
 * CivicTrack Municipal Application Core Engine
 * Handles State, Navigation, Role Switching, Leaflet Maps, and Case Workflow Actions
 */

// Application State
let currentRole = 'citizen'; // 'citizen' | 'officer' | 'municipal'
let currentView = 'dashboard'; // 'dashboard' | 'cases' | 'details' | 'map' | 'monitoring' | 'history'
let selectedCaseId = null;
let mapInstance = null;
let pickerMapInstance = null;

// Lifecycle Initialization
document.addEventListener('DOMContentLoaded', () => {
    switchRole('citizen');
});

// Role Switcher Handler
function switchRole(role) {
    currentRole = role;

    // Update Header Profile Badge
    const userName = document.getElementById('userName');
    const userRoleTitle = document.getElementById('userRoleTitle');
    const userAvatar = document.getElementById('userAvatar');
    const sidebarTitle = document.getElementById('sidebarTitle');

    if (role === 'citizen') {
        userName.textContent = 'Sarah Jenkins';
        userRoleTitle.textContent = 'Citizen Resident';
        userAvatar.textContent = 'S';
        sidebarTitle.textContent = 'Citizen Portal';
        currentView = 'dashboard';
    } else if (role === 'officer') {
        userName.textContent = 'Inspector Rajesh Varma';
        userRoleTitle.textContent = 'Ward 4 Senior Field Inspector';
        userAvatar.textContent = 'RV';
        sidebarTitle.textContent = 'Officer Portal';
        currentView = 'dashboard';
    } else if (role === 'municipal') {
        userName.textContent = 'Dr. Anita Roy';
        userRoleTitle.textContent = 'Municipal Deputy Commissioner';
        userAvatar.textContent = 'AR';
        sidebarTitle.textContent = 'Admin Control';
        currentView = 'dashboard';
    }

    renderSidebarMenu();
    renderMainView();
    showToast(`Switched to ${role.toUpperCase()} mode`, 'info');
}

// Render Contextual Sidebar Menu
function renderSidebarMenu() {
    const menuContainer = document.getElementById('sidebarMenu');
    menuContainer.innerHTML = '';

    let items = [];

    if (currentRole === 'citizen') {
        items = [
            { id: 'dashboard', label: 'My Cases', icon: 'layout-dashboard' },
            { id: 'report-new', label: '+ Report New Case', icon: 'plus-circle', isAction: true },
            { id: 'notifications', label: 'Notifications', icon: 'bell', badge: '2' }
        ];
    } else if (currentRole === 'officer') {
        items = [
            { id: 'dashboard', label: 'Officer Overview', icon: 'layout-dashboard' },
            { id: 'cases', label: 'Assigned Cases', icon: 'briefcase' },
            { id: 'overdue', label: 'Overdue Cases', icon: 'alert-triangle', badge: '1' }
        ];
    } else if (currentRole === 'municipal') {
        items = [
            { id: 'dashboard', label: 'Municipal Dashboard', icon: 'bar-chart-3' },
            { id: 'cases', label: 'All Cases Registry', icon: 'folder-open' },
            { id: 'map', label: 'GIS Encroachment Map', icon: 'map-pin' },
            { id: 'monitoring', label: 'Ward Analytics', icon: 'pie-chart' },
            { id: 'history', label: 'Audit History Log', icon: 'history' }
        ];
    }

    items.forEach(item => {
        const menuItem = document.createElement('a');
        menuItem.className = `menu-item ${currentView === item.id ? 'active' : ''}`;
        
        if (item.isAction) {
            menuItem.onclick = () => openReportModal();
        } else {
            menuItem.onclick = () => {
                currentView = item.id;
                renderSidebarMenu();
                renderMainView();
            };
        }

        menuItem.innerHTML = `
            <i data-lucide="${item.icon}"></i>
            <span>${item.label}</span>
            ${item.badge ? `<span class="badge badge-overdue" style="margin-left:auto;">${item.badge}</span>` : ''}
        `;
        menuContainer.appendChild(menuItem);
    });

    lucide.createIcons();
}

// Main View Router
function renderMainView() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '';

    if (currentView === 'details' && selectedCaseId) {
        renderCaseDetailsPage(contentArea);
        return;
    }

    if (currentRole === 'citizen') {
        renderCitizenDashboard(contentArea);
    } else if (currentRole === 'officer') {
        if (currentView === 'cases' || currentView === 'overdue') {
            renderCasesPage(contentArea);
        } else {
            renderOfficerDashboard(contentArea);
        }
    } else if (currentRole === 'municipal') {
        if (currentView === 'cases') {
            renderCasesPage(contentArea);
        } else if (currentView === 'map') {
            renderMapPage(contentArea);
        } else if (currentView === 'monitoring') {
            renderMonitoringPage(contentArea);
        } else if (currentView === 'history') {
            renderHistoryPage(contentArea);
        } else {
            renderMunicipalDashboard(contentArea);
        }
    }

    lucide.createIcons();
}

/* ==========================================================================
   1. CITIZEN DASHBOARD
   ========================================================================== */
function renderCitizenDashboard(container) {
    const cases = getCasesStore();

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">Citizen Grievance & Tracking Portal</h1>
                <p class="page-subtitle">Report unauthorized billboards, political banners, and digital encroachments in your ward.</p>
            </div>
            <div class="page-actions">
                <button class="btn btn-primary" onclick="openReportModal()">
                    <i data-lucide="plus-circle"></i> Report New Encroachment
                </button>
            </div>
        </div>

        <!-- Citizen Status Banner -->
        <div class="card-section" style="background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%); border-color: #bbf7d0; margin-bottom: 2rem;">
            <div class="card-body" style="display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
                <div>
                    <h3 style="font-size: 1.1rem; color: #166534; margin-bottom: 0.3rem;">Welcome, Sarah!</h3>
                    <p style="color: #15803d; font-size: 0.875rem;">You have <strong>${cases.length} reported cases</strong> under active municipal track. Your contributions help keep city spaces safe and accessible.</p>
                </div>
                <button class="btn btn-secondary" style="border-color: #86efac; color: #166534;" onclick="openReportModal()">
                    <i data-lucide="camera"></i> Quick Photo Report
                </button>
            </div>
        </div>

        <!-- My Cases List -->
        <div class="card-section">
            <div class="card-header">
                <div class="card-title">
                    <i data-lucide="folder"></i> My Submitted Cases
                </div>
                <span class="text-secondary" style="font-size:0.85rem;">Showing all ${cases.length} cases</span>
            </div>
            <div class="card-body" style="padding: 0;">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Case ID</th>
                                <th>Category</th>
                                <th>Reported Date</th>
                                <th>Location</th>
                                <th>Status Timeline</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${cases.map(c => `
                                <tr onclick="viewCaseDetails('${c.id}')">
                                    <td class="case-id-cell">${c.id}</td>
                                    <td>
                                        <div style="font-weight:600;">${c.type}</div>
                                        <div style="font-size:0.75rem; color:var(--text-secondary);">${c.category}</div>
                                    </td>
                                    <td>${c.reportedDate}</td>
                                    <td>${c.ward}</td>
                                    <td>${getStatusBadge(c.status)}</td>
                                    <td>
                                        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); viewCaseDetails('${c.id}')">
                                            <i data-lucide="eye"></i> View Case
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

/* ==========================================================================
   2. FIELD OFFICER DASHBOARD
   ========================================================================== */
function renderOfficerDashboard(container) {
    const cases = getCasesStore();

    const newCasesCount = cases.filter(c => c.status === 'Reported').length;
    const pendingVerifCount = cases.filter(c => c.status === 'Under Verification').length;
    const actionPendingCount = cases.filter(c => c.status === 'Notice Issued' || c.status === 'Verified').length;
    const overdueCount = cases.filter(c => c.status === 'Overdue').length;
    const closedCount = cases.filter(c => c.status === 'Closed' || c.status === 'Compliance').length;

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">Field Officer Management Dashboard</h1>
                <p class="page-subtitle">Assigned Ward: <strong>Ward 4 & Ward 5</strong> • Inspector Rajesh Varma</p>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary" onclick="renderMainView()">
                    <i data-lucide="rotate-cw"></i> Sync Workspace
                </button>
            </div>
        </div>

        <!-- KPI Grid -->
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-header">
                    <span>New / Assigned</span>
                    <div class="kpi-icon"><i data-lucide="inbox"></i></div>
                </div>
                <div class="kpi-value">${newCasesCount}</div>
                <div class="kpi-footer">Requires initial review</div>
            </div>

            <div class="kpi-card">
                <div class="kpi-header">
                    <span>Pending Verification</span>
                    <div class="kpi-icon"><i data-lucide="search"></i></div>
                </div>
                <div class="kpi-value">${pendingVerifCount}</div>
                <div class="kpi-footer">Field site visit pending</div>
            </div>

            <div class="kpi-card">
                <div class="kpi-header">
                    <span>Action Pending</span>
                    <div class="kpi-icon"><i data-lucide="clock"></i></div>
                </div>
                <div class="kpi-value">${actionPendingCount}</div>
                <div class="kpi-footer">Notice active / Removal pending</div>
            </div>

            <div class="kpi-card" style="border-left: 3px solid #ef4444;">
                <div class="kpi-header">
                    <span>Overdue Cases</span>
                    <div class="kpi-icon" style="background-color:#fee2e2; color:#ef4444;"><i data-lucide="alert-circle"></i></div>
                </div>
                <div class="kpi-value" style="color:#ef4444;">${overdueCount}</div>
                <div class="kpi-footer urgent">Demolition team dispatch needed</div>
            </div>

            <div class="kpi-card">
                <div class="kpi-header">
                    <span>Closed Cases</span>
                    <div class="kpi-icon" style="background-color:#dcfce7; color:#10b981;"><i data-lucide="check-circle-2"></i></div>
                </div>
                <div class="kpi-value">${closedCount}</div>
                <div class="kpi-footer">Fully resolved</div>
            </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="filter-bar">
            <div class="search-box">
                <i data-lucide="search"></i>
                <input type="text" id="officerSearch" placeholder="Search by Case ID, location or keywords..." onkeyup="filterOfficerCases()">
            </div>
            <div class="filter-group">
                <select class="filter-select" id="statusFilter" onchange="filterOfficerCases()">
                    <option value="ALL">All Statuses</option>
                    <option value="Reported">Reported</option>
                    <option value="Under Verification">Under Verification</option>
                    <option value="Verified">Verified</option>
                    <option value="Notice Issued">Notice Issued</option>
                    <option value="Action Taken">Action Taken</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Closed">Closed</option>
                </select>

                <select class="filter-select" id="wardFilter" onchange="filterOfficerCases()">
                    <option value="ALL">All Wards</option>
                    <option value="Ward 4">Ward 4</option>
                    <option value="Ward 2">Ward 2</option>
                    <option value="Ward 5">Ward 5</option>
                </select>

                <select class="filter-select" id="typeFilter" onchange="filterOfficerCases()">
                    <option value="ALL">All Types</option>
                    <option value="Illegal Hoarding">Illegal Hoarding</option>
                    <option value="Digital Encroachment">Digital Encroachment</option>
                </select>
            </div>
        </div>

        <!-- Cases Table -->
        <div class="card-section">
            <div class="card-header">
                <div class="card-title">
                    <i data-lucide="list-checks"></i> Active Assigned Work Orders
                </div>
            </div>
            <div class="card-body" style="padding: 0;">
                <div class="table-responsive">
                    <table class="data-table" id="officerCasesTable">
                        <thead>
                            <tr>
                                <th>Case ID</th>
                                <th>Type & Ward</th>
                                <th>Reported Date</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Officer Action</th>
                            </tr>
                        </thead>
                        <tbody id="officerTableBody">
                            ${renderOfficerTableRows(cases)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderOfficerTableRows(casesList) {
    if (casesList.length === 0) {
        return `<tr><td colspan="6" style="text-align:center; padding: 2rem; color:var(--text-muted);">No cases match the selected filters.</td></tr>`;
    }

    return casesList.map(c => `
        <tr onclick="viewCaseDetails('${c.id}')">
            <td class="case-id-cell">${c.id}</td>
            <td>
                <div style="font-weight:600;">${c.type}</div>
                <div style="font-size:0.75rem; color:var(--text-secondary);">${c.ward}</div>
            </td>
            <td>${c.reportedDate}</td>
            <td>
                <span class="badge ${c.priority === 'High' ? 'badge-overdue' : 'badge-reported'}">${c.priority} Priority</span>
            </td>
            <td>${getStatusBadge(c.status)}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); viewCaseDetails('${c.id}')">
                    <i data-lucide="edit-3"></i> Process Case
                </button>
            </td>
        </tr>
    `).join('');
}

function filterOfficerCases() {
    const search = document.getElementById('officerSearch').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const ward = document.getElementById('wardFilter').value;
    const type = document.getElementById('typeFilter').value;

    const cases = getCasesStore();
    const filtered = cases.filter(c => {
        const matchesSearch = c.id.toLowerCase().includes(search) ||
                              c.locationText.toLowerCase().includes(search) ||
                              c.description.toLowerCase().includes(search);
        const matchesStatus = status === 'ALL' || c.status === status;
        const matchesWard = ward === 'ALL' || c.ward.includes(ward);
        const matchesType = type === 'ALL' || c.type === type;
        return matchesSearch && matchesStatus && matchesWard && matchesType;
    });

    document.getElementById('officerTableBody').innerHTML = renderOfficerTableRows(filtered);
    lucide.createIcons();
}

/* ==========================================================================
   3. MUNICIPAL ADMIN DASHBOARD & GIS MAP
   ========================================================================== */
function renderMunicipalDashboard(container) {
    const cases = getCasesStore();

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">Municipal Executive Monitoring Command</h1>
                <p class="page-subtitle">City-wide Encroachment & Hoarding Compliance Dashboard • Real-time Operations</p>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary" onclick="currentView='map'; renderMainView();">
                    <i data-lucide="map"></i> GIS Map View
                </button>
            </div>
        </div>

        <!-- Executive KPI Row -->
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-header"><span>Total Reported</span><i data-lucide="layers"></i></div>
                <div class="kpi-value">${cases.length}</div>
                <div class="kpi-footer">Across all 5 city wards</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-header"><span>Pending Verif.</span><i data-lucide="search"></i></div>
                <div class="kpi-value">${cases.filter(c => c.status === 'Under Verification' || c.status === 'Reported').length}</div>
                <div class="kpi-footer">Awaiting officer inspection</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-header"><span>Notices Active</span><i data-lucide="file-text"></i></div>
                <div class="kpi-value">${cases.filter(c => c.status === 'Notice Issued').length}</div>
                <div class="kpi-footer">72hr compliance notice</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-header"><span>Removal Actions</span><i data-lucide="truck"></i></div>
                <div class="kpi-value">${cases.filter(c => c.status === 'Action Taken').length}</div>
                <div class="kpi-footer">Demolition squad active</div>
            </div>
            <div class="kpi-card" style="border-left: 3px solid #ef4444;">
                <div class="kpi-header"><span>Overdue Cases</span><i data-lucide="alert-triangle"></i></div>
                <div class="kpi-value" style="color:#ef4444;">${cases.filter(c => c.status === 'Overdue').length}</div>
                <div class="kpi-footer urgent">Escalation required</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-header"><span>Closed & Complied</span><i data-lucide="check-check"></i></div>
                <div class="kpi-value" style="color:#10b981;">${cases.filter(c => c.status === 'Closed' || c.status === 'Compliance').length}</div>
                <div class="kpi-footer">Resolved cleanly</div>
            </div>
        </div>

        <!-- Embedded Map Layout -->
        <div class="card-section" style="margin-bottom:2rem;">
            <div class="card-header">
                <div class="card-title"><i data-lucide="map-pin"></i> Ward Geo-Spatial Heatmap</div>
                <span style="font-size:0.8rem; color:var(--text-secondary);">Click marker for summary</span>
            </div>
            <div class="card-body" style="padding:0;">
                <div id="dashboardMap" style="height: 380px; width: 100%;"></div>
            </div>
        </div>
    `;

    setTimeout(() => initDashboardMap(cases), 100);
}

function initDashboardMap(cases) {
    const mapElement = document.getElementById('dashboardMap');
    if (!mapElement) return;

    if (mapInstance) mapInstance.remove();

    mapInstance = L.map('dashboardMap').setView([18.5204, 73.8567], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);

    cases.forEach(c => {
        if (c.coordinates) {
            const markerColor = c.status === 'Overdue' ? '#ef4444' :
                                c.status === 'Notice Issued' ? '#f59e0b' :
                                c.status === 'Closed' ? '#10b981' : '#2563eb';

            const marker = L.circleMarker(c.coordinates, {
                radius: 9,
                fillColor: markerColor,
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.95
            }).addTo(mapInstance);

            marker.bindPopup(`
                <div style="font-family: Inter, sans-serif;">
                    <strong style="color:#2563eb;">${c.id}</strong> - <span>${c.type}</span><br/>
                    <small>${c.locationText}</small><br/>
                    <div style="margin-top:5px;">${getStatusBadge(c.status)}</div>
                    <button class="btn btn-primary btn-sm" style="margin-top:8px; width:100%;" onclick="viewCaseDetails('${c.id}')">View Details</button>
                </div>
            `);
        }
    });
}

function renderMapPage(container) {
    const cases = getCasesStore();
    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">GIS Encroachment Interactive Map</h1>
                <p class="page-subtitle">Full Spatial Registry & Filterable Ward Map</p>
            </div>
        </div>

        <div class="card-section">
            <div class="card-body" style="padding:0;">
                <div id="fullGisMap" style="height: 600px; width:100%;"></div>
            </div>
        </div>
    `;

    setTimeout(() => {
        const fullMap = L.map('fullGisMap').setView([18.5204, 73.8567], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(fullMap);
        cases.forEach(c => {
            if (c.coordinates) {
                L.marker(c.coordinates).addTo(fullMap).bindPopup(`<b>${c.id}</b><br/>${c.locationText}<br/>Status: ${c.status}`);
            }
        });
    }, 100);
}

function renderMonitoringPage(container) {
    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">Ward Analytics & Performance</h1>
                <p class="page-subtitle">Compliance rates, officer workloads, and repeat violation hotspots.</p>
            </div>
        </div>
        
        <div class="card-section">
            <div class="card-header"><div class="card-title">Ward-Wise Case Distribution</div></div>
            <div class="card-body">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Ward</th>
                            <th>Total Cases</th>
                            <th>Notice Issued</th>
                            <th>Actions Completed</th>
                            <th>Compliance Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>Ward 4 (Central)</td><td>12</td><td>4</td><td>6</td><td><span class="badge badge-compliance">85%</span></td></tr>
                        <tr><td>Ward 2 (North)</td><td>8</td><td>3</td><td>4</td><td><span class="badge badge-verified">75%</span></td></tr>
                        <tr><td>Ward 5 (South)</td><td>15</td><td>5</td><td>8</td><td><span class="badge badge-action">90%</span></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderHistoryPage(container) {
    const cases = getCasesStore();
    const allAuditLogs = [];

    cases.forEach(c => {
        c.timeline.forEach(t => {
            allAuditLogs.push({
                caseId: c.id,
                ...t
            });
        });
    });

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">System Audit Log & History</h1>
                <p class="page-subtitle">Immutable chronological registry of every status change and officer action.</p>
            </div>
        </div>

        <div class="card-section">
            <div class="card-body" style="padding:0;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Case ID</th>
                            <th>Action / Status</th>
                            <th>Performed By</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allAuditLogs.map(l => `
                            <tr>
                                <td style="font-size:0.8rem; color:var(--text-secondary);">${l.timestamp}</td>
                                <td class="case-id-cell">${l.caseId}</td>
                                <td>${getStatusBadge(l.status)}</td>
                                <td style="font-weight:600;">${l.actor}</td>
                                <td>${l.notes}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderCasesPage(container) {
    const cases = getCasesStore();
    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">Cases Registry</h1>
                <p class="page-subtitle">View and filter all municipal encroachment reports</p>
            </div>
        </div>

        <div class="filter-bar">
            <div class="search-box">
                <i data-lucide="search"></i>
                <input type="text" id="registrySearch" placeholder="Search cases..." onkeyup="filterRegistryCases()">
            </div>
        </div>

        <div class="card-section">
            <div class="card-body" style="padding:0;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Case ID</th>
                            <th>Type</th>
                            <th>Ward</th>
                            <th>Reported Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="registryTableBody">
                        ${cases.map(c => `
                            <tr onclick="viewCaseDetails('${c.id}')">
                                <td class="case-id-cell">${c.id}</td>
                                <td>${c.type}</td>
                                <td>${c.ward}</td>
                                <td>${c.reportedDate}</td>
                                <td>${getStatusBadge(c.status)}</td>
                                <td><button class="btn btn-secondary btn-sm">Details</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/* ==========================================================================
   4. CASE DETAILS PAGE (THE MOST POLISHED SCREEN)
   ========================================================================== */
function viewCaseDetails(caseId) {
    selectedCaseId = caseId;
    currentView = 'details';
    renderSidebarMenu();
    renderMainView();
}

function renderCaseDetailsPage(container) {
    const cases = getCasesStore();
    const c = cases.find(item => item.id === selectedCaseId);

    if (!c) {
        container.innerHTML = `<div class="page-header"><h1>Case not found</h1></div>`;
        return;
    }

    container.innerHTML = `
        <!-- Top Back Navigation -->
        <div style="margin-bottom: 1rem;">
            <button class="btn btn-secondary btn-sm" onclick="currentView='dashboard'; renderMainView();">
                <i data-lucide="arrow-left"></i> Back to Dashboard
            </button>
        </div>

        <!-- Case Title & Status Header -->
        <div class="card-section" style="margin-bottom: 1.5rem;">
            <div class="card-body" style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem;">
                <div>
                    <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.4rem;">
                        <h1 class="page-title" style="margin:0;">${c.id}</h1>
                        ${getStatusBadge(c.status)}
                        <span class="badge ${c.priority === 'High' ? 'badge-overdue' : 'badge-reported'}">${c.priority} Priority</span>
                    </div>
                    <p class="page-subtitle">${c.type} • <strong>${c.category}</strong> • ${c.ward}</p>
                </div>

                <!-- Action Button Toolbar (Role Based) -->
                <div class="page-actions" style="gap:0.5rem; flex-wrap:wrap;">
                    ${currentRole === 'officer' || currentRole === 'municipal' ? `
                        <button class="btn btn-secondary btn-sm" onclick="openOfficerActionModal('${c.id}', 'verify')">
                            <i data-lucide="check-square"></i> Verify Report
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="openOfficerActionModal('${c.id}', 'notice')">
                            <i data-lucide="file-text"></i> Issue Notice
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="openOfficerActionModal('${c.id}', 'action')">
                            <i data-lucide="truck"></i> Record Action
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="openOfficerActionModal('${c.id}', 'escalate')">
                            <i data-lucide="alert-octagon"></i> Escalate Overdue
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>

        <!-- Detailed Grid -->
        <div class="case-details-container">
            <!-- Main Content Column -->
            <div class="details-main-column">

                <!-- 1. Photo Evidence Section -->
                <div class="card-section">
                    <div class="card-header">
                        <div class="card-title"><i data-lucide="camera"></i> Photo Evidence & Records</div>
                    </div>
                    <div class="card-body">
                        <div class="evidence-grid">
                            ${c.evidencePhotos.map((photo, index) => `
                                <div class="evidence-card">
                                    <img src="${photo}" class="evidence-img" alt="Evidence ${index + 1}">
                                    <div class="evidence-label">
                                        <span>Reported Evidence #${index + 1}</span>
                                        <i data-lucide="zoom-in" style="width:14px; cursor:pointer;" onclick="window.open('${photo}')"></i>
                                    </div>
                                </div>
                            `).join('')}

                            ${c.actionDetails && c.actionDetails.afterPhoto ? `
                                <div class="evidence-card" style="border-color:#10b981;">
                                    <img src="${c.actionDetails.afterPhoto}" class="evidence-img" alt="After Action Photo">
                                    <div class="evidence-label" style="background-color:#dcfce7; color:#166534;">
                                        <span>Demolition / Removal Verified</span>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- 2. Location & Map Section -->
                <div class="card-section">
                    <div class="card-header">
                        <div class="card-title"><i data-lucide="map-pin"></i> Incident Location & GIS Pin</div>
                    </div>
                    <div class="card-body">
                        <p style="margin-bottom:0.75rem; font-weight:600; color:var(--text-primary);">
                            <i data-lucide="navigation" style="width:15px; color:var(--primary-blue);"></i> ${c.locationText}
                        </p>
                        <div id="caseDetailMap" class="map-container"></div>
                    </div>
                </div>

                <!-- 3. Description & Details -->
                <div class="card-section">
                    <div class="card-header">
                        <div class="card-title"><i data-lucide="file-spread-sheet"></i> Case Description & Specifics</div>
                    </div>
                    <div class="card-body">
                        <p style="font-size:0.9rem; line-height:1.6; color:var(--text-primary);">${c.description}</p>
                    </div>
                </div>

                <!-- 4. Official Notice & Action Cards (If Issued) -->
                ${c.noticeInfo ? `
                    <div class="card-section" style="border-left:4px solid #f59e0b;">
                        <div class="card-header" style="background-color:#fef3c7;">
                            <div class="card-title" style="color:#92400e;">
                                <i data-lucide="file-text"></i> Municipal Removal Notice Details
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="form-row">
                                <div><strong>Notice Number:</strong> ${c.noticeInfo.noticeNumber}</div>
                                <div><strong>Issued Date:</strong> ${c.noticeInfo.issuedDate}</div>
                                <div><strong>Issued To:</strong> ${c.noticeInfo.issuedTo}</div>
                                <div><strong>Deadline Date:</strong> <span style="color:#ef4444; font-weight:700;">${c.noticeInfo.deadlineDate}</span></div>
                            </div>
                        </div>
                    </div>
                ` : ''}

            </div>

            <!-- Side Timeline & Meta Column -->
            <div class="details-side-column">
                
                <!-- Quick Meta Summary Box -->
                <div class="card-section">
                    <div class="card-header">
                        <div class="card-title"><i data-lucide="info"></i> Case Summary</div>
                    </div>
                    <div class="card-body" style="font-size:0.85rem; display:flex; flex-direction:column; gap:0.75rem;">
                        <div>
                            <span class="text-secondary">Reported Date:</span>
                            <div style="font-weight:600;">${c.reportedDate}</div>
                        </div>
                        <div>
                            <span class="text-secondary">Reported By:</span>
                            <div style="font-weight:600;">${c.reportedBy}</div>
                        </div>
                        <div>
                            <span class="text-secondary">Assigned Inspector:</span>
                            <div style="font-weight:600; color:var(--primary-blue);">${c.assignedOfficer}</div>
                        </div>
                    </div>
                </div>

                <!-- Complete Vertical Timeline -->
                <div class="card-section">
                    <div class="card-header">
                        <div class="card-title"><i data-lucide="git-commit"></i> Case Status Timeline</div>
                    </div>
                    <div class="card-body">
                        <div class="timeline">
                            ${c.timeline.map((step, idx) => `
                                <div class="timeline-item ${idx === c.timeline.length - 1 ? 'active' : 'completed'}">
                                    <div class="timeline-dot"></div>
                                    <div class="timeline-content">
                                        <div class="timeline-title">${step.status}</div>
                                        <div class="timeline-time">${step.timestamp} • ${step.actor}</div>
                                        <div class="timeline-desc">${step.notes}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;

    // Render case Leaflet map
    setTimeout(() => {
        if (c.coordinates) {
            const detailMap = L.map('caseDetailMap').setView(c.coordinates, 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(detailMap);
            L.marker(c.coordinates).addTo(detailMap).bindPopup(`<b>${c.id}</b><br/>${c.locationText}`).openPopup();
        }
    }, 100);

    lucide.createIcons();
}

/* ==========================================================================
   MODALS & WORKFLOW ACTIONS
   ========================================================================== */

// Open Report Encroachment Modal
function openReportModal() {
    const container = document.getElementById('modalContainer');
    container.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">Report Illegal Hoarding or Encroachment</div>
                    <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
                </div>
                <form onsubmit="submitNewReport(event)">
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Violation Category *</label>
                            <select class="form-control" id="reportType" required>
                                <option value="Illegal Hoarding">Illegal Commercial Hoarding</option>
                                <option value="Digital Encroachment">Digital Billboard / Screen Encroachment</option>
                                <option value="Political Banner / Flex">Unauthorized Political Banner / Flex</option>
                                <option value="Structural Encroachment">Footpath Structural Encroachment</option>
                            </select>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Ward / Zone *</label>
                                <select class="form-control" id="reportWard" required>
                                    <option value="Ward 4 (Central Business District)">Ward 4 (Central CBD)</option>
                                    <option value="Ward 2 (North Zone)">Ward 2 (North Zone)</option>
                                    <option value="Ward 5 (South Zone)">Ward 5 (South Zone)</option>
                                    <option value="Ward 1 (East Zone)">Ward 1 (East Zone)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Priority Assessment</label>
                                <select class="form-control" id="reportPriority">
                                    <option value="Medium">Medium Priority</option>
                                    <option value="High">High (Traffic/Safety Hazard)</option>
                                    <option value="Low">Low Priority</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Street Address & Landmark *</label>
                            <input type="text" class="form-control" id="reportLocation" placeholder="e.g. Near Metro Gate 2, SV Road Junction" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Upload Photo Evidence *</label>
                            <div style="border: 2px dashed var(--border-color); padding:1.5rem; text-align:center; border-radius:var(--radius-sm); background-color:var(--bg-subtle);">
                                <i data-lucide="upload-cloud" style="width:32px; height:32px; color:var(--text-secondary); margin-bottom:0.5rem;"></i>
                                <div style="font-size:0.85rem; font-weight:600;">Click or Drag photo here</div>
                                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">JPG, PNG up to 10MB (GPS Exif automatically extracted)</div>
                                <input type="file" id="reportPhotoInput" style="display:none;" accept="image/*" onchange="previewUpload(this)">
                                <button type="button" class="btn btn-secondary btn-sm" style="margin-top:0.75rem;" onclick="document.getElementById('reportPhotoInput').click()">Select Photo File</button>
                                <div id="photoPreviewText" style="margin-top:0.5rem; font-size:0.8rem; color:#10b981; font-weight:600;"></div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Detailed Description</label>
                            <textarea class="form-control" id="reportDescription" placeholder="Describe the size, lighting hazard, missing QR license tag, or physical obstruction details..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary"><i data-lucide="send"></i> Submit Official Report</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function previewUpload(input) {
    if (input.files && input.files[0]) {
        document.getElementById('photoPreviewText').textContent = `✓ Photo Attached: ${input.files[0].name}`;
    }
}

function submitNewReport(e) {
    e.preventDefault();
    const type = document.getElementById('reportType').value;
    const ward = document.getElementById('reportWard').value;
    const priority = document.getElementById('reportPriority').value;
    const location = document.getElementById('reportLocation').value;
    const description = document.getElementById('reportDescription').value;

    const newId = `SHD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowStr = new Date().toLocaleString();

    const cases = getCasesStore();
    const newCase = {
        id: newId,
        type: type,
        category: type,
        ward: ward,
        locationText: location,
        coordinates: [18.5204 + (Math.random() - 0.5) * 0.04, 73.8567 + (Math.random() - 0.5) * 0.04],
        reportedDate: nowStr,
        reportedBy: "Sarah Jenkins (Citizen)",
        priority: priority,
        status: "Reported",
        description: description || "Unauthorized structure reported by citizen.",
        assignedOfficer: "Inspector Rajesh Varma",
        evidencePhotos: [
            "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=60"
        ],
        verificationInfo: null,
        noticeInfo: null,
        actionDetails: null,
        complianceDetails: null,
        timeline: [
            {
                status: "Reported",
                actor: "Sarah Jenkins",
                timestamp: nowStr,
                notes: "Citizen filed digital report with photo evidence."
            }
        ]
    };

    cases.unshift(newCase);
    saveCasesStore(cases);

    closeModal();
    showToast(`Case ${newId} successfully registered!`, 'success');
    viewCaseDetails(newId);
}

// Officer Action Modal
function openOfficerActionModal(caseId, actionType) {
    const container = document.getElementById('modalContainer');
    container.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">Officer Action: ${actionType.toUpperCase()} (Case ${caseId})</div>
                    <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
                </div>
                <form onsubmit="processOfficerAction(event, '${caseId}', '${actionType}')">
                    <div class="modal-body">
                        ${actionType === 'verify' ? `
                            <div class="form-group">
                                <label class="form-label">Field Verification Result</label>
                                <select class="form-control" id="verifResult">
                                    <option value="Verified">Confirmed Violation (Verified)</option>
                                    <option value="Rejected">Invalid Report / Licensed Structure</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Inspection Notes & Findings</label>
                                <textarea class="form-control" id="actionNotes" required placeholder="Enter inspection details, license QR status, structural check..."></textarea>
                            </div>
                        ` : ''}

                        ${actionType === 'notice' ? `
                            <div class="form-group">
                                <label class="form-label">Notice Serial Number</label>
                                <input type="text" class="form-control" id="noticeNum" value="MNC/NTC/2026/${Math.floor(1000+Math.random()*9000)}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Issued Violator Name / Entity</label>
                                <input type="text" class="form-control" id="noticeEntity" placeholder="Agency or Owner Name" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Removal Deadline (Hours)</label>
                                <select class="form-control" id="noticeHours">
                                    <option value="24">24 Hours (Urgent Hazard)</option>
                                    <option value="72" selected>72 Hours (Standard Commercial Notice)</option>
                                    <option value="168">7 Days</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Notice Notes</label>
                                <textarea class="form-control" id="actionNotes" placeholder="Specific dismantling instructions..."></textarea>
                            </div>
                        ` : ''}

                        ${actionType === 'action' ? `
                            <div class="form-group">
                                <label class="form-label">Action Execution Type</label>
                                <select class="form-control" id="actionExecType">
                                    <option value="Forced Demolition & Seizure">Forced Demolition & Seizure</option>
                                    <option value="Voluntary Removal by Owner">Voluntary Removal by Owner</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Demolition / Removal Squad Notes</label>
                                <textarea class="form-control" id="actionNotes" required placeholder="Details of removal squad, seized material, fine imposed..."></textarea>
                            </div>
                        ` : ''}

                        ${actionType === 'escalate' ? `
                            <div class="form-group">
                                <label class="form-label">Escalation Reason</label>
                                <textarea class="form-control" id="actionNotes" required placeholder="Notice period expired. Requesting senior commissioner emergency demolition order..."></textarea>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save & Advance Workflow</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function processOfficerAction(e, caseId, actionType) {
    e.preventDefault();
    const cases = getCasesStore();
    const c = cases.find(item => item.id === caseId);
    if (!c) return;

    const notes = document.getElementById('actionNotes') ? document.getElementById('actionNotes').value : '';
    const nowStr = new Date().toLocaleString();

    if (actionType === 'verify') {
        const res = document.getElementById('verifResult').value;
        c.status = res;
        c.verificationInfo = {
            verifiedBy: "Inspector Rajesh Varma",
            verifiedDate: nowStr,
            notes: notes
        };
        c.timeline.push({ status: res, actor: "Inspector Rajesh Varma", timestamp: nowStr, notes: notes });
    } else if (actionType === 'notice') {
        const noticeNum = document.getElementById('noticeNum').value;
        const entity = document.getElementById('noticeEntity').value;
        c.status = "Notice Issued";
        c.noticeInfo = {
            noticeNumber: noticeNum,
            issuedDate: nowStr,
            issuedTo: entity,
            deadlineDate: "Within Notice Window",
            status: "Active"
        };
        c.timeline.push({ status: "Notice Issued", actor: "Inspector Rajesh Varma", timestamp: nowStr, notes: `Notice ${noticeNum} issued to ${entity}. ${notes}` });
    } else if (actionType === 'action') {
        const execType = document.getElementById('actionExecType').value;
        c.status = "Action Taken";
        c.actionDetails = {
            actionDate: nowStr,
            actionBy: "Municipal Removal Squad",
            actionType: execType,
            notes: notes,
            afterPhoto: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=60"
        };
        c.timeline.push({ status: "Action Taken", actor: "Municipal Squad", timestamp: nowStr, notes: `${execType}: ${notes}` });
    } else if (actionType === 'escalate') {
        c.status = "Overdue";
        c.timeline.push({ status: "Overdue Escalation", actor: "Inspector Rajesh Varma", timestamp: nowStr, notes: `Escalated: ${notes}` });
    }

    saveCasesStore(cases);
    closeModal();
    showToast(`Case ${caseId} updated successfully!`, 'success');
    renderMainView();
}

function closeModal() {
    const container = document.getElementById('modalContainer');
    container.innerHTML = '';
}

// Toast System
function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'info'}"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => toast.remove(), 3500);
}

// Helper Badge Renderer
function getStatusBadge(status) {
    switch (status) {
        case 'Reported':
            return `<span class="badge badge-reported"><span class="badge-dot"></span>Reported</span>`;
        case 'Under Verification':
            return `<span class="badge badge-verifying"><span class="badge-dot"></span>Under Verification</span>`;
        case 'Verified':
            return `<span class="badge badge-verified"><span class="badge-dot"></span>Verified</span>`;
        case 'Notice Issued':
            return `<span class="badge badge-notice"><span class="badge-dot"></span>Notice Issued</span>`;
        case 'Action Taken':
            return `<span class="badge badge-action"><span class="badge-dot"></span>Action Taken</span>`;
        case 'Compliance':
            return `<span class="badge badge-compliance"><span class="badge-dot"></span>Compliance</span>`;
        case 'Closed':
            return `<span class="badge badge-closed"><span class="badge-dot"></span>Closed</span>`;
        case 'Overdue':
            return `<span class="badge badge-overdue"><span class="badge-dot"></span>Overdue Action</span>`;
        default:
            return `<span class="badge badge-reported">${status}</span>`;
    }
}
