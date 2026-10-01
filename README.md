# Quality Management System (QMS)

This repository contains the complete QMS application with a React + Vite frontend and a fully integrated Express.js backend with dummy authentication, role-based access, document lifecycle management, task assignments, and process monitoring.

---

## 📁 Project Structure

```text
QMS-main-updated/
├── QMS-main/               # Frontend UI (React + Vite + Custom CSS)
│   ├── src/
│   │   ├── components/     # UI Components (login, dashboards, tables, tasks, layout)
│   │   ├── context/        # AppContext (synchronized with backend REST APIs)
│   │   ├── services/       # API clients (authService, documentService, taskService, processService, notificationService)
│   │   ├── data/           # Mock data and offline fallbacks
│   │   ├── pages/          # Pages (Documents, Details, Tasks, Reviews, Processes, Employees, History, Notifications, Activity, Profile)
│   │   └── routes/         # React Router routes and role redirection
│   ├── vite.config.js      # Vite configuration with /api backend proxy
│   └── package.json
│
├── backend/                # Backend REST API (Node.js + Express + JWT)
│   ├── controllers/        # auth, document, task, process, notification, activity, employee controllers
│   ├── data/               # Controlled dummy databases (users, documents, tasks, processes, employees, notifications, activities, timeline)
│   ├── middleware/         # JWT verification middleware
│   ├── routes/             # authRoutes, documentRoutes, taskRoutes, processRoutes, notificationRoutes, activityRoutes, employeeRoutes
│   ├── server.js           # Server entry point (Port 5000)
│   ├── .env                # Environment configuration (Port, JWT Secret)
│   └── package.json
│
├── package.json            # Root workspace scripts (runs backend & frontend concurrently)
└── README.md
```

---

## 🚀 How to Run

### Start Both Backend & Frontend with One Command
From the project root:
```bash
npm run dev
```
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Frontend App:** [http://localhost:5173](http://localhost:5173)

---

## 🔑 Dummy Login Credentials

All dummy accounts share the default password: **`1234`**

| Role | Username | Email | Password | Role Selector | Destination Dashboard |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Employee** | `employee` | `employee@cdac.in` | `1234` | Employee | `/employee/dashboard` |
| **Process Owner** | `processowner` | `owner@cdac.in` | `1234` | Process Owner | `/process-owner/dashboard` |
| **QM Group** | `qmgroup` | `qm@cdac.in` | `1234` | QM Group | `/qm-group/dashboard` |
| **QM Head** | `qmhead` | `head@cdac.in` | `1234` | QM Head | `/Head/dashboard` |

> 💡 **Quick Fill:** The login screen features 1-click **Quick Demo** buttons for each role to automatically fill credentials and role selection!

---

## 📡 Backend REST API Endpoints

Base URL: `http://localhost:5000/api` (proxied automatically via `/api` in Vite)

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate with username/email, password & role | No |
| `GET` | `/api/auth/me` | Retrieve currently logged-in user profile | Yes (`Bearer <token>`) |
| `GET` | `/api/auth/demo-users`| List all dummy accounts for testing | No |
| `POST` | `/api/auth/logout` | Terminate session | No |

### Controlled Documents (`/api/documents`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/documents` | List documents (supports `?search=`, `?type=`, `?status=`) | No |
| `GET` | `/api/documents/:id` | Get document by ID with version history & related tasks | No |
| `POST` | `/api/documents` | Upload/register a new controlled document | Yes (`Bearer <token>`) |
| `POST` | `/api/documents/:id/versions` | Create next revision version (archives earlier versions) | Yes (`Bearer <token>`) |
| `PATCH`| `/api/documents/:id/status` | Update document review status & comments (Approved, Changes Requested) | Yes (`Bearer <token>`) |
| `GET` | `/api/documents/:id/download` | Download controlled document text extract | No |

### Task Management (`/api/tasks`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | List all tasks (supports `?employee=`, `?process=`, `?status=`) | No |
| `GET` | `/api/tasks/:id` | Get task details | No |
| `POST` | `/api/tasks` | Assign a new task | Yes (`Bearer <token>`) |
| `PATCH`| `/api/tasks/:id/status` | Update task status (Pending, In Progress, Completed) | Yes (`Bearer <token>`) |
| `DELETE`| `/api/tasks/:id` | Remove a task | Yes (`Bearer <token>`) |

### Process Register & Management Overview (`/api/processes`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/processes` | List all processes with dynamic metrics | No |
| `GET` | `/api/processes/head-overview` | Executive progress %, status breakdown & milestones timeline | No |

### Notifications & Audit Trail
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Get notifications for user role | No |
| `PATCH`| `/api/notifications/:id/read` | Mark a notification as read | No |
| `POST` | `/api/notifications/read-all` | Mark all notifications as read | No |
| `GET` | `/api/activities` | Chronological audit trail across workflows | No |
| `GET` | `/api/employees` | Organization employee directory with mapped processes | No |
| `GET` | `/api/health` | System health check | No |
