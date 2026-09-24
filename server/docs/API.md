# CivicLeder API

Base URL: `/api/v1`

Success shape:

```json
{ "success": true, "data": {} }
```

Error shape:

```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "Invalid request" }
}
```

## Health

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/health` | `{ "status": "ok" }` (root) |
| GET | `/api/v1/health` | Wrapped success payload |

## Catalog / emergency

| Method | Path | Params |
| --- | --- | --- |
| GET | `/emergency/contacts` | `?region=delhi` |
| GET | `/categories` | — |
| GET | `/categories/:slug/issue-types` | — |
| GET | `/categories/:slug/assessment` | Assessment questions |
| GET | `/routing` | `?categorySlug=&issueTypeSlug=` |
| GET | `/authorities/:slug/services` | Authority services + fields |
| GET | `/search` | `?q=` |

## Cases / reports

| Method | Path | Body / notes |
| --- | --- | --- |
| POST | `/cases/next-id` | Returns `{ caseId: "MD-000001" }` |
| POST | `/reports` | Upsert by `caseId` |
| GET | `/reports` | `?caseIds=MD-1,MD-2` |
| POST | `/reports/locations` | Location row |
| POST | `/reports/complaints` | Official complaint (user-entered) |
| POST | `/reports/updates` | Case update |

## Community tips

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/community-tips` | Public statuses only; optional `categorySlug` |
| POST | `/community-tips` | Same rules as former `submit_community_tip` RPC |
| POST | `/community-tips/:id/vote` | `{ deviceHash, vote }` — no self-vote; one vote/device |

## Evidence

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/evidence` | `multipart/form-data`: `file`, `draftKey`, `evidenceId`, `mediaType` |

Path convention: `{draftKey}/{evidenceId}.{ext}` under private uploads.
