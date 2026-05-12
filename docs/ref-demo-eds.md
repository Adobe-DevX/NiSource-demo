# Reference Demo (EDS) and this project

Adobe’s **Reference Demo for EDS** is a lab/demo framework (Universal Editor, Dynamic Media, content fragments, experimentation, etc.). It is **not** positioned as a production reference; see the disclaimer on the official getting-started page: [Ref Demo for EDS — Get Started](https://referencedemo.adobe.com/get-started).

## Official entry points

- **Get started (3-minute setup, package download, Slack, support):** [referencedemo.adobe.com/get-started](https://referencedemo.adobe.com/get-started)
- **Broader Ref Demo 2.0 docs (linked from that page):** use the “Ref Demo 2.0” / Quick HowTo links from Get Started when Adobe updates them.

## How this repo uses Ref Demo ideas

NiSource-demo is based on **AEM Boilerplate Commerce**, not the Ref Demo boilerplate. Patterns ported from Ref Demo (or a local clone such as `RefDemoEDS`) include:

| Area | Where in NiSource-demo |
|------|-------------------------|
| Content Fragment (GraphQL + banner layout) | `blocks/content-fragment/`, config via `scripts/eds-support.js` placeholders / metadata |
| Dynamic Media Open API image pipeline | `scripts/dynamic-media.js` (`decorateDMImages`), blocks `dynamic-media-image`, `dynamicmedia-image` |
| Dynamic Media video (VideoViewer) | `blocks/dynamic-media-video/` |
| Dynamic Media template (inline + CF) | `blocks/dynamicmedia-template/` |
| Experimentation plugin | `plugins/experimentation/`, `scripts/experiment-load.js`, wired in `scripts/scripts.js` |

**Placeholder and meta keys** used by those flows are documented in the comment block at the top of `scripts/eds-support.js`.

## Disclaimer

Treat [Get Started](https://referencedemo.adobe.com/get-started) and the Ref Demo package as **demo/lab** guidance. Production NiSource requirements (security, AEM configuration, Commerce, CSP, analytics) stay governed by your own standards and `design.md`.
