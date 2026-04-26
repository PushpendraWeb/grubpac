# grubpac

Content Broadcasting System (Backend Only)

## Setup & Run

### Prerequisites
- **Node.js** (LTS recommended)
- **MySQL** running locally (or update `config.env` to point to your DB)

### Install dependencies
```bash
npm install
```

### Configure environment
This project loads environment variables from `config.env` (see `server.js`).

Update these values in `config.env` before starting:
- **PORT**: default `2000`
- **DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME**
- **JWT_SECRET**

### Start the server
```bash
npm run dev
```

or

```bash
npm start
```

Server health check:
- `GET /` → `Hello World! Project is running`
- API base URL (default): `http://localhost:2000`

## Postman (Collection + Environment)

Postman files are in the `postman/` folder:
- **Collection**: `postman/GrubPac.postman_collection.json`
- **Environment**: `postman/GrubPac.postman_environment.json`
- **Example request bodies**: `postman/request-bodies.json`

### Variables
The Postman setup uses:
- **`{{grubpac}}`** = `http://localhost:2000`
- **`{{auth}}`** = JWT access token (paste the token string only)

### Import steps
- Import the collection file.
- Import the environment file and select **GrubPac Local**.
- Call **Auth → Login** (no auth required).
- Copy the JWT token from the login response and set it into **Environment → `auth`**.
- Now call the secured APIs (they automatically send `Authorization: Bearer {{auth}}`).

### API groups included
All URLs use the mounted prefixes from `src/routes/index.js`:
- `/api/auth/*`
- `/api/users/*`
- `/api/roles/*`
- `/api/content/*`
- `/api/content_slots/*`
- `/api/content_schedule/*`
- `/api/approval/*`
- `/api/file_uploader/upload-single` (multipart `file`)

## Uploads

### Local uploads (default)
- Uploaded files are served from: `GET /uploads/<filename>`
- Upload endpoint: `POST /api/file_uploader/upload-single` (multipart/form-data with field `file`)

### S3 uploads (optional)
S3 is used only when both are set in `config.env`:
- `S3_BUCKET_NAME`
- `AWS_REGION` (or `S3_REGION`)

## Architecture Notes

### Tech Stack
- Backend: Node.js + Express (CommonJS)
- Database: MySQL via Sequelize ORM (configured in `config.env`)
- Auth: JWT + RBAC (Principal / Teacher)
- Upload: Multer (Local by default; S3 supported when configured)


1) Authentication & RBAC Flow
-----------------------------
Authentication
- User logs in with email/password.
- Passwords are hashed using bcrypt (`src/utils/password.util.js`).
- On successful login, server returns a JWT access token.

Authorization (RBAC)
- Protected routes use `auth` middleware (`src/middlewares/auth.middleware.js`).
- Middleware validates JWT and attaches user context (userId, role_id/role).
- Role checks are enforced at route/controller level:
  - Principal-only:
    - view all content
    - view pending content
    - approve content
    - reject content with rejection reason
  - Teacher-only:
    - upload content
    - view own uploads + statuses

Security rules
- Never expose password hashes in responses.
- Public broadcasting endpoints do NOT require JWT but must only expose approved + currently active content.


2) Subject-based System Design
------------------------------
Core idea
- Content is always tied to a Subject (Maths, Science, etc.).
- Each subject has its own independent rotation schedule.
- Broadcasting API can be teacher-specific and (optionally) subject-filtered.

Entities (minimum)
- Users:
  - id, name, email, password_hash, role (principal/teacher), created_at
- Content:
  - id, title, description, subject
  - file_url/file_path, file_type, file_size
  - uploaded_by (teacher id)
  - status: uploaded → pending → approved/rejected
  - rejection_reason (nullable)
  - approved_by (principal id, nullable), approved_at (nullable)
  - start_time, end_time (required for “active”; if missing → not active)
  - rotation_duration_minutes (optional per content; default can be applied)
  - created_at
- Content Slots (Subject-based):
  - id, subject, created_at
- Content Schedule:
  - id, content_id, slot_id, rotation_order, duration_minutes, created_at

Relationships
- User (Teacher) 1—N Content
- User (Principal) 1—N approvals (Content.approved_by)
- Subject 1—N ContentSlots
- Slot 1—N ContentSchedule rows
- Content 1—N ContentSchedule rows (if re-used across schedules)


3) Upload Handling Approach
---------------------------
Supported formats
- JPG, PNG, GIF only
- Enforced by mimetype allow-list

File size
- Max size: 10MB
- Enforced by multer limit

