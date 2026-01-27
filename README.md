# Interactive Map Application

A full-stack web application that allows users to create accounts, upload maps, share maps with customizable permissions, place points of interest, and filter/organize POIs by category. Built with a Django REST Framework backend and React frontend, connected via Axios to a PostgreSQL database.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Models](#data-models)
- [API Endpoints](#api-endpoints)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [Permission Levels](#permission-levels)
- [Requirements Met](#requirements-met)

---

## Features

### User Management
- User registration with email
- JWT-based authentication (login/logout)
- Password change functionality
- Profile management (bio, location, website)
- Profile picture upload/delete
- Account deletion

### Map Management
- Upload map images (JPEG, PNG, GIF, WebP) or PDF files
- Add/edit/delete map name and description
- Toggle maps as public or private
- Delete maps with cascade deletion of associated data

### Points of Interest (POI)
- Click on map to add points of interest
- Edit/delete existing POIs
- Custom POI colors
- POI descriptions
- List view with sorting (by name, layer, date created, date edited)

### Layers/Categories
- Create custom layers (categories) per map
- Assign colors to layers
- Toggle layer visibility on the map
- Edit/delete layers
- POIs inherit layer colors (with optional override)

### Map Interaction
- Zoom in/out (scroll wheel and buttons)
- Pan/drag when zoomed in
- Fullscreen mode
- Responsive marker scaling

### Sharing System
- Share maps with other users
- Permission levels: View Only, Can Edit, Admin
- Search users by username/email
- Public maps discoverable by all users
- "Shared with me" view

---

## Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| **Python 3.x** | Programming language |
| **Django 5.x** | Web framework |
| **Django REST Framework** | REST API with web-browsable interface |
| **PostgreSQL** | Relational database |
| **psycopg2-binary** | PostgreSQL database adapter for Python |
| **django-cors-headers** | Handles Cross-Origin Resource Sharing (CORS) headers, allowing browser requests from the React frontend |
| **django-filter** | Enables dynamic queryset filtering from URL parameters for simplified database queries |
| **Pillow** | Image processing, display, and file handling capabilities |
| **djangorestframework-simplejwt** | JWT token generation, authentication, and verification |

#### JWT Configuration Details

| Setting | Description |
|---------|-------------|
| **Rotate Refresh Tokens** | Renews refresh token lifetime on each use |
| **Blacklist After Rotation** | Invalidates and rejects old refresh tokens after rotation |
| **Algorithm HS256** | Symmetric HMAC (Hash-based Message Authentication Code) signing and verification. Client and server share the same secret key for token signing |
| **Auth Header Type** | Views requiring authentication expect: `Authorization: Bearer [token]` |
| **User ID Field/Claim** | User ID from database is used for token generation and stored in token claims for identification |

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 18** | UI component framework |
| **React Router v6** | Client-side routing and navigation |
| **Axios** | HTTP client for API communication with the backend |
| **Context API** | Global state management for authentication |
| **CSS3** | Custom styling (no UI framework) |

---

## Project Structure

```
InteractiveMap-DjangoPostgresqlReact/
├── backend/
│   ├── accounts/                 # User authentication & profiles
│   │   ├── __init__.py
│   │   ├── admin.py             # Admin site configuration
│   │   ├── apps.py              # App configuration
│   │   ├── models.py            # User, UserProfile models
│   │   ├── serializers.py       # Data validation and serialization
│   │   ├── urls.py              # URL routing for accounts endpoints
│   │   └── views.py             # API views and database interactions
│   ├── maps/                     # Maps, layers, POIs, sharing
│   │   ├── __init__.py
│   │   ├── admin.py             # Admin site configuration
│   │   ├── apps.py              # App configuration
│   │   ├── models.py            # Map, MapLayer, PointOfInterest, SharedMap
│   │   ├── serializers.py       # Data validation and serialization
│   │   ├── urls.py              # URL routing for maps endpoints
│   │   └── views.py             # API views and database interactions
│   ├── backend/                  # Django project settings
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── settings.py          # Project configuration
│   │   ├── urls.py              # Root URL configuration
│   │   └── wsgi.py
│   ├── media/                    # User uploads (gitignored)
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                  # Axios API services
│   │   │   ├── axios.js         # Axios instance, interceptors, token handling
│   │   │   ├── accounts.js      # Account-related API calls
│   │   │   ├── maps.js          # Map-related API calls
│   │   │   └── index.js         # API exports
│   │   ├── components/
│   │   │   ├── auth/            # Login, Register
│   │   │   ├── common/          # Navbar, Dashboard, ProtectedRoute
│   │   │   ├── maps/            # MapList, MapCreate, MapView, MapEdit, etc.
│   │   │   └── profile/         # Profile management
│   │   ├── context/
│   │   │   └── AuthContext.js   # Authentication state management
│   │   ├── App.js               # Main application component
│   │   ├── App.css
│   │   ├── index.js             # React entry point
│   │   └── index.css
│   ├── public/
│   └── package.json
├── .gitignore
└── README.md
```

### Key Frontend Components

| Component | Description |
|-----------|-------------|
| **axios.js** | Establishes connection to backend, sends JSON data, handles errors, manages token requests/responses |
| **AuthContext.js** | Validates tokens on frontend, checks authentication status, manages data synchronization |
| **ProtectedRoute.js** | Prevents unauthenticated users from accessing protected routes |
| **ShareModal.js** | Handles the map sharing workflow: `ShareModal.js → api/accounts.js → api/axios.js → accounts/urls.py → accounts/views.py` |
| **MapView.js** | Manages map modes (edit, add, share, delete), reads permissions to update UI accordingly |
| **PoiList.js** | Implements POI sorting system using configurable sort options |
| **LayerPanel.js** | Manages layer visibility toggling and color assignments |

---

## Data Models

### User (Django Built-in, Extended)
- username, email, password, first_name, last_name

### UserProfile
| Field | Type | Description |
|-------|------|-------------|
| user | OneToOneField → User | Links to Django User model |
| profile_picture | ImageField | User's avatar image |
| bio | TextField | User biography (max 500 chars) |
| location | CharField | User's location |
| website | URLField | User's website URL |
| created_at | DateTimeField | Profile creation timestamp |
| updated_at | DateTimeField | Last update timestamp |

### Map
| Field | Type | Description |
|-------|------|-------------|
| name | CharField | Map name |
| description | TextField | Map description |
| file | FileField | Uploaded map image or PDF |
| file_type | CharField | 'image' or 'pdf' |
| owner | ForeignKey → User | Map owner |
| width, height | IntegerField | Map dimensions for POI positioning |
| is_public | BooleanField | Public visibility toggle |
| created_at | DateTimeField | Creation timestamp |
| updated_at | DateTimeField | Last update timestamp |

### MapLayer
| Field | Type | Description |
|-------|------|-------------|
| name | CharField | Layer/category name |
| description | TextField | Layer description |
| color | CharField | Hex color code (e.g., #3498db) |
| icon | CharField | Icon identifier |
| map | ForeignKey → Map | Parent map |
| is_visible | BooleanField | Visibility toggle |
| order | IntegerField | Display order |
| created_at | DateTimeField | Creation timestamp |
| updated_at | DateTimeField | Last update timestamp |

### PointOfInterest
| Field | Type | Description |
|-------|------|-------------|
| name | CharField | POI name |
| description | TextField | POI description |
| map | ForeignKey → Map | Parent map |
| layer | ForeignKey → MapLayer | Category (nullable) |
| x_position | DecimalField | X coordinate (percentage) |
| y_position | DecimalField | Y coordinate (percentage) |
| icon | CharField | Custom icon (optional) |
| color | CharField | Custom color override (optional) |
| created_by | ForeignKey → User | Creator |
| created_at | DateTimeField | Creation timestamp |
| updated_at | DateTimeField | Last update timestamp |

### SharedMap
| Field | Type | Description |
|-------|------|-------------|
| map | ForeignKey → Map | Shared map |
| shared_with | ForeignKey → User | Recipient user |
| shared_by | ForeignKey → User | User who shared |
| permission | CharField | 'view', 'edit', or 'admin' |
| created_at | DateTimeField | Share creation timestamp |
| updated_at | DateTimeField | Last update timestamp |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/accounts/register/` | Register new user |
| POST | `/api/accounts/login/` | Login (returns JWT tokens) |
| POST | `/api/accounts/logout/` | Logout (blacklist refresh token) |
| POST | `/api/accounts/token/refresh/` | Refresh access token |

### User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts/me/` | Get current user |
| PATCH | `/api/accounts/me/` | Update current user |
| DELETE | `/api/accounts/delete/` | Delete account |
| POST | `/api/accounts/change-password/` | Change password |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts/profile/` | Get user profile |
| PATCH | `/api/accounts/profile/` | Update profile |
| POST | `/api/accounts/profile/picture/` | Upload profile picture |
| DELETE | `/api/accounts/profile/picture/` | Delete profile picture |

### Users (Search)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts/users/?search=term` | Search users for sharing |

### Maps
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/maps/maps/` | List all accessible maps |
| POST | `/api/maps/maps/` | Create new map |
| GET | `/api/maps/maps/{id}/` | Get map details |
| PATCH | `/api/maps/maps/{id}/` | Update map |
| DELETE | `/api/maps/maps/{id}/` | Delete map |
| GET | `/api/maps/maps/{id}/pois/` | Get map POIs (with sorting) |
| GET | `/api/maps/maps/{id}/layers/` | Get map layers |
| GET | `/api/maps/maps/{id}/user_permission/` | Get user's permission level |
| POST | `/api/maps/maps/{id}/share/` | Share map with user |
| GET | `/api/maps/maps/{id}/shared_users/` | Get shared users list |
| GET | `/api/maps/my-maps/` | List user's own maps |
| GET | `/api/maps/shared-with-me/` | List maps shared with user |
| GET | `/api/maps/public/` | List public maps |

### Layers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/maps/layers/?map={id}` | List layers (filter by map) |
| POST | `/api/maps/layers/` | Create layer |
| GET | `/api/maps/layers/{id}/` | Get layer |
| PATCH | `/api/maps/layers/{id}/` | Update layer |
| DELETE | `/api/maps/layers/{id}/` | Delete layer |

### Points of Interest
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/maps/pois/?map={id}` | List POIs (filter by map/layer) |
| POST | `/api/maps/pois/` | Create POI |
| GET | `/api/maps/pois/{id}/` | Get POI |
| PATCH | `/api/maps/pois/{id}/` | Update POI |
| DELETE | `/api/maps/pois/{id}/` | Delete POI |
| GET | `/api/maps/pois/by_layer/?map={id}` | Get POIs grouped by layer |

### Shared Maps
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/maps/shared/` | List shares |
| PATCH | `/api/maps/shared/{id}/` | Update permission |
| DELETE | `/api/maps/shared/{id}/` | Remove share |

---

## Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### 1. Database Setup

Using PostgreSQL, execute the following SQL commands:

```sql
CREATE DATABASE interactive_map_db;
CREATE USER db_username WITH PASSWORD 'db_password';
GRANT ALL PRIVILEGES ON DATABASE interactive_map_db TO db_username;
```

### 2. Backend Setup

**Clone the repository:**
```bash
git clone https://github.com/JustinJabrica/InteractiveMap-DjangoPostgresqlReact.git
cd InteractiveMap-DjangoPostgresqlReact/backend
```

**Create `.env` file in the `backend/backend/` directory:**
```env
SECRET_KEY=your-256-bit-secret-key-here
DEBUG=True
DB_NAME=interactive_map_db
DB_USER=db_username
DB_PASSWORD=db_password
DB_HOST=localhost
DB_PORT=5432
```

> **Note:** The `SECRET_KEY` should be a secure, randomly generated 256-bit key for production environments.

**Create and activate virtual environment:**
```bash
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

**Install dependencies:**
```bash
pip install -r requirements.txt
```

**Run database migrations:**
```bash
python manage.py makemigrations accounts
python manage.py makemigrations maps
python manage.py migrate
```

**Create a superuser (optional, for admin access):**
```bash
python manage.py createsuperuser
```

**Start the development server:**
```bash
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup

**Navigate to frontend directory:**
```bash
cd ../frontend
```

**Install dependencies:**
```bash
npm install
```

**Create `.env` file (optional):**
```env
REACT_APP_API_URL=http://localhost:8000/api
```

**Start the development server:**
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

---

## Usage

1. **Register** a new account or **login** with existing credentials
2. **Create a map** by uploading an image or PDF file
3. **Add layers/categories** to organize your points of interest
4. **Enable "Add POI" mode** and click on the map to place points of interest
5. **Toggle layer visibility** to show/hide groups of POIs
6. **Share your map** with other users and assign permission levels
7. **Make maps public** for anyone to discover

---

## Permission Levels

| Permission | View Map | Edit Map | Add POI | Edit POI | Delete POI | Share | Manage Shares | Delete Map |
|------------|:--------:|:--------:|:-------:|:--------:|:----------:|:-----:|:-------------:|:----------:|
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Edit** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **View** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Environment Variables

### Backend (.env)
| Variable | Description | Required |
|----------|-------------|:--------:|
| `SECRET_KEY` | Django secret key (256-bit recommended) | Yes |
| `DEBUG` | Debug mode (True/False) | No |
| `DB_NAME` | PostgreSQL database name | Yes |
| `DB_USER` | PostgreSQL username | Yes |
| `DB_PASSWORD` | PostgreSQL password | Yes |
| `DB_HOST` | PostgreSQL host | Yes |
| `DB_PORT` | PostgreSQL port | Yes |

### Frontend (.env)
| Variable | Description | Required |
|----------|-------------|:--------:|
| `REACT_APP_API_URL` | Backend API URL | No |

---

## Requirements Met

This application fulfills the following technical requirements:

| Requirement | Status |
|-------------|:------:|
| Django backend with Django REST Framework REST API | ✅ |
| PostgreSQL database | ✅ |
| At least 6 separate models with CRUD operations via DRF | ✅ |
| Django migrations and ORM for database management | ✅ |
| React frontend | ✅ |
| Axios for API calls to the backend | ✅ |
| Most CRUD operations used for most models | ✅ |

---

## License

This project is for educational purposes.

---

## Author

Justin Jabrica
