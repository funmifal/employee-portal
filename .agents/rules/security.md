---
trigger: always_on
---

# Security Rules

## Purpose

Protect confidential employee notes, company knowledge, AI inputs/outputs, and published manuals.

## Mandatory Rules

- Enforce authentication before protected portal access.
- Enforce RBAC on the server.
- Never rely on hidden UI controls as authorization.
- VIEWER must remain read-only.
- EDITOR may upload and compile according to the PRD.
- ADMIN controls publishing and user-role management.
- Users must not gain access to another user's restricted data merely by changing an ID in a request.
- Validate ownership and authorization before every protected mutation or retrieval.

## Uploaded Files

Treat uploaded images as untrusted.

Validate:

- file type
- file size
- batch size
- processing state
- storage/access permissions

Do not trust client-provided filenames, MIME types, URLs, or metadata without validation.

## AI Data Protection

- Do not send company content to an AI provider unless that provider is explicitly configured for the environment.
- AI provider credentials must remain server-side.
- Do not expose provider API keys to browsers.
- Prefer enterprise AI endpoints with appropriate zero-data-retention guarantees or self-hosted models as specified by the PRD.
- Do not log raw employee images, confidential OCR text, or full manual content unnecessarily.
- Do not use production company content as debugging examples in source code.

## Sessions

- Use secure session management through NextAuth or an equivalent secure middleware.
- Protect authenticated routes and server actions.
- Session state must not be treated as proof of permissions without checking the user's effective role.

## AI Output

AI output is untrusted.

Never allow AI output to bypass:

- validation
- authorization
- review requirements
- database constraints

## Transport and Storage

Company content must be protected in transit and at rest according to enterprise deployment requirements.

Do not introduce third-party analytics or external content services that receive confidential manual data without an explicit requirement and security review.

## Incident-Sensitive Behavior

If a security-sensitive ambiguity is discovered, do not guess.

Stop and resolve the requirement before implementing a potentially unsafe behavior.