# HearForTheVibes

## Team development setup

Use Docker Compose to run the frontend and backend together. Docker provides Node.js, Java, and the build tools, so you do not need to install them separately to run the project.

| Component | Stack |
| --- | --- |
| Frontend | React, TypeScript, Vite, Node.js 24 |
| Backend | Java 25, Spring Boot 4.1.1, Maven Wrapper |
| Database | SQLite, stored in a persistent Docker volume |

This configuration is for local development. The project currently contains the starter applications; API endpoints and database tables will be added as features are implemented.

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

The first start downloads container images, Node dependencies, Maven, and Java dependencies. It can take several minutes and requires internet access. Both services start independently, so wait for Vite's ready message and Spring Boot's `Started BackendApplication` message.

| Application | Local address |
| --- | --- |
| Frontend | [http://localhost:5173](http://localhost:5173) |
| Backend | [http://localhost:8080](http://localhost:8080) |

The frontend should display the starter page. A 404 at the backend's root address is expected until a route is implemented; check the backend startup logs to confirm it is running.

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

With both services running, use a second terminal in the project root:

```sh
docker compose exec frontend npm run lint
docker compose exec frontend npm run build
docker compose exec backend sh ./mvnw test
```

These use the container tools; no local Node or Java installation is required. The current backend test checks application startup. Feature and database behavior need their own tests as development progresses.

## Frontend-to-backend requests

Use relative paths beginning with `/api` in frontend requests. Vite forwards these requests to `http://backend:8080` inside Docker and preserves the path. For example, a frontend request to `/api/example` needs a corresponding backend route at `/api/example`.

The hostname `backend` is internal to Docker. Use the localhost addresses above when accessing applications directly from your browser. Outside Docker, the Vite configuration falls back to `http://localhost:8080`.

## Database and local files

SQLite runs inside the backend process; there is no separate database service to install. Docker creates a named volume mounted at `/app/data`, and the application uses `/app/data/hearforthevibes.db`. The database file is created when the application first opens a connection to it.

- Each teammate has their own local database volume.
- Container restarts and `docker compose down` preserve the database.
- **Do not add `-v` to `docker compose down` unless you intend to delete the database and the other named volumes.**
- The Docker database is separate from any existing file in your local `backend/data` folder. Docker does not import that file automatically.
- Share schema and sample-data scripts through Git as they are implemented. Working database files are not committed.

Docker also keeps frontend dependencies, Maven downloads, and backend build output in separate volumes. Your host's existing `node_modules` and `target` folders are not used by these containers.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| `docker` is not recognized | Install Docker Desktop and reopen your terminal. |
| Cannot connect to the Docker daemon | Start Docker Desktop and wait for the engine to be ready. |
| No Compose configuration found | Run the command from the folder containing `compose.yaml`. |
| Port 5173 or 8080 is already allocated | Stop the old local server or other container using that port, then retry. |
| Frontend appears before backend is ready | Wait for Spring Boot's startup message; inspect `docker compose logs backend` if it exits. |
| `/api/...` returns 404 | Confirm that the backend implements that exact route. The starter project has no API endpoints yet. |
| `npm ci` reports a lockfile mismatch | Ensure `package.json` and `package-lock.json` came from the same dependency update. |
| Java edits do not take effect | Run `docker compose restart backend`; automatic Java reload is not configured. |
| Maven script reports carriage-return or shell syntax errors | Ensure `backend/mvnw` uses LF line endings. The backend's `.gitattributes` specifies this for Git checkouts. |

For optional editor support, VS Code's Java tooling may require a local JDK even though Docker can build and run the backend without one.
