"""
PySpark Structured Streaming — IoT Analytics Consumer
Reads from Kafka, parses JSON, applies transformations,
detects anomalies, and writes results to storage.
"""

import os
from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, from_json, to_timestamp, window,
    avg, max as spark_max, min as spark_min, count,
    when, current_timestamp, expr
)
from pyspark.sql.types import (
    StructType, StructField,
    StringType, FloatType, LongType, DoubleType
)

KAFKA_BROKERS  = os.getenv("KAFKA_BROKERS", "localhost:9092")
KAFKA_TOPIC    = "iot-data"
CHECKPOINT_DIR = "/tmp/iot-checkpoints"
OUTPUT_PATH    = "/tmp/iot-output"

# ── Schema ─────────────────────────────────────────────────────────────────────

IOT_SCHEMA = StructType([
    StructField("device_id",   StringType(), True),
    StructField("location",    StringType(), True),
    StructField("type",        StringType(), True),
    StructField("temperature", FloatType(),  True),
    StructField("humidity",    FloatType(),  True),
    StructField("pressure",    FloatType(),  True),
    StructField("battery_pct", FloatType(),  True),
    StructField("timestamp",   LongType(),   True),
    StructField("iso_time",    StringType(), True),
])

# ── Alert thresholds ────────────────────────────────────────────────────────────

TEMP_HIGH   = 70.0
TEMP_LOW    = 0.0
HUMID_HIGH  = 85.0
BATT_LOW    = 25.0


def build_spark() -> SparkSession:
    return (
        SparkSession.builder
        .appName("IoT-Analytics-Pipeline")
        .config("spark.sql.streaming.checkpointLocation", CHECKPOINT_DIR)
        .config("spark.jars.packages",
                "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0")
        .getOrCreate()
    )


def read_kafka(spark: SparkSession):
    return (
        spark.readStream
        .format("kafka")
        .option("kafka.bootstrap.servers", KAFKA_BROKERS)
        .option("subscribe", KAFKA_TOPIC)
        .option("startingOffsets", "latest")
        .option("failOnDataLoss", "false")
        .load()
    )


def parse_messages(raw_df):
    json_df = raw_df.selectExpr("CAST(value AS STRING) AS json_str", "timestamp AS kafka_ts")
    return (
        json_df
        .select(from_json(col("json_str"), IOT_SCHEMA).alias("d"), "kafka_ts")
        .select("d.*", "kafka_ts")
        .withColumn("event_time", to_timestamp(col("iso_time")))
    )


def add_alerts(df):
    """Tag each reading with alert severity."""
    return df.withColumn(
        "alert",
        when(col("temperature") > TEMP_HIGH, "CRITICAL_TEMP_HIGH")
        .when(col("temperature") < TEMP_LOW,  "CRITICAL_TEMP_LOW")
        .when(col("humidity")    > HUMID_HIGH, "WARNING_HUMIDITY")
        .when(col("battery_pct") < BATT_LOW,   "WARNING_BATTERY")
        .otherwise("OK")
    ).withColumn(
        "alert_score",
        when(col("alert").startswith("CRITICAL"), 2)
        .when(col("alert").startswith("WARNING"),  1)
        .otherwise(0)
    )


def windowed_aggregations(df):
    """5-minute tumbling window stats per device."""
    return (
        df
        .withWatermark("event_time", "10 minutes")
        .groupBy(window(col("event_time"), "5 minutes"), col("device_id"), col("location"))
        .agg(
            avg("temperature").alias("avg_temp"),
            spark_max("temperature").alias("max_temp"),
            spark_min("temperature").alias("min_temp"),
            avg("humidity").alias("avg_humidity"),
            avg("pressure").alias("avg_pressure"),
            avg("battery_pct").alias("avg_battery"),
            count("*").alias("reading_count"),
        )
    )


def write_raw_to_console(df):
    return (
        df
        .filter(col("alert") != "OK")          # only print anomalies to console
        .writeStream
        .outputMode("append")
        .format("console")
        .option("truncate", False)
        .trigger(processingTime="5 seconds")
        .start()
    )


def write_all_to_parquet(df):
    return (
        df.writeStream
        .outputMode("append")
        .format("parquet")
        .option("path", f"{OUTPUT_PATH}/raw")
        .option("checkpointLocation", f"{CHECKPOINT_DIR}/raw")
        .trigger(processingTime="10 seconds")
        .start()
    )


def write_agg_to_parquet(agg_df):
    return (
        agg_df.writeStream
        .outputMode("complete")
        .format("parquet")
        .option("path", f"{OUTPUT_PATH}/aggregated")
        .option("checkpointLocation", f"{CHECKPOINT_DIR}/aggregated")
        .trigger(processingTime="30 seconds")
        .start()
    )


def main():
    spark = build_spark()
    spark.sparkContext.setLogLevel("WARN")

    print("🚀 IoT Spark Streaming job started.")
    print(f"   Kafka:      {KAFKA_BROKERS} / {KAFKA_TOPIC}")
    print(f"   Output:     {OUTPUT_PATH}")
    print(f"   Checkpoint: {CHECKPOINT_DIR}")

    raw_df    = read_kafka(spark)
    parsed_df = parse_messages(raw_df)
    alert_df  = add_alerts(parsed_df)
    agg_df    = windowed_aggregations(parsed_df)

    # Multiple simultaneous sinks
    q1 = write_raw_to_console(alert_df)
    q2 = write_all_to_parquet(alert_df)
    q3 = write_agg_to_parquet(agg_df)

    print("✅ All streaming queries running. Ctrl+C to stop.")
    spark.streams.awaitAnyTermination()


if __name__ == "__main__":
    main()
