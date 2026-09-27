/**
 * CivicTrack Municipal Application Core Engine
 * Handles State, Navigation, Role Switching, Leaflet Maps, and Case Workflow Actions
 */

// Application State
let currentRole = 'citizen'; // 'citizen' | 'officer' | 'municipal'
let currentView = 'dashboard'; // 'dashboard' | 'cases' | 'overdue' | 'notifications' | 'details' | 'map' | 'monitoring' | 'history'
let selectedCaseId = null;
let mapInstance = null;
let pickerMapInstance = null;
let activeNotifFilter = 'ALL';
let activeAssignedFilter = 'ALL';

// Lifecycle Initialization
document.addEventListener('DOMContentLoaded', () => {
    switchRole('citizen');
});

// Role Switcher Handler
function switchRole(role) {
    currentRole = role;

    // Update Role Selector Dropdown
    const roleSelect = document.getElementById('roleSelect');
    if (roleSelect && roleSelect.value !== role) {
        roleSelect.value = role;
    }

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

    updateNotificationBadges();
    renderSidebarMenu();
    renderMainView();
    showToast(`Switched to ${role.toUpperCase()} mode`, 'info');
}

// Quick Open Notifications View
function openNotificationsView() {
    if (currentRole !== 'citizen') {
        switchRole('citizen');
    }
    currentView = 'notifications';
    renderSidebarMenu();
    renderMainView();
}

// Update Badges across Header and Sidebar
function updateNotificationBadges() {
    const notifs = typeof getCitizenNotificationsStore === 'function' ? getCitizenNotificationsStore() : [];
    const unreadCount = notifs.filter(n => !n.read).length;
    
    const navNotifBadge = document.getElementById('navNotifBadge');
    if (navNotifBadge) {
        if (unreadCount > 0) {
            navNotifBadge.textContent = unreadCount;
            navNotifBadge.style.display = 'flex';
        } else {
            navNotifBadge.style.display = 'none';
        }
    }
}

