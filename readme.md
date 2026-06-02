# Easy Apps

An MCP (Model Context Protocol) server that allows AI agents to create and manage self-contained React applications. Agents connect to the server and use a set of file management tools to scaffold, develop, and type-check frontend apps in a sandboxed environment.

## How It Works

Easy Apps runs as an Express + Vite server and exposes an MCP endpoint that AI agents can connect to. Once connected, an agent can create a fully functional React app by writing files, patching existing ones, reading the file tree, and verifying type correctness — all through the MCP tool interface.

Each app lives under the `apps/` directory and is self-contained. A template is provided at `apps/template/` that an agent can use as a reference or starting point.

```
apps/
  <app-id>/
    frontend/   ← React + TypeScript + SCSS
    backend/    ← Reserved for future backend logic
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `read_app_file` | Read the contents of a file in an app |
| `write_app_file` | Create or overwrite a file (auto-creates directories) |
| `patch_app_file` | Replace an exact string within a file (surgical edits) |
| `delete_app_file` | Delete a file or directory |
| `list_app_files` | Recursively list all files in an app |
| `check_app` | Run TypeScript type-checking on the app's frontend |

All tools require an `appId` that identifies which app to operate on. Paths are validated to prevent directory traversal attacks.

## App Template

The `apps/template/` directory contains a starter React app that demonstrates the conventions agents should follow:

- **`frontend/main.tsx`** — Entry point, renders `<App />`
- **`frontend/App.tsx`** — Root component
- **`frontend/index.scss`** — Global styles with dark mode defaults
- **`frontend/components/`** — Reusable components (Button, Header) using CSS Modules and TypeScript

### Included Components

**Button** — Supports `variant` (primary | secondary | danger) and `size` (sm | md | lg) props.

**Header** — Renders `h1`–`h6` based on a `level` prop.

## Connection

The server exposes two transports:

- **HTTP** (`POST /mcp`) — For agents connecting over the network. Runs on port 3000.
- **Stdio** (`src/mcp/stdio.ts`) — For local process-based agent connections.

## Getting Started

```bash
npm install
```

### Development

```bash
npm run dev
```

Starts the server with hot reload via nodemon + tsx.

### MCP Inspector

```bash
npm run mcp:inspect
```

Opens the MCP Inspector for interactively testing and debugging the tools.

### Production

```bash
npm run build
npm run start
```

## Tech Stack

- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Express 5](https://expressjs.com/)
- [Vite](https://vitejs.dev/) + [vite-express](https://github.com/szymmis/vite-express)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Sass](https://sass-lang.com/)
- [Zod](https://zod.dev/) (schema validation)

## Roadmap

- [ ] Backend support — each app will have a backend that the frontend can call
- [ ] Hooks/connectors between frontend and backend
- [ ] App lifecycle management (start, stop, build individual apps)
