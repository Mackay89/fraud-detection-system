"""
Airflow DAG — IoT Analytics Pipeline Orchestration
Runs hourly: health-checks Kafka, submits Spark job, archives output.
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator, BranchPythonOperator
from airflow.utils.trigger_rule import TriggerRule
import logging

logger = logging.getLogger(__name__)

# ── Default args ───────────────────────────────────────────────────────────────

default_args = {
    "owner":            "iot-team",
    "depends_on_past":  False,
    "email_on_failure": True,
    "email_on_retry":   False,
    "retries":          2,
    "retry_delay":      timedelta(minutes=5),
}

# ── Helper tasks ───────────────────────────────────────────────────────────────

def check_kafka_health(**ctx):
    """Verify Kafka broker is reachable before submitting Spark."""
    import socket
    broker_host, broker_port = "kafka", 9092
    try:
        s = socket.create_connection((broker_host, broker_port), timeout=5)
        s.close()
        logger.info("Kafka broker is healthy ✅")
        return "run_spark_job"
    except OSError as e:
        logger.error("Kafka broker unreachable: %s", e)
        return "send_slack_alert"


def send_slack_alert(**ctx):
    """Placeholder: post a failure notification to Slack / PagerDuty."""
    logger.warning("🚨 Kafka health check failed — pipeline skipped for this cycle.")
    # In production: call Slack webhook or PagerDuty API here


def archive_output(**ctx):
    import subprocess, datetime as dt
    ts = dt.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    cmd = f"aws s3 sync /tmp/iot-output/ s3://your-bucket/iot-archive/{ts}/ --quiet"
    logger.info("Archiving output: %s", cmd)
    # subprocess.check_call(cmd, shell=True)   # uncomment in production


# ── DAG definition ─────────────────────────────────────────────────────────────

with DAG(
    dag_id="iot_analytics_pipeline",
    default_args=default_args,
    description="Hourly IoT data pipeline: Kafka → Spark → Archive",
    schedule_interval="@hourly",
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=["iot", "streaming", "spark"],
) as dag:

    # 1. Health-check Kafka, branch on result
    kafka_health = BranchPythonOperator(
        task_id="check_kafka_health",
        python_callable=check_kafka_health,
    )

    # 2a. Branch: Kafka is up → submit Spark batch
    run_spark_job = BashOperator(
        task_id="run_spark_job",
        bash_command=(
            "spark-submit "
            "--master yarn "
            "--deploy-mode cluster "
            "--conf spark.executor.memory=4g "
            "--conf spark.executor.cores=2 "
            "--conf spark.executor.instances=3 "
            "/app/consumer/spark_job.py"
        ),
        execution_timeout=timedelta(minutes=55),
    )

    # 2b. Branch: Kafka is down → alert
    slack_alert = PythonOperator(
        task_id="send_slack_alert",
        python_callable=send_slack_alert,
    )

    # 3. Archive Spark output to S3 (only if Spark ran)
    archive = PythonOperator(
        task_id="archive_to_s3",
        python_callable=archive_output,
    )

    # 4. Cleanup local temp files
    cleanup = BashOperator(
        task_id="cleanup_local_output",
        bash_command="rm -rf /tmp/iot-output/raw /tmp/iot-output/aggregated || true",
        trigger_rule=TriggerRule.ONE_SUCCESS,
    )

    # ── Dependencies ───────────────────────────────────────────────────────────

    kafka_health >> [run_spark_job, slack_alert]
    run_spark_job >> archive >> cleanup
    slack_alert >> cleanup
