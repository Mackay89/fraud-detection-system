"""
IoT Device Simulator — Kafka Producer
Simulates multiple sensors sending temperature, humidity,
pressure, and battery readings every 2 seconds.
"""

from kafka import KafkaProducer
from kafka.errors import KafkaError
import json
import time
import random
import logging
import os
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

KAFKA_BROKERS = os.getenv("KAFKA_BROKERS", "localhost:9092")
TOPIC = "iot-data"
PUBLISH_INTERVAL = 2  # seconds

DEVICES = [
    {"id": "sensor-001", "location": "Warehouse A", "type": "industrial"},
    {"id": "sensor-002", "location": "Warehouse B", "type": "industrial"},
    {"id": "sensor-003", "location": "Office Floor 1", "type": "office"},
    {"id": "sensor-004", "location": "Server Room", "type": "critical"},
    {"id": "sensor-005", "location": "Rooftop", "type": "outdoor"},
]

# Baseline values per device type
BASELINES = {
    "industrial": {"temp": 45, "humidity": 60, "pressure": 1010},
    "office":     {"temp": 22, "humidity": 45, "pressure": 1013},
    "critical":   {"temp": 18, "humidity": 35, "pressure": 1013},
    "outdoor":    {"temp": 28, "humidity": 70, "pressure": 1008},
}


def make_reading(device: dict) -> dict:
    base = BASELINES[device["type"]]
    temperature = round(base["temp"] + random.gauss(0, 5), 2)
    humidity    = round(base["humidity"] + random.gauss(0, 8), 2)
    pressure    = round(base["pressure"] + random.gauss(0, 3), 2)
    battery     = round(random.uniform(20, 100), 1)

    # Clamp to realistic ranges
    temperature = max(-20, min(120, temperature))
    humidity    = max(0,   min(100, humidity))
    pressure    = max(950, min(1060, pressure))

    return {
        "device_id":  device["id"],
        "location":   device["location"],
        "type":       device["type"],
        "temperature": temperature,
        "humidity":    humidity,
        "pressure":    pressure,
        "battery_pct": battery,
        "timestamp":   int(time.time()),
        "iso_time":    time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


def on_send_success(record_metadata):
    logger.debug(
        "Sent to %s [partition %d] offset %d",
        record_metadata.topic,
        record_metadata.partition,
        record_metadata.offset,
    )


def on_send_error(exc):
    logger.error("Kafka send error: %s", exc)


def main():
    logger.info("Connecting to Kafka at %s …", KAFKA_BROKERS)
    producer = KafkaProducer(
        bootstrap_servers=KAFKA_BROKERS,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        retries=5,
        acks="all",
    )
    logger.info("Producer ready. Publishing to topic '%s' every %ds.", TOPIC, PUBLISH_INTERVAL)

    try:
        while True:
            device = random.choice(DEVICES)
            reading = make_reading(device)

            producer.send(TOPIC, reading) \
                .add_callback(on_send_success) \
                .add_errback(on_send_error)

            logger.info(
                "📡 %s | %s | Temp: %.1f°C | Humidity: %.1f%% | Battery: %.0f%%",
                reading["device_id"],
                reading["location"],
                reading["temperature"],
                reading["humidity"],
                reading["battery_pct"],
            )

            time.sleep(PUBLISH_INTERVAL)

    except KeyboardInterrupt:
        logger.info("Shutting down producer…")
    finally:
        producer.flush()
        producer.close()
        logger.info("Producer closed.")


if __name__ == "__main__":
    main()