// Render Contextual Sidebar Menu
function renderSidebarMenu() {
    const menuContainer = document.getElementById('sidebarMenu');
    menuContainer.innerHTML = '';

    const notifs = typeof getCitizenNotificationsStore === 'function' ? getCitizenNotificationsStore() : [];
    const unreadNotifsCount = notifs.filter(n => !n.read).length;

    const cases = typeof getCasesStore === 'function' ? getCasesStore() : [];
    const overdueCasesCount = cases.filter(c => c.status === 'Overdue').length;
    const assignedCasesCount = cases.filter(c => c.assignedOfficer && c.assignedOfficer.includes('Rajesh Varma')).length;

    let items = [];

    if (currentRole === 'citizen') {
        items = [
            { id: 'dashboard', label: 'My Cases', icon: 'layout-dashboard' },
            { id: 'report-new', label: '+ Report New Case', icon: 'plus-circle', isAction: true },
            { id: 'notifications', label: 'Notifications', icon: 'bell', badge: unreadNotifsCount > 0 ? `${unreadNotifsCount}` : null }
        ];
    } else if (currentRole === 'officer') {
        items = [
            { id: 'dashboard', label: 'Officer Overview', icon: 'layout-dashboard' },
            { id: 'cases', label: 'Assigned Cases', icon: 'briefcase', badge: assignedCasesCount > 0 ? `${assignedCasesCount}` : null },
            { id: 'overdue', label: 'Overdue Cases', icon: 'alert-triangle', badge: overdueCasesCount > 0 ? `${overdueCasesCount}` : null, isUrgent: true }
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
            ${item.badge ? `<span class="badge ${item.isUrgent ? 'badge-overdue' : 'badge-reported'}" style="margin-left:auto;">${item.badge}</span>` : ''}
        `;
        menuContainer.appendChild(menuItem);
    });

    lucide.createIcons();
    updateNotificationBadges();
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
        if (currentView === 'notifications') {
            renderCitizenNotifications(contentArea);
        } else {
            renderCitizenDashboard(contentArea);
        }
    } else if (currentRole === 'officer') {
        if (currentView === 'cases') {
            renderOfficerAssignedCases(contentArea);
        } else if (currentView === 'overdue') {
            renderOfficerOverdueCases(contentArea);
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
   1. CITIZEN DASHBOARD & NOTIFICATIONS CENTER
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
                <button class="btn btn-secondary" onclick="currentView='notifications'; renderSidebarMenu(); renderMainView();">
                    <i data-lucide="bell"></i> View Notifications
                </button>
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
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    <button class="btn btn-secondary" style="border-color: #86efac; color: #166534;" onclick="openReportModal()">
                        <i data-lucide="camera"></i> Quick Photo Report
                    </button>
                </div>
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

// Dedicated Citizen Notifications View
function renderCitizenNotifications(container) {
    const notifs = getCitizenNotificationsStore();
    const unreadCount = notifs.filter(n => !n.read).length;

    let filteredNotifs = notifs;
    if (activeNotifFilter === 'UNREAD') {
        filteredNotifs = notifs.filter(n => !n.read);
    } else if (activeNotifFilter === 'NOTICE') {
        filteredNotifs = notifs.filter(n => n.category === 'notice');
    } else if (activeNotifFilter === 'ACTION') {
        filteredNotifs = notifs.filter(n => n.category === 'action');
    } else if (activeNotifFilter === 'VERIFY') {
        filteredNotifs = notifs.filter(n => n.category === 'verify' || n.category === 'compliance');
    }

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">Citizen Grievance Notifications & Alerts</h1>
                <p class="page-subtitle">Real-time municipal action updates, removal notices, and inspection milestones for your reported cases.</p>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary btn-sm" onclick="markAllNotificationsAsRead()">
                    <i data-lucide="check-check"></i> Mark All Read
                </button>
                <button class="btn btn-secondary btn-sm" onclick="clearReadNotifications()">
                    <i data-lucide="trash-2"></i> Clear Read
                </button>
            </div>
        </div>

        <div class="notifications-container">
            <!-- Filter Tabs -->
            <div class="notifications-tabs">
                <button class="notif-tab ${activeNotifFilter === 'ALL' ? 'active' : ''}" onclick="setNotifFilter('ALL')">
                    <i data-lucide="inbox"></i> All (${notifs.length})
                </button>
                <button class="notif-tab ${activeNotifFilter === 'UNREAD' ? 'active' : ''}" onclick="setNotifFilter('UNREAD')">
                    <i data-lucide="bell"></i> Unread (${unreadCount})
                </button>
                <button class="notif-tab ${activeNotifFilter === 'NOTICE' ? 'active' : ''}" onclick="setNotifFilter('NOTICE')">
                    <i data-lucide="file-text"></i> Removal Notices
                </button>
                <button class="notif-tab ${activeNotifFilter === 'ACTION' ? 'active' : ''}" onclick="setNotifFilter('ACTION')">
                    <i data-lucide="truck"></i> Demolition / Seizures
                </button>
                <button class="notif-tab ${activeNotifFilter === 'VERIFY' ? 'active' : ''}" onclick="setNotifFilter('VERIFY')">
                    <i data-lucide="shield-check"></i> Officer Verifications
                </button>
            </div>

            <!-- Notifications List -->
            <div class="notification-list">
                ${filteredNotifs.length === 0 ? `
                    <div class="empty-state-box">
                        <i data-lucide="bell-off" class="empty-state-icon"></i>
                        <h3 class="empty-state-title">No Notifications in this filter</h3>
                        <p class="empty-state-text">You have no active grievance updates in this category. You will receive live alerts when municipal officers inspect or resolve your reports.</p>
                    </div>
                ` : filteredNotifs.map(n => `
                    <div class="notification-card ${!n.read ? 'unread' : ''}">
                        <div class="notif-icon-wrapper ${getNotifIconClass(n.category)}">
                            <i data-lucide="${getNotifIconName(n.category)}"></i>
                        </div>
                        <div class="notif-body">
                            <div class="notif-header">
                                <div class="notif-title">${n.title}</div>
                                <div class="notif-time">${n.timestamp}</div>
                            </div>
                            <div class="notif-desc">${n.message}</div>
                            <div class="notif-footer">
                                ${n.caseId ? `
                                    <span class="notif-case-tag" onclick="viewCaseDetails('${n.caseId}')" style="cursor:pointer;" title="Click to view full case">
                                        <i data-lucide="link" style="width:12px; height:12px; display:inline; vertical-align:middle; margin-right:4px;"></i>${n.caseId}
                                    </span>
                                ` : '<span></span>'}
                                <div class="notif-actions-group">
                                    <button class="btn btn-secondary btn-sm" onclick="toggleNotificationRead('${n.id}', ${!n.read})">
                                        <i data-lucide="${n.read ? 'mail' : 'check'}"></i> ${n.read ? 'Mark Unread' : 'Mark as Read'}
                                    </button>
                                    ${n.caseId ? `
                                        <button class="btn btn-primary btn-sm" onclick="viewCaseDetails('${n.caseId}')">
                                            <i data-lucide="arrow-right"></i> View Case Progress
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    lucide.createIcons();
}

function getNotifIconClass(cat) {
    switch (cat) {
        case 'notice': return 'notif-icon-notice';
        case 'action': return 'notif-icon-action';
        case 'verify': return 'notif-icon-verify';
        case 'compliance': return 'notif-icon-compliance';
        case 'overdue': return 'notif-icon-overdue';
        default: return 'notif-icon-verify';
    }
}

function getNotifIconName(cat) {
    switch (cat) {
        case 'notice': return 'file-text';
        case 'action': return 'truck';
        case 'verify': return 'check-circle-2';
        case 'compliance': return 'shield-check';
        case 'overdue': return 'alert-triangle';
        default: return 'bell';
    }
}

function setNotifFilter(filter) {
    activeNotifFilter = filter;
    renderMainView();
}

function toggleNotificationRead(notifId, isRead) {
    const notifs = getCitizenNotificationsStore();
    const item = notifs.find(n => n.id === notifId);
    if (item) {
        item.read = isRead;
        saveCitizenNotificationsStore(notifs);
        updateNotificationBadges();
        renderSidebarMenu();
        renderMainView();
    }
}

function markAllNotificationsAsRead() {
    const notifs = getCitizenNotificationsStore();
    notifs.forEach(n => n.read = true);
    saveCitizenNotificationsStore(notifs);
    updateNotificationBadges();
    renderSidebarMenu();
    renderMainView();
    showToast('All notifications marked as read', 'success');
}

function clearReadNotifications() {
    const notifs = getCitizenNotificationsStore();
    const unread = notifs.filter(n => !n.read);
    saveCitizenNotificationsStore(unread);
    updateNotificationBadges();
    renderSidebarMenu();
    renderMainView();
    showToast('Read notifications cleared', 'info');
}

/* ==========================================================================
   2. FIELD OFFICER DASHBOARD & SEPARATE ASSIGNED / OVERDUE PAGES
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
                <h1 class="page-title">Field Officer Overview Dashboard</h1>
                <p class="page-subtitle">Assigned Jurisdiction: <strong>Ward 4 (CBD) & Ward 5 (South)</strong> • Inspector Rajesh Varma</p>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary" onclick="renderMainView()">
                    <i data-lucide="rotate-cw"></i> Sync Workspace
                </button>
            </div>
        </div>

        <!-- KPI Grid -->
        <div class="kpi-grid">
            <div class="kpi-card" onclick="currentView='cases'; renderSidebarMenu(); renderMainView();" style="cursor:pointer;" title="View Assigned Cases">
                <div class="kpi-header">
                    <span>New / Assigned</span>
                    <div class="kpi-icon"><i data-lucide="inbox"></i></div>
                </div>
                <div class="kpi-value">${newCasesCount}</div>
                <div class="kpi-footer">Requires initial review &rarr;</div>
            </div>

            <div class="kpi-card" onclick="currentView='cases'; renderSidebarMenu(); renderMainView();" style="cursor:pointer;">
                <div class="kpi-header">
                    <span>Pending Verification</span>
                    <div class="kpi-icon"><i data-lucide="search"></i></div>
                </div>
                <div class="kpi-value">${pendingVerifCount}</div>
                <div class="kpi-footer">Field site visit pending</div>
            </div>

            <div class="kpi-card" onclick="currentView='cases'; renderSidebarMenu(); renderMainView();" style="cursor:pointer;">
                <div class="kpi-header">
                    <span>Action Pending</span>
                    <div class="kpi-icon"><i data-lucide="clock"></i></div>
                </div>
                <div class="kpi-value">${actionPendingCount}</div>
                <div class="kpi-footer">Notice active / Removal pending</div>
            </div>

            <div class="kpi-card" onclick="currentView='overdue'; renderSidebarMenu(); renderMainView();" style="border-left: 3px solid #ef4444; cursor:pointer;" title="View Overdue Enforcement Queue">
                <div class="kpi-header">
                    <span>Overdue Cases</span>
                    <div class="kpi-icon" style="background-color:#fee2e2; color:#ef4444;"><i data-lucide="alert-circle"></i></div>
                </div>
                <div class="kpi-value" style="color:#ef4444;">${overdueCount}</div>
                <div class="kpi-footer urgent">Demolition dispatch needed &rarr;</div>
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
   2A. DEDICATED OFFICER ASSIGNED CASES PAGE
   ========================================================================== */
function renderOfficerAssignedCases(container) {
    const cases = getCasesStore();
    const assignedCases = cases.filter(c => !c.assignedOfficer || c.assignedOfficer.includes('Rajesh Varma') || c.ward.includes('Ward 4') || c.ward.includes('Ward 5'));

    const newAssigned = assignedCases.filter(c => c.status === 'Reported').length;
    const underVerif = assignedCases.filter(c => c.status === 'Under Verification').length;
    const activeNotices = assignedCases.filter(c => c.status === 'Notice Issued').length;
    const actionsTaken = assignedCases.filter(c => c.status === 'Action Taken').length;

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">Officer Assigned Cases Registry</h1>
                <p class="page-subtitle">Field Work Orders specifically assigned to Inspector Rajesh Varma • Ward 4 CBD & Ward 5 South</p>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary" onclick="renderMainView()">
                    <i data-lucide="rotate-cw"></i> Refresh Assigned Queue
                </button>
            </div>
        </div>

        <!-- Assigned Summary KPI Row -->
        <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); margin-bottom: 1.5rem;">
            <div class="kpi-card">
                <div class="kpi-header"><span>Assigned Queue</span><i data-lucide="briefcase"></i></div>
                <div class="kpi-value">${assignedCases.length}</div>
                <div class="kpi-footer">Total active workload</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-header"><span>Site Visit Needed</span><i data-lucide="map-pin"></i></div>
                <div class="kpi-value">${newAssigned + underVerif}</div>
                <div class="kpi-footer">Pending verification</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-header"><span>Active 72h Notices</span><i data-lucide="file-text"></i></div>
                <div class="kpi-value">${activeNotices}</div>
                <div class="kpi-footer">Under compliance window</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-header"><span>Actions Completed</span><i data-lucide="truck"></i></div>
                <div class="kpi-value">${actionsTaken}</div>
                <div class="kpi-footer">Removal registered</div>
            </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="filter-bar">
            <div class="search-box">
                <i data-lucide="search"></i>
                <input type="text" id="assignedSearch" placeholder="Search assigned cases by ID, street address or keywords..." onkeyup="filterAssignedOfficerCases()">
            </div>
            <div class="filter-group">
                <select class="filter-select" id="assignedStatusFilter" onchange="filterAssignedOfficerCases()">
                    <option value="ALL">All Statuses</option>
                    <option value="Reported">Reported (New)</option>
                    <option value="Under Verification">Under Verification</option>
                    <option value="Verified">Verified</option>
                    <option value="Notice Issued">Notice Issued</option>
                    <option value="Action Taken">Action Taken</option>
                    <option value="Closed">Closed & Complied</option>
                </select>

                <select class="filter-select" id="assignedPriorityFilter" onchange="filterAssignedOfficerCases()">
                    <option value="ALL">All Priorities</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                </select>

                <select class="filter-select" id="assignedWardFilter" onchange="filterAssignedOfficerCases()">
                    <option value="ALL">All Assigned Wards</option>
                    <option value="Ward 4">Ward 4 (CBD)</option>
                    <option value="Ward 5">Ward 5 (South)</option>
                </select>
            </div>
        </div>

        <!-- Assigned Table -->
        <div class="card-section">
            <div class="card-header">
                <div class="card-title">
                    <i data-lucide="list-checks"></i> Inspector Rajesh Varma's Assigned Work Orders
                </div>
                <span class="text-secondary" style="font-size:0.85rem;" id="assignedCountBadge">Showing ${assignedCases.length} assigned cases</span>
            </div>
            <div class="card-body" style="padding:0;">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Case ID</th>
                                <th>Category & Details</th>
                                <th>Location & Ward</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Officer Action</th>
                            </tr>
                        </thead>
                        <tbody id="assignedTableBody">
                            ${renderAssignedTableRows(assignedCases)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function renderAssignedTableRows(casesList) {
    if (casesList.length === 0) {
        return `<tr><td colspan="6" style="text-align:center; padding: 2rem; color:var(--text-muted);">No assigned cases match the criteria.</td></tr>`;
    }

    return casesList.map(c => `
        <tr onclick="viewCaseDetails('${c.id}')">
            <td class="case-id-cell">${c.id}</td>
            <td>
                <div style="font-weight:600;">${c.type}</div>
                <div style="font-size:0.75rem; color:var(--text-secondary); max-width:260px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.description}</div>
            </td>
            <td>
                <div style="font-weight:500;">${c.ward}</div>
                <div style="font-size:0.75rem; color:var(--text-secondary); max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.locationText}</div>
            </td>
            <td>
                <span class="badge ${c.priority === 'High' ? 'badge-overdue' : 'badge-reported'}">${c.priority} Priority</span>
            </td>
            <td>${getStatusBadge(c.status)}</td>
            <td>
                <div style="display:flex; gap:0.4rem;" onclick="event.stopPropagation();">
                    <button class="btn btn-primary btn-sm" onclick="viewCaseDetails('${c.id}')">
                        <i data-lucide="edit-3"></i> Process Case
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="openOfficerActionModal('${c.id}', '${c.status === 'Reported' || c.status === 'Under Verification' ? 'verify' : c.status === 'Verified' ? 'notice' : 'action'}')">
                        <i data-lucide="zap"></i> Quick Action
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterAssignedOfficerCases() {
    const search = document.getElementById('assignedSearch').value.toLowerCase();
    const status = document.getElementById('assignedStatusFilter').value;
    const priority = document.getElementById('assignedPriorityFilter').value;
    const ward = document.getElementById('assignedWardFilter').value;

    const cases = getCasesStore();
    const assignedCases = cases.filter(c => !c.assignedOfficer || c.assignedOfficer.includes('Rajesh Varma') || c.ward.includes('Ward 4') || c.ward.includes('Ward 5'));

    const filtered = assignedCases.filter(c => {
        const matchesSearch = c.id.toLowerCase().includes(search) ||
                              c.locationText.toLowerCase().includes(search) ||
                              c.description.toLowerCase().includes(search) ||
                              c.type.toLowerCase().includes(search);
        const matchesStatus = status === 'ALL' || c.status === status;
        const matchesPriority = priority === 'ALL' || c.priority === priority;
        const matchesWard = ward === 'ALL' || c.ward.includes(ward);
        return matchesSearch && matchesStatus && matchesPriority && matchesWard;
    });

    document.getElementById('assignedTableBody').innerHTML = renderAssignedTableRows(filtered);
    const countBadge = document.getElementById('assignedCountBadge');
    if (countBadge) countBadge.textContent = `Showing ${filtered.length} assigned cases`;
    lucide.createIcons();
}

/* ==========================================================================
   2B. DEDICATED OFFICER OVERDUE CASES PAGE
   ========================================================================== */
function renderOfficerOverdueCases(container) {
    const cases = getCasesStore();
    const overdueCases = cases.filter(c => c.status === 'Overdue');

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title" style="color: #991b1b;"><i data-lucide="alert-octagon" style="display:inline; vertical-align:middle; width:26px; height:26px; margin-right:6px; color:#ef4444;"></i> Overdue & Escalated Cases</h1>
                <p class="page-subtitle">Statutory Notice Deadlines Breached • Immediate Squad Demolition & Compounding Penalty Orders Required</p>
            </div>
            <div class="page-actions">
                <button class="btn btn-danger" onclick="showToast('Emergency Squad Demolition Dispatch Alert sent to Control Room', 'success')">
                    <i data-lucide="send"></i> Dispatch All Squads
                </button>
            </div>
        </div>

        <!-- High-Priority Urgent Warning Banner -->
        <div class="urgent-escalation-banner">
            <div class="urgent-escalation-content">
                <div class="urgent-icon-box">
                    <i data-lucide="alert-triangle"></i>
                </div>
                <div>
                    <div class="urgent-title">CRITICAL ENFORCEMENT QUEUE (${overdueCases.length} Active Overdue Violations)</div>
                    <div class="urgent-subtitle">
                        The cases listed below have exceeded their statutory compliance notice deadlines without violator removal. 
                        <strong>Municipal bylaws section 244 authorizes immediate forced demolition, structural confiscation, and maximum compounding fine ₹50,000.</strong>
                    </div>
                </div>
            </div>
        </div>

        <!-- Overdue Metrics Strip -->
        <div class="overdue-metrics-grid">
            <div class="overdue-kpi">
                <div class="overdue-kpi-title">Expired Notices</div>
                <div class="overdue-kpi-val">${overdueCases.length}</div>
                <div class="overdue-kpi-desc">Compliance window lapsed</div>
            </div>
            <div class="overdue-kpi">
                <div class="overdue-kpi-title">Average Delay</div>
                <div class="overdue-kpi-val" style="color:#d97706;">+48 Hours</div>
                <div class="overdue-kpi-desc">SLA penalty compounding</div>
            </div>
            <div class="overdue-kpi">
                <div class="overdue-kpi-title">Pending Penalties</div>
                <div class="overdue-kpi-val" style="color:#15803d;">₹50,000</div>
                <div class="overdue-kpi-desc">Compounding fine ready</div>
            </div>
            <div class="overdue-kpi">
                <div class="overdue-kpi-title">Demolition Squad</div>
                <div class="overdue-kpi-val" style="color:#2563eb;">Squad #4</div>
                <div class="overdue-kpi-desc">Standby for deployment</div>
            </div>
        </div>

        <!-- Search Bar -->
        <div class="filter-bar">
            <div class="search-box">
                <i data-lucide="search"></i>
                <input type="text" id="overdueSearch" placeholder="Search overdue cases by ID, violator or location..." onkeyup="filterOverdueOfficerCases()">
            </div>
            <div class="filter-group">
                <select class="filter-select" id="overdueWardFilter" onchange="filterOverdueOfficerCases()">
                    <option value="ALL">All Wards</option>
                    <option value="Ward 4">Ward 4 (CBD)</option>
                    <option value="Ward 5">Ward 5 (South)</option>
                    <option value="Ward 2">Ward 2 (North)</option>
                </select>
            </div>
        </div>

        <!-- Overdue Cases Table -->
        <div class="card-section" style="border-top: 3px solid #ef4444;">
            <div class="card-header" style="background-color: #fef2f2;">
                <div class="card-title" style="color: #991b1b;">
                    <i data-lucide="flame" style="color:#ef4444;"></i> Urgent Enforcement Action Queue
                </div>
                <span class="badge badge-overdue">${overdueCases.length} Overdue Cases</span>
            </div>
            <div class="card-body" style="padding:0;">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Case ID</th>
                                <th>Violation & Violator Details</th>
                                <th>Notice Number</th>
                                <th>Expired Deadline</th>
                                <th>SLA Status</th>
                                <th>Emergency Enforcement Action</th>
                            </tr>
                        </thead>
                        <tbody id="overdueTableBody">
                            ${renderOverdueTableRows(overdueCases)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function renderOverdueTableRows(casesList) {
    if (casesList.length === 0) {
        return `<tr><td colspan="6" style="text-align:center; padding: 2.5rem; color:var(--text-muted);"><i data-lucide="check-circle" style="width:32px; height:32px; color:#10b981; margin-bottom:0.5rem; display:block; margin-inline:auto;"></i>No cases are currently overdue. All notice windows are compliant!</td></tr>`;
    }

    return casesList.map(c => `
        <tr onclick="viewCaseDetails('${c.id}')" style="background-color: #fffdfd;">
            <td class="case-id-cell" style="color:#ef4444;">${c.id}</td>
            <td>
                <div style="font-weight:700; color:#991b1b;">${c.type}</div>
                <div style="font-size:0.75rem; color:var(--text-secondary);">${c.locationText} (${c.ward})</div>
                <div style="font-size:0.75rem; color:#b91c1c; margin-top:2px;">Violator: <strong>${c.noticeInfo ? c.noticeInfo.issuedTo : 'Commercial Owner'}</strong></div>
            </td>
            <td>
                <span style="font-family:monospace; font-size:0.8rem; font-weight:600; color:#b45309;">${c.noticeInfo ? c.noticeInfo.noticeNumber : 'MNC/NTC/2026/0850'}</span>
            </td>
            <td>
                <div style="font-size:0.8rem; font-weight:600; color:#ef4444;">${c.noticeInfo ? c.noticeInfo.deadlineDate : 'Sep 24, 02:00 PM'}</div>
                <div style="font-size:0.7rem; color:var(--text-muted);">Deadline Expired</div>
            </td>
            <td>
                <span class="badge-sla-breach">
                    <i data-lucide="alert-triangle" style="width:12px; height:12px;"></i> SLA Breached
                </span>
            </td>
            <td>
                <div style="display:flex; gap:0.4rem; flex-wrap:wrap;" onclick="event.stopPropagation();">
                    <button class="btn btn-danger btn-sm" onclick="openOfficerActionModal('${c.id}', 'action')">
                        <i data-lucide="truck"></i> Execute Demolition
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="viewCaseDetails('${c.id}')">
                        <i data-lucide="eye"></i> Full File
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterOverdueOfficerCases() {
    const search = document.getElementById('overdueSearch').value.toLowerCase();
    const ward = document.getElementById('overdueWardFilter').value;

    const cases = getCasesStore();
    const overdueCases = cases.filter(c => c.status === 'Overdue');

    const filtered = overdueCases.filter(c => {
        const violator = (c.noticeInfo && c.noticeInfo.issuedTo) ? c.noticeInfo.issuedTo.toLowerCase() : '';
        const matchesSearch = c.id.toLowerCase().includes(search) ||
                              c.locationText.toLowerCase().includes(search) ||
                              c.description.toLowerCase().includes(search) ||
                              violator.includes(search);
        const matchesWard = ward === 'ALL' || c.ward.includes(ward);
        return matchesSearch && matchesWard;
    });

    document.getElementById('overdueTableBody').innerHTML = renderOverdueTableRows(filtered);
    lucide.createIcons();
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

    // Create a new citizen notification
    const notifs = getCitizenNotificationsStore();
    notifs.unshift({
        id: `NOTIF-${Date.now()}`,
        caseId: newId,
        title: `Report Registered: ${newId}`,
        message: `Your report regarding ${type} at ${location} has been successfully registered and routed to Ward 4 & 5 inspection teams.`,
        timestamp: "Just now",
        category: "verify",
        read: false
    });
    saveCitizenNotificationsStore(notifs);
    updateNotificationBadges();

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
    let notifTitle = '';
    let notifMsg = '';
    let notifCat = 'verify';

    if (actionType === 'verify') {
        const res = document.getElementById('verifResult').value;
        c.status = res;
        c.verificationInfo = {
            verifiedBy: "Inspector Rajesh Varma",
            verifiedDate: nowStr,
            notes: notes
        };
        c.timeline.push({ status: res, actor: "Inspector Rajesh Varma", timestamp: nowStr, notes: notes });
        notifTitle = `Field Inspection: Case ${caseId} ${res}`;
        notifMsg = `Inspector Rajesh Varma completed on-site inspection. Result: ${res}. ${notes}`;
        notifCat = 'verify';
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
        notifTitle = `72-Hr Notice Served: Case ${caseId}`;
        notifMsg = `Removal Notice ${noticeNum} served to ${entity}. Violator given statutory compliance deadline.`;
        notifCat = 'notice';
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
        notifTitle = `Enforcement Executed: Case ${caseId}`;
        notifMsg = `${execType} recorded by Municipal Removal Squad. Illegal structure cleared from site.`;
        notifCat = 'action';
    } else if (actionType === 'escalate') {
        c.status = "Overdue";
        c.timeline.push({ status: "Overdue Escalation", actor: "Inspector Rajesh Varma", timestamp: nowStr, notes: `Escalated: ${notes}` });
        notifTitle = `Case Escalated to Demolition Squad: ${caseId}`;
        notifMsg = `Notice deadline expired. Inspector Rajesh Varma escalated violation for emergency demolition dispatch.`;
        notifCat = 'overdue';
    }

    saveCasesStore(cases);

    // Save corresponding citizen notification
    if (notifTitle) {
        const notifs = getCitizenNotificationsStore();
        notifs.unshift({
            id: `NOTIF-${Date.now()}`,
            caseId: caseId,
            title: notifTitle,
            message: notifMsg,
            timestamp: "Just now",
            category: notifCat,
            read: false
        });
        saveCitizenNotificationsStore(notifs);
        updateNotificationBadges();
    }

    closeModal();
    showToast(`Case ${caseId} updated successfully!`, 'success');
    renderSidebarMenu();
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
