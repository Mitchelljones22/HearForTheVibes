# HearForTheVibes

## Team development setup

Use Docker Compose to run the frontend, backend, and databases together. Docker provides Node.js, Java, PostgreSQL, and the build tools, so you do not need to install them separately to run the project.

| Component | Stack |
| --- | --- |
| Frontend | React, TypeScript, Vite, Node.js 24 |
| Backend | Java 25, Spring Boot 4.1.1, Maven Wrapper |
| Database | PostgreSQL 17, stored in a persistent Docker volume |

This configuration is for local development. The registration form creates accounts through the Spring Boot API. See [Registration](docs/Registration.md) for the request format, validation rules, and code walkthrough.

## 1. Install the prerequisites

- [Git](https://git-scm.com/downloads).
- [Docker Desktop](https://docs.docker.com/get-started/get-docker/), which includes Docker Compose. On Windows, follow the [Windows installation instructions](https://docs.docker.com/desktop/setup/install/windows-install/), enable the required WSL 2 support, and use Linux containers. On Linux, Docker Engine with the Compose plugin is also an option.
- An editor such as VS Code.

Start Docker Desktop and wait for its engine to be ready. Open a terminal and check:

```sh
git --version
docker version
docker compose version
```

`docker version` should show both Client and Server information. If it cannot connect to the server, make sure Docker Desktop is running.

## 2. Clone the repository

```sh
git clone https://github.com/Mitchelljones22/HearForTheVibes.git
cd HearForTheVibes
```

If you already cloned the repository, use that existing folder. Open it in your editor. Run all Docker Compose commands below from this root folder, which contains `compose.yaml`, `frontend`, and `backend`.

## 3. Start the project

Stop any frontend or backend servers you previously started outside Docker, then run:

```sh
docker compose up
```

The first start downloads container images, Node dependencies, Maven, and Java dependencies. It can take several minutes and requires internet access. The backend waits for the development and test PostgreSQL services to be healthy. Wait for Vite's ready message and Spring Boot's `Started BackendApplication` message.

| Application | Local address |
| --- | --- |
| Frontend | [http://localhost:5173](http://localhost:5173) |
| Backend | [http://localhost:8080](http://localhost:8080) |

The frontend displays the registration form. A 404 at the backend's root address is expected; the registration endpoint is `POST /api/auth/register`. Check the backend startup logs to confirm it is running.

Keep this terminal open to see logs. Alternatively, start in the background with `docker compose up -d`.

## Daily development

Edit files normally in your local `frontend` and `backend` folders. The containers read those same files.

| Task | Action or command |
| --- | --- |
| Edit frontend components/styles | Save the file; Vite reloads automatically. |
| Apply Java or backend configuration changes | `docker compose restart backend` recompiles and restarts Spring Boot. |
| Apply frontend dependency changes | `docker compose restart frontend` reruns `npm ci` using the lockfile. |
| Apply changes to `compose.yaml` | `docker compose up -d` recreates affected services as needed. |
| Check service status | `docker compose ps` |
| Follow logs | `docker compose logs -f` |
| View backend logs | `docker compose logs backend` |
| Stop and remove containers | `docker compose down` |

With an attached `docker compose up` session, Ctrl+C stops the services. Run `docker compose up` again to restart them.

After saving or committing your work, a straightforward way to pick up teammates' changes is:

```sh
docker compose down
git pull
docker compose up
```

Commit frontend dependency changes together with `frontend/package-lock.json`. The container uses `npm ci`, which requires the lockfile to agree with `package.json`. Backend dependencies are declared in `backend/pom.xml`.

## Run checks inside Docker

With the services running, use a second terminal in the project root:

```sh
docker compose exec frontend npm run lint
docker compose exec frontend npm run build
docker compose exec backend sh ./mvnw test
```

These use the container tools; no local Node or Java installation is required. Backend tests cover application startup, registration, and sessions. The `test` profile uses the separate `database-test` PostgreSQL service with its own credentials and recreates its schema for each integration test class. The test service stores data in memory and discards it when the container stops.

Run one backend test process at a time. Host and container test runs share the test database, so concurrent runs can reset each other's schema.

## Run the backend from your host

Install Java 25. If the backend container is running, stop it with `docker compose stop backend` to free port 8080. Then start the databases from the repository root:

```sh
docker compose up -d database database-test
cd backend
sh ./mvnw spring-boot:run
```

To run backend tests from another terminal, use these commands from the repository root:

```sh
cd backend
sh ./mvnw test
```

The host defaults connect to the development database at `localhost:5432` and the test database at `localhost:5433`. To use another PostgreSQL server, set `DATABASE_URL`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD` for development. Set `TEST_DATABASE_URL`, `TEST_DATABASE_USERNAME`, and `TEST_DATABASE_PASSWORD` for tests. URLs use the JDBC format `jdbc:postgresql://host:port/database`.

The test profile uses `create-drop`, which deletes and recreates tables. Point `TEST_DATABASE_*` only at a disposable test database. Use these custom environment variables instead of `SPRING_DATASOURCE_*`, which override the test profile and can send tests to the development database.

## Frontend-to-backend requests

Use relative paths beginning with `/api` in frontend requests. Vite forwards these requests to `http://backend:8080` inside Docker and preserves the path. For example, a frontend request to `/api/example` needs a corresponding backend route at `/api/example`.

The hostname `backend` is internal to Docker. Use the localhost addresses above when accessing applications directly from your browser. Outside Docker, the Vite configuration falls back to `http://localhost:8080`.

## Database and local files

The `database` Compose service runs development PostgreSQL. Its `postgres_data` named volume stores data at `/var/lib/postgresql/data`. Hibernate updates the development schema when the backend starts.

These credentials are for local development only:

| Service | Host address | Database | Username | Password |
| --- | --- | --- | --- | --- |
| `database` | `localhost:5432` | `hearforthevibes` | `hearforthevibes` | `hearforthevibes` |
| `database-test` | `localhost:5433` | `hearforthevibes_test` | `hearforthevibes_test` | `hearforthevibes_test` |

Both ports bind only to the host's loopback interface. Inside Docker, the backend uses the service names `database` and `database-test` on port 5432. Compose supplies separate `DATABASE_*` and `TEST_DATABASE_*` settings.

- Each teammate has their own local PostgreSQL volume.
- Container restarts and `docker compose down` preserve the database.
- **Do not add `-v` to `docker compose down` unless you intend to delete the database and the other named volumes.**
- Existing SQLite accounts are not imported automatically. The old `database` named volume remains declared but unmounted, so its SQLite file is retained. Keep any existing `backend/data` SQLite files until you decide whether to migrate those accounts.
- Share schema and sample-data scripts through Git as they are implemented. Working database files are not committed.

Docker also keeps frontend dependencies, Maven downloads, and backend build output in separate volumes. Your host's existing `node_modules` and `target` folders are not used by these containers.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| `docker` is not recognized | Install Docker Desktop and reopen your terminal. |
| Cannot connect to the Docker daemon | Start Docker Desktop and wait for the engine to be ready. |
| No Compose configuration found | Run the command from the folder containing `compose.yaml`. |
| Port 5173, 8080, 5432, or 5433 is already allocated | Stop the old local server or other container using that port, then retry. |
| Backend waits for PostgreSQL or cannot connect | Check `docker compose ps` and `docker compose logs database database-test`. Both databases must be healthy. |
| Frontend appears before backend is ready | Wait for Spring Boot's startup message; inspect `docker compose logs backend` if it exits. |
| `/api/...` returns 404 | Confirm that the backend implements that exact route. Registration uses `POST /api/auth/register`. |
| `npm ci` reports a lockfile mismatch | Ensure `package.json` and `package-lock.json` came from the same dependency update. |
| Java edits do not take effect | Run `docker compose restart backend`; automatic Java reload is not configured. |
| Maven script reports carriage-return or shell syntax errors | Ensure `backend/mvnw` uses LF line endings. The backend's `.gitattributes` specifies this for Git checkouts. |

For optional editor support, VS Code's Java tooling may require a local JDK even though Docker can build and run the backend without one.
