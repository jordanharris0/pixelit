# Docker Setup Guide for Pixelit Backend

## 📚 Understanding Docker Concepts

### What is Docker?
Docker is a **containerization platform** that packages your application with all its dependencies into a standardized unit called a **container**. Think of it like a shipping container that holds everything your app needs to run.

**Without Docker:**
- Developer A has Node.js 20 → App works
- Developer B has Node.js 24 → App breaks
- Production uses Ubuntu 22 → More conflicts
- "Works on my machine" problems

**With Docker:**
- Everyone runs the exact same environment
- Dev, staging, production all use identical containers
- No environment-related bugs

### Key Docker Terms

1. **Image** - A blueprint/template (like a recipe)
   - Defined in `Dockerfile`
   - Read-only
   - Can create multiple containers from one image

2. **Container** - A running instance of an image (like a finished dish)
   - Running, isolated environment
   - Has its own filesystem, network, processes
   - Can start/stop/restart

3. **docker-compose** - Orchestration tool to run multiple containers together
   - Defines all services (database, cache, app)
   - Manages networking between services
   - Easy startup with one command

4. **Volume** - Persistent storage
   - Survives container restart
   - Database data, Redis cache stored here

5. **Network** - How containers communicate
   - `postgres:5432` resolves to the postgres container
   - Internal communication doesn't expose to host

---

## 🏗️ What These Files Do

### Dockerfile (Multi-Stage Build)

```dockerfile
FROM node:24-alpine AS builder
```
- Starts with Node.js 24 Alpine image (lightweight Linux)
- "builder" is just a name for this stage

```dockerfile
WORKDIR /app
```
- Creates `/app` directory inside container
- All subsequent commands run from here

```dockerfile
COPY package*.json ./
RUN npm ci --omit=dev
```
- Copies `package.json` and `package-lock.json` from your machine to container
- `npm ci` = "clean install" (deterministic, better than `npm install`)
- `--omit=dev` = skip dev dependencies (save space)

```dockerfile
FROM node:24-alpine (Stage 2)
COPY --from=builder /app/node_modules ./node_modules
```
- Second FROM = new stage (discards builder's intermediate files)
- Only copies needed files from builder
- Results in **smaller final image** (production best practice)

```dockerfile
EXPOSE 12000
```
- Documents that app listens on port 12000
- Doesn't actually open the port (docker-compose does)

```dockerfile
HEALTHCHECK
```
- Docker periodically checks if container is alive
- If fails 3 times → Docker marks as "unhealthy"
- Automatic restart can be triggered

```dockerfile
CMD ["node", "server.js"]
```
- Default command to run when container starts
- Equivalent to typing `node server.js`

---

### docker-compose.yml

#### Services Section
Three services work together:

**1. PostgreSQL (Database)**
```yaml
postgres:
  image: postgres:16-alpine
  environment:
    POSTGRES_USER: jorda
    POSTGRES_PASSWORD: Troublemaker99
    POSTGRES_DB: pixelit
  ports:
    - "5432:5432"
```
- Runs PostgreSQL version 16
- Port mapping: `HOST:CONTAINER` (5432:5432 means localhost:5432 → container:5432)
- Environment variables configure the database

**2. Redis (Cache)**
```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
```
- Runs Redis for caching/sessions
- Keeps server fast by caching queries

**3. Backend (Your Node.js App)**
```yaml
backend:
  build:
    context: .
    dockerfile: Dockerfile
```
- Uses the Dockerfile we created
- `context: .` means build from current directory

```yaml
depends_on:
  postgres:
    condition: service_healthy
```
- Waits for PostgreSQL to be healthy before starting
- Prevents app crashing due to missing database

```yaml
environment:
  DATABASE_URL: postgresql://jorda:Troublemaker99@postgres:5432/pixelit
```
- **Key insight:** Uses `postgres` hostname (Docker resolves this to the postgres container)
- **NOT** `localhost` (that would look on the host machine)

```yaml
volumes:
  - .:/app  # Mount project folder for live changes
  - /app/node_modules  # Keep container's node_modules
```
- First line: syncs your code changes instantly (no rebuild)
- Second line: Docker's npm modules, don't overwrite with host

#### Volumes Section
```yaml
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```
- Named volumes persist data between container restarts
- Without these, data disappears when containers stop

#### Networks Section
```yaml
networks:
  pixelit-network:
    driver: bridge
```
- Creates an isolated network
- Services communicate internally via DNS (e.g., `postgres:5432`)
- External access only through exposed ports

---

## 🚀 How to Use

### Start Everything
```bash
docker-compose up
```
- Builds image if needed
- Starts all 3 containers
- Shows combined logs from all services
- Ctrl+C stops everything

### Start in Background
```bash
docker-compose up -d
```
- `-d` = detached mode (runs in background)
- Get your terminal back

### View Running Containers
```bash
docker-compose ps
```

### View Logs
```bash
docker-compose logs -f
```
- `-f` = follow (live updates)
- `docker-compose logs backend` = just backend logs

### Stop Everything
```bash
docker-compose down
```
- Stops and removes containers
- Data in volumes is preserved

### Remove Everything Including Volumes
```bash
docker-compose down -v
```
- ⚠️ Deletes database data! Use with caution

### Restart Services
```bash
docker-compose restart
```

### Rebuild After Dockerfile Changes
```bash
docker-compose up --build
```

---

## 📝 Important Notes

### Environment Variables
Your `.env` file is still used for local development. In `docker-compose.yml`, we set values directly in the `environment` section. In production, you'd use:
```bash
docker run --env-file .env ...
```

### Port Conflicts
If ports are already in use:
```yaml
ports:
  - "5433:5432"  # Host port 5433 → Container 5432
```

### Database Initialization
The first time you run:
1. PostgreSQL container starts
2. Healthcheck waits for it to be ready
3. Backend starts and runs Prisma migrations automatically (you might need to trigger this)

To run migrations in container:
```bash
docker-compose exec backend npx prisma migrate dev --name "migration_name"
```

### Persisting Data
Your database and Redis data persist in Docker volumes. They survive:
- Container restart
- Container rebuild
- Running `docker-compose up` again

Only `docker-compose down -v` deletes them.

---

## ✅ Testing It Works

1. Start containers: `docker-compose up`
2. Wait for all services to start (watch the logs)
3. Test backend: `curl http://localhost:12000/api` (or open in browser)
4. Test database: `psql -h localhost -U jorda -d pixelit` (if psql installed)
5. Test Redis: `redis-cli ping` (should return PONG)

---

## 🔧 Common Issues

**Problem:** `Connection refused: postgres:5432`
**Solution:** Ensure `DATABASE_URL` uses `postgres` hostname, not `localhost`

**Problem:** Port already in use (5432)
**Solution:** Change port mapping in docker-compose.yml or stop conflicting service

**Problem:** Migrations not running automatically
**Solution:** Run manually: `docker-compose exec backend npx prisma migrate deploy`

**Problem:** Code changes not reflecting
**Solution:** Ensure volume is mounted: `volumes: - .:/app`

---

## 📚 Next Steps

1. **Run:** `docker-compose up`
2. **Verify all containers are healthy:** `docker-compose ps`
3. **Test API:** Check logs and try hitting an endpoint
4. **Update your .env.example** to document the Docker setup
5. **Push to repo:** Add Dockerfile and docker-compose.yml to git
