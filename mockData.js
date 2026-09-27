/**
 * CivicTrack Municipal System - Mock Data Store
 * Problem Statement 5: Illegal Hoarding Detection + Digital Encroachment Management
 */

const INITIAL_CASES = [
    {
        id: "SHD-2026-1042",
        type: "Illegal Hoarding",
        category: "Structural Commercial",
        ward: "Ward 4 (Central Business District)",
        locationText: "Corner of MG Road & SV Patel Marg, near City Center Bus Stop",
        coordinates: [18.5204, 73.8567],
        reportedDate: "2026-09-26 10:14 AM",
        reportedBy: "Sarah Jenkins (Citizen)",
        priority: "High",
        status: "Notice Issued", // Reported -> Under Verification -> Verified -> Notice Issued -> Action Taken -> Compliance -> Closed
        description: "Massive 30x15ft commercial advertisement hoarding erected without municipal license on public footbridge structural support. Obstructs traffic vision.",
        assignedOfficer: "Inspector Rajesh Varma",
        evidencePhotos: [
            "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=60",
            "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=60"
        ],
        verificationInfo: {
            verifiedBy: "Inspector Rajesh Varma",
            verifiedDate: "2026-09-26 02:30 PM",
            notes: "Inspected site. Confirmed hoarding has no PMC registration QR tag. Structure poses safety hazard to pedestrians."
        },
        noticeInfo: {
            noticeNumber: "MNC/NTC/2026/0891",
            issuedDate: "2026-09-27 09:00 AM",
            issuedTo: "SkyHigh Media Pvt Ltd",
            deadlineDays: 3,
            deadlineDate: "2026-09-30 05:00 PM",
            status: "Active - Pending Demolition / Removal"
        },
        actionDetails: null,
        complianceDetails: null,
        timeline: [
            {
                status: "Reported",
                actor: "Sarah Jenkins (Citizen)",
                timestamp: "2026-09-26 10:14 AM",
                notes: "Citizen submitted report with 2 photo evidences and GPS coordinates."
            },
            {
                status: "Under Verification",
                actor: "System Auto-Assign",
                timestamp: "2026-09-26 10:15 AM",
                notes: "Assigned to Ward 4 Field Officer Inspector Rajesh Varma."
            },
            {
                status: "Verified",
                actor: "Inspector Rajesh Varma",
                timestamp: "2026-09-26 02:30 PM",
                notes: "Field inspection completed. Confirmed unauthorized commercial installation."
            },
            {
                status: "Notice Issued",
                actor: "Inspector Rajesh Varma",
                timestamp: "2026-09-27 09:00 AM",
                notes: "72-hour removal notice MNC/NTC/2026/0891 dispatched to violator."
            }
        ]
    },
    {
        id: "SDE-2026-1043",
        type: "Digital Encroachment",
        category: "LED Screen Encroachment",
        ward: "Ward 2 (North Zone)",
        locationText: "Shop #42, Main Market Road, opposite St. Xavier School",
        coordinates: [18.5314, 73.8447],
        reportedDate: "2026-09-27 08:30 AM",
        reportedBy: "Amitabh Shah (Citizen)",
        priority: "Medium",
        status: "Under Verification",
        description: "High-luminance commercial LED billboard flashing moving lights after 10 PM directly into residential windows and distracting drivers near school zone.",
        assignedOfficer: "Officer David Chen",
        evidencePhotos: [
            "https://images.unsplash.com/photo-1508873696983-2df515122519?w=600&auto=format&fit=crop&q=60"
        ],
        verificationInfo: null,
        noticeInfo: null,
        actionDetails: null,
        complianceDetails: null,
        timeline: [
            {
                status: "Reported",
                actor: "Amitabh Shah (Citizen)",
                timestamp: "2026-09-27 08:30 AM",
                notes: "Report logged via Mobile Web Portal."
            },
            {
                status: "Under Verification",
                actor: "Officer David Chen",
                timestamp: "2026-09-27 09:15 AM",
                notes: "Officer acknowledged assignment. Site visit scheduled for tonight."
            }
        ]
    },
    {
        id: "SHD-2026-1039",
        type: "Illegal Hoarding",
        category: "Political Banner / Flex",
        ward: "Ward 5 (South Zone)",
        locationText: "Flyover Pillar #14, Station Road Junction",
        coordinates: [18.5104, 73.8687],
        reportedDate: "2026-09-24 04:20 PM",
        reportedBy: "Rohan Kulkarni (Citizen)",
        priority: "High",
        status: "Action Taken",
        description: "Unauthorized political celebration flex banner covering traffic signal lights at busy 4-way intersection.",
        assignedOfficer: "Inspector Rajesh Varma",
        evidencePhotos: [
            "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=60"
        ],
        verificationInfo: {
            verifiedBy: "Inspector Rajesh Varma",
            verifiedDate: "2026-09-25 09:00 AM",
            notes: "Verified traffic obstruction hazard."
        },
        noticeInfo: {
            noticeNumber: "MNC/NTC/2026/0877",
            issuedDate: "2026-09-25 10:00 AM",
            issuedTo: "Local Organizer Group",
            deadlineDays: 1,
            deadlineDate: "2026-09-26 10:00 AM",
            status: "Expired - Direct Action Taken"
        },
        actionDetails: {
            actionDate: "2026-09-26 02:00 PM",
            actionBy: "Municipal Demolition Squad #3",
            actionType: "Forced Demolition & Seizure",
            notes: "Banner dismantled and impounded. Penalty fine of ₹25,000 billed to organizer.",
            afterPhoto: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=60"
        },
        complianceDetails: null,
        timeline: [
            {
                status: "Reported",
                actor: "Rohan Kulkarni",
                timestamp: "2026-09-24 04:20 PM",
                notes: "Submitted via portal."
            },
            {
                status: "Under Verification",
                actor: "Inspector Rajesh Varma",
                timestamp: "2026-09-25 08:30 AM",
                notes: "Site visit queued."
            },
            {
                status: "Verified",
                actor: "Inspector Rajesh Varma",
                timestamp: "2026-09-25 09:00 AM",
                notes: "Hazard flag marked."
            },
            {
                status: "Notice Issued",
                actor: "Inspector Rajesh Varma",
                timestamp: "2026-09-25 10:00 AM",
                notes: "24-hr urgent notice issued."
            },
            {
                status: "Action Taken",
                actor: "Demolition Squad #3",
                timestamp: "2026-09-26 02:00 PM",
                notes: "Dismantled and removed by municipal squad."
            }
        ]
    },
    {
        id: "SDE-2026-1035",
        type: "Digital Encroachment",
        category: "Unauthorized Footpath Kiosk",
        ward: "Ward 1 (East Zone)",
        locationText: "Outside Metro Station Gate 2",
        coordinates: [18.5284, 73.8747],
        reportedDate: "2026-09-20 11:00 AM",
        reportedBy: "Priya Sharma (Citizen)",
        priority: "Low",
        status: "Closed",
        description: "Digital advertising standee occupying 50% of public footpath width near metro exit.",
        assignedOfficer: "Officer David Chen",
        evidencePhotos: [
            "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=60"
        ],
        verificationInfo: {
            verifiedBy: "Officer David Chen",
            verifiedDate: "2026-09-21 10:00 AM",
            notes: "Confirmed encroaching standee."
        },
        noticeInfo: {
            noticeNumber: "MNC/NTC/2026/0842",
            issuedDate: "2026-09-21 11:30 AM",
            issuedTo: "Metro Retailers Assn",
            deadlineDays: 2,
            deadlineDate: "2026-09-23 11:30 AM",
            status: "Complied"
        },
        actionDetails: {
            actionDate: "2026-09-23 04:00 PM",
            actionBy: "Officer David Chen",
            actionType: "Compliance Verification",
            notes: "Owner voluntarily removed the digital kiosk upon receiving notice."
        },
        complianceDetails: {
            complianceDate: "2026-09-24 09:30 AM",
            verifiedBy: "Officer David Chen",
            fineAmount: "₹5,000 Paid",
            status: "Full Compliance Verified"
        },
        timeline: [
            { status: "Reported", actor: "Priya Sharma", timestamp: "2026-09-20 11:00 AM", notes: "Report logged." },
            { status: "Under Verification", actor: "Officer David Chen", timestamp: "2026-09-21 09:00 AM", notes: "Assigned." },
            { status: "Verified", actor: "Officer David Chen", timestamp: "2026-09-21 10:00 AM", notes: "Encroachment verified." },
            { status: "Notice Issued", actor: "Officer David Chen", timestamp: "2026-09-21 11:30 AM", notes: "Notice issued." },
            { status: "Action Taken", actor: "Owner / Officer", timestamp: "2026-09-23 04:00 PM", notes: "Kiosk removed." },
            { status: "Compliance", actor: "Officer David Chen", timestamp: "2026-09-24 09:30 AM", notes: "Fine paid, site clear." },
            { status: "Closed", actor: "Admin System", timestamp: "2026-09-24 10:00 AM", notes: "Case closed successfully." }
        ]
    },
    {
        id: "SHD-2026-1045",
        type: "Illegal Hoarding",
        category: "Unsafe Structural Billboard",
        ward: "Ward 4 (Central Business District)",
        locationText: "Near Highway Junction, Flyover Ramp",
        coordinates: [18.5234, 73.8597],
        reportedDate: "2026-09-21 03:00 PM",
        reportedBy: "Vikram Mehta (Citizen)",
        priority: "High",
        status: "Overdue",
        description: "Large 40ft rusted metal billboard frame dangling loosely over active traffic lane during heavy wind.",
        assignedOfficer: "Inspector Rajesh Varma",
        evidencePhotos: [
            "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=60"
        ],
        verificationInfo: {
            verifiedBy: "Inspector Rajesh Varma",
            verifiedDate: "2026-09-22 11:00 AM",
            notes: "Structural vulnerability verified."
        },
        noticeInfo: {
            noticeNumber: "MNC/NTC/2026/0850",
            issuedDate: "2026-09-22 02:00 PM",
            issuedTo: "Vanguard Outdoor Media",
            deadlineDays: 2,
            deadlineDate: "2026-09-24 02:00 PM",
            status: "DEADLINE EXPIRED - OVERDUE ACTION"
        },
        actionDetails: null,
        complianceDetails: null,
        timeline: [
            { status: "Reported", actor: "Vikram Mehta", timestamp: "2026-09-21 03:00 PM", notes: "Urgent safety report." },
            { status: "Verified", actor: "Inspector Rajesh Varma", timestamp: "2026-09-22 11:00 AM", notes: "Vulnerability verified." },
            { status: "Notice Issued", actor: "Inspector Rajesh Varma", timestamp: "2026-09-22 02:00 PM", notes: "Notice deadline expired on Sep 24." }
        ]
    }
];

// Helper to get local data or initialize default
function getCasesStore() {
    const data = localStorage.getItem('civictrack_cases_v1');
    if (!data) {
        localStorage.setItem('civictrack_cases_v1', JSON.stringify(INITIAL_CASES));
        return INITIAL_CASES;
    }
    return JSON.parse(data);
}

function saveCasesStore(cases) {
    localStorage.setItem('civictrack_cases_v1', JSON.stringify(cases));
}
