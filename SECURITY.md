# AstroAI Agent - Security & Threat Model Documentation

## 1. Threat Model & Defensive Posture

AstroAI Agent implements defense-in-depth across the API, AI Agent, and document ingestion layers to protect users, prevent privilege escalation, and safeguard private data.

```
       [Untrusted Internet / Client Input]
                       │
                       ▼
         [FastAPI Security Middleware]
         (CORS, X-Content-Type-Options,
          X-Frame-Options, X-XSS-Protection)
                       │
                       ▼
      [Input Validation & Sanitization]
   (Pydantic v2 Models + Regex Sanitizer)
        ┌──────────────┴──────────────┐
        ▼                             ▼
[URL Import Gateway]          [Document File Ingestion]
  - SSRF Validation             - Extension Allowlist
  - IP Subnet Blacklist         - Path Traversal Sanitizer
  - Bounded Retries             - 25MB Size Ceiling
        │                             │
        └──────────────┬──────────────┘
                       ▼
         [Agent Orchestrator Boundary]
           - Registered Tools Allowlist
           - Max 5 calls per run limit
           - 15s Timeout ceiling
           - Prompt Injection Neutralization
                       │
                       ▼
             [Encrypted Data & Logs]
           - Automatic Secret Redaction
           - Safe Passlib / Bcrypt Hashes
```

---

## 2. Key Security Defenses

### 2.1 SSRF (Server-Side Request Forgery) Defense (`validate_outbound_url_ssrf`)
- URL scheme restricted strictly to `http` and `https`.
- Resolves hostnames and blocks:
  - Loopback (`127.0.0.1`, `localhost`, `::1`).
  - Private RFC1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
  - Cloud provider metadata IP (`169.254.169.254`, `metadata.google.internal`).
  - Link-local and multicast addresses.

### 2.2 Path Traversal Defense (`secure_filename`)
- Strips all directory separators (`/`, `\`).
- Replaces path traversal sequences (`..`, `\x00`).
- Restricts filenames strictly to alphanumeric characters, dashes, and periods.
- Restricts document upload file extensions to an explicit allowlist: `.pdf`, `.txt`, `.md`, `.docx`.
- Enforces an upload file size ceiling of 25 MB.

### 2.3 Prompt Injection Defense & Context Neutralization
- User queries and document chunks are scanned for common jailbreak signatures (`ignore previous instructions`, `DAN mode`, `override system prompt`).
- Retrieved document text is treated strictly as passive context data, wrapping backticks and formatting to prevent LLM instruction hijacking.

### 2.4 Agent Tool Sandbox & Execution Limits
- Registered tools allowlist: LLMs cannot call arbitrary Python functions, execute shell commands, or access system files.
- Hard limits: Maximum of 5 tool calls per invocation and 15-second total timeout limit.
- Destructive actions (`delete_document`, `delete_history`) require explicit human confirmation and cannot be triggered autonomously by the agent.

### 2.5 Secret Management & Redaction
- Zero credentials committed to version control.
- Application logging uses a custom `RedactingFormatter` that automatically masks Google API keys (`AIzaSy...`), bearer tokens, and passwords matching sensitive regex patterns before outputting to stdout or logfiles.
- Password hashing uses industry-standard `bcrypt` via Passlib.
- JWT tokens signed with `HS256` using configurable secret keys and expiration timeouts.

---

## 3. Privacy & Compliance Notice

Birth data, geographic coordinates, and consultation questions are treated as private client data:
- In Demo Mode, calculations and retrieval are performed entirely within the local process with zero outbound transmission.
- In Live Mode, requests sent to Google GenAI contain only astronomical positions and consultation questions necessary for synthesis. No personal identity records are shared.
