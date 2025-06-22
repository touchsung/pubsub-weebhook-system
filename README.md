## Pub/Sub Webhook System

### Quick Start

1. **Setup Environment**
   ```bash
   npm run setup
   cp .env.example .env
   npm install
   ```

2. **Run Migrations**
   ```bash
   npm run db:migrate
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Start Webhook Receiver** (for testing)
   ```bash
   npm run dev:receiver
   ```

### API Endpoints

#### Subscribe to Webhooks
```bash
curl -X POST http://localhost:3000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"url": "http://localhost:8000/receive"}'
```

#### Unsubscribe
```bash
curl -X POST http://localhost:3000/api/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{"sub_id": 1}'
```

#### Provide Data
```bash
curl -X POST http://localhost:3000/api/provide_data \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello World"}'
```

#### Request Data and Publish
```bash
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"tx_id": 1}'
```
