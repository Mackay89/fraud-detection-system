# 🌐 IoT Analytics Pipeline

A production-grade real-time IoT data pipeline and analytics dashboard.

## Architecture

```
IoT Devices → Kafka → PySpark → Data Storage → API → Dashboard
                    ↓
                 Airflow (orchestration)
                    ↓
                 AWS / Docker
```

## Stack

| Layer | Technology |
|-------|-----------|
| Messaging | Apache Kafka |
| Stream Processing | PySpark Structured Streaming |
| Orchestration | Apache Airflow |
| Backend API | Node.js + Express |
| Frontend | React + Recharts |
| Containerization | Docker Compose |
| Cloud (optional) | AWS MSK, EMR, ECS, S3 |

## Quick Start

### 1. Start Infrastructure
```bash
cd docker
docker-compose up -d
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the IoT Producer (Simulator)
```bash
cd producer
python producer.py
```

### 4. Run the Spark Streaming Consumer
```bash
cd consumer
spark-submit spark_job.py
```

### 5. Start the Backend API
```bash
cd api
npm install
node server.js
```

### 6. Start the Dashboard
```bash
cd dashboard
npm install
npm run dev
```

## Project Structure

```
iot-analytics-pipeline/
├── producer/           # Kafka IoT device simulator
├── consumer/           # PySpark streaming processor
├── api/                # Node.js REST API + WebSocket
├── dashboard/          # React analytics dashboard
├── airflow/            # DAG orchestration
├── docker/             # Docker Compose setup
└── README.md
```

## Features

- **Real-time streaming** via Kafka + PySpark
- **Temperature & humidity alerts** when thresholds exceeded
- **JWT authentication** on API endpoints
- **WebSocket** support for live dashboard updates
- **Airflow DAG** for pipeline orchestration
- **Docker Compose** for one-command infrastructure spin-up
- **AWS deployment** ready (MSK, EMR, ECS, S3)

## AWS Deployment

| Component | AWS Service |
|-----------|------------|
| Kafka | Amazon MSK |
| Spark | AWS EMR |
| API | EC2 / ECS |
| Frontend | S3 + CloudFront |
| Storage | DynamoDB / S3 |

## Environment Variables

Create a `.env` file in `/api`:

```env
PORT=5000
JWT_SECRET=your_secret_here
KAFKA_BROKERS=localhost:9092
MONGO_URI=mongodb://localhost:27017/iot
```
