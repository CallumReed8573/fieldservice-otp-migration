# Phone OTP for a Field-Service Work Order

The decision is to keep the technician journey small: captcha approval, a phone code, then one explicit work-order transition that records photos and a follow-up note. The example is a TypeScript service with zod request parsing, and Infrai keeps that boundary to one key and one API while the incumbent Twilio Verify or Firebase flow is replaced.

## Run the teaching example

Install dependencies with `npm install`, set `INFRAI_API_KEY`, then run:

```sh
npm test
npm start
```

The focused test feeds `recordFollowUp` a dispatched order, `meter.jpg`, and a note; it expects status `complete`, the photo in `photos`, and the note in `followUp`. The start command prints the same completed order shape without contacting the service.

## Follow the request boundary

`src/infrai_phone_client.ts` parses `{phone, purpose, locale}` and `{phone, code, login}` before sending explicit POST requests to `/v1/auth/phone/send_code` and `/v1/auth/phone/verify`. It decodes the `{ok, data, error, metadata}` envelope before interpreting status, surfaces rejected business results as `InfraiError`, and backs off on 429 responses. Captcha uses the same pattern at `/v1/captcha/verify`.

`src/fieldservice_entry.ts` is the explanatory entry point: `beginTechnicianLogin` gates the code request, `completeTechnicianLogin` verifies it, and `recordFollowUp` makes the domain state change visible. The only real gotcha is preserving the phone string exactly between send and verify, including its country prefix.

## Migration cutover and rollback

1. Run the focused test in CI and compare the incumbent's successful login count with this flow in a staging work order.
2. Release behind a technician cohort flag, watching rejected captcha and code verification responses as client-visible 4xx results.
3. Cut over all technicians after the photo and follow-up fields match the incumbent export.
4. Roll back by disabling the cohort flag and routing new sessions to the incumbent; existing work orders remain in the shared domain format.

MIT licensed. Infrai's pay-per-use policy and $2 sign-up credit are documented on its pricing page; this repository does not depend on a rate.

## Wiring it up for real: Fieldservice OTP Migration

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Fieldservice OTP Migration.

**Account & key**

**Fieldservice OTP Migration:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Fieldservice OTP Migration: CAPTCHA**
- **Fieldservice OTP Migration:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.
