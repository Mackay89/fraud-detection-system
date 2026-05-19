import numpy as np
from marshmallow import Schema, fields, validate, ValidationError


class TransactionSchema(Schema):
    amount = fields.Float(
        required=True,
        validate=validate.Range(min=0.01, max=1_000_000),
        metadata={"description": "Transaction amount in USD"}
    )
    time_of_day = fields.Float(
        required=True,
        validate=validate.Range(min=0, max=23.99),
        metadata={"description": "Hour of day (0-23.99)"}
    )
    transaction_type = fields.Integer(
        required=True,
        validate=validate.OneOf([0, 1, 2]),
        metadata={"description": "0=Online, 1=POS, 2=ATM"}
    )
    merchant_category = fields.Integer(
        required=True,
        validate=validate.Range(min=0, max=9),
        metadata={"description": "Merchant category code (0-9)"}
    )
    distance_from_home = fields.Float(
        required=True,
        validate=validate.Range(min=0, max=20000),
        metadata={"description": "Distance from home in km"}
    )
    num_transactions_today = fields.Integer(
        required=True,
        validate=validate.Range(min=0, max=100),
        metadata={"description": "Number of transactions made today"}
    )
    avg_amount_last_7d = fields.Float(
        required=True,
        validate=validate.Range(min=0, max=1_000_000),
        metadata={"description": "Average transaction amount over last 7 days"}
    )
    is_foreign = fields.Integer(
        required=True,
        validate=validate.OneOf([0, 1]),
        metadata={"description": "1 if foreign transaction, else 0"}
    )


FEATURE_ORDER = [
    "amount", "time_of_day", "transaction_type",
    "merchant_category", "distance_from_home",
    "num_transactions_today", "avg_amount_last_7d", "is_foreign"
]


def validate_and_extract(data: dict):
    """Validate incoming transaction data and return feature array."""
    schema = TransactionSchema()
    errors = schema.validate(data)
    if errors:
        raise ValidationError(errors)
    cleaned = schema.load(data)
    features = np.array([cleaned[f] for f in FEATURE_ORDER]).reshape(1, -1)
    return features, cleaned


def get_risk_level(probability: float) -> str:
    if probability < 0.3:
        return "LOW"
    elif probability < 0.6:
        return "MEDIUM"
    elif probability < 0.8:
        return "HIGH"
    else:
        return "CRITICAL"
