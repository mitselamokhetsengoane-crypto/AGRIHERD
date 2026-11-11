# Frontend deployment

The public and administrator sites are separate Render Static Sites. Build them
with `npm --prefix frontend run build:public` and
`npm --prefix frontend run build:admin`; both publish `frontend/dist`.

In the Render Dashboard, configure each site's **Redirects/Rewrites** with:

- Action: **Rewrite**
- Source: `/*`
- Destination: `/index.html`

This is required for React Router URLs such as `/privacy` and `/terms` to load
when opened directly or refreshed. The rewrite must be configured on both sites;
it cannot be verified or changed from this repository.