Required fields for content upload
- Title (string, mandatory)
- Subject (string, mandatory)
- File (multipart form-data field, mandatory)

Optional fields
- Description
- start_time, end_time
- rotation duration (minutes)

Storage strategy
- Local storage (required by assignment):
  - Store file under a local uploads directory
  - Persist `file_path` as local path and/or `file_url` as server-accessible URL
- S3 (bonus; already supported in this project):
  - S3 client + multer-s3 in `src/utils/s3Upload.util.js`
  - Upload endpoint in `src/routes/upload/fileuploader.js`
  - Env config in `config.env`:
    - `S3_BUCKET_NAME`, `AWS_REGION`, `S3_ALLOWED_MIME_TYPES`, `S3_MAX_FILE_MB`, etc.
Local upload serving
- Server exposes local uploads at `GET /uploads/<filename>` via Express static middleware.

Upload response shape (single upload)
- Return:
  - fileName
  - file_url (public URL)
  - file_path (S3 key or local path)
  - file_type (mimetype)
  - file_size (bytes)


4) Approval Workflow Design
---------------------------
Lifecycle
- uploaded → pending → approved / rejected

Rules
- Only Principal can approve/reject.
- Rejection must include a reason.
- Approval sets:
  - status = approved
  - approved_by = principal_id
  - approved_at = now()
- Rejection sets:
  - status = rejected
  - rejection_reason = provided reason
  - approved_by/approved_at remain null (or track reviewer separately if desired)

Visibility
- Teachers can see their own content and its status + rejection reason.
- Students (public API) can only see approved content that is currently active per schedule rules.


5) Scheduling / Rotation Logic (VERY IMPORTANT)
-----------------------------------------------
Definitions
- Eligible content must satisfy ALL:
  - status = approved
  - uploaded_by matches the teacher in the public endpoint
  - has a valid schedule window: start_time and end_time are present
  - current time is within [start_time, end_time]
  - belongs to a subject

Subject-based independent rotation
- Rotation runs independently per subject for that teacher.
- For each subject, gather all eligible content items in rotation order.

Rotation duration
- Each item has a duration in minutes:
  - Prefer `ContentSchedule.duration_minutes` if scheduling table is used
  - Else fall back to `Content.rotation_duration_minutes`
  - Else fall back to a default (e.g., 5 minutes)

How “currently active content” is computed
- For a given (teacher, subject):
  - Let eligible list = [c1, c2, ..., cn] ordered by rotation_order (or created_at if none).
  - If n = 0 → no content available.
  - Let durations = [d1..dn] in seconds.
  - Let cycle = sum(durations).
  - Use current time (e.g., UNIX epoch seconds) to compute:
    - offset = now % cycle
    - Walk durations until cumulative > offset; that item is active.
- This produces a continuous loop:
  - A for 5 min, then B for 5 min, then C for 5 min, repeat.

Teacher-defined start_time/end_time behavior
- If start_time/end_time missing → content is not active (never broadcast).
- Within window → eligible for rotation.
- Outside window → excluded.


6) Public Broadcasting API Rules + Edge Cases
---------------------------------------------
Endpoints (examples)
- GET /content/live/teacher-:teacherId
- Optional query: ?subject=maths

Response rules
- Return only approved + currently active content for that teacher (and subject if filtered).
- Never expose pending/rejected content.

Edge cases (must be handled)
- Case 1: No content available
  - No approved content exists → return { message: "No content available" } (or empty result)
- Case 2: Approved but not scheduled
  - Approved exists but outside time window or missing window → treat as no content available
- Case 3: Invalid subject
  - Return empty/no content (not an error)


7) Folder Structure & Middleware Usage
--------------------------------------
Suggested layout (matches assignment)
src/
  controllers/
  routes/
  services/
  middlewares/
  models/
  utils/
  config/

Middleware
- `auth.middleware.js`: JWT verification + user context injection
- Validation middleware (Joi): validate params/body for correctness and safety
- Upload middleware:
  - file size + mimetype checks
  - clean error responses (LIMIT_FILE_SIZE, unsupported format)


8) Scalability Approach (practical, not distributed-systems heavy)
------------------------------------------------------------------
- Caching (bonus):
  - Cache `/content/live/...` for short TTL (e.g., 10–30s) keyed by (teacherId, subject).
- Rate limiting (bonus):
  - Apply limits to public endpoint to avoid abuse.
- Pagination & filters (bonus):
  - For principal/teacher dashboards: filter by subject/status/teacher + paginate results.
- S3 + CDN:
  - Store files in S3 and serve via CloudFront for scale.
- Observability:
  - Centralized error handling and request logging.

