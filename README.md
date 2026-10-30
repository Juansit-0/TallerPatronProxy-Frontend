# Taller Patron Proxy - Frontend

Real-time observability dashboard for the microservice monitoring system with an audit and logging proxy.
Backend: https://github.com/Juansit-0/TallerPatronProxy

## Features

- Three service cards with total calls, success rate and average response time.
- A card turns red when its error rate goes above 15%.
- Line chart (Recharts) with the last 20 calls per service and their response time.
- Audit log table polled every 3 seconds: request ID, service, operation, duration and status.
- Filters by service, status and date range, with pagination.
- Click a log to see the input params and the full response or error trace.
- Simulate load button that fires 50 random calls through the proxy.
- Animated flow: each new request travels from the client through the LoggingProxy to its service and back.

## Run

```bash
npm install
VITE_API_URL=http://localhost:8080 npm run dev
```

`VITE_API_URL` points to the Spring Boot backend.

## Production

- Frontend (Vercel): https://taller-patron-proxy-frontend-theta.vercel.app
- Backend (Railway): https://taller-patron-proxy-production.up.railway.app/api/metrics/summary
