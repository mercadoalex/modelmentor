# ModelMentor OpenAPI Spec

## Setup MCP Server for AI Tools

### Prerequisites
```bash
git clone https://github.com/igor-olikh/openspec-mcp-server.git ~/openspec-mcp-server
cd ~/openspec-mcp-server && npm install && npm run build
```

### Tools Configuration
| Tool | Config File |
|---|---|
| GitHub Copilot | `.vscode/mcp.json` |
| Kiro | `.kiro/settings/mcp.json` |
| IBM Bob / MeDo | `~/.config/mcp/config.json` |

### Spec Location
`/openapi/openapi.yml`

### Test MCP Server
```bash
node ~/openspec-mcp-server/dist/index.js /path/to/openapi/openapi.yml
```