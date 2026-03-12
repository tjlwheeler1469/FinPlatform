"""Australian tax constants and rates"""

# Historical Personal Tax Brackets
HISTORICAL_TAX_BRACKETS = {
    "2024-25": {
        "brackets": [
            (18200, 0),
            (45000, 0.16),
            (135000, 0.30),
            (190000, 0.37),
            (float('inf'), 0.45)
        ],
        "medicare_threshold": 24276,
        "description": "Stage 3 tax cuts - reduced rates"
    },
    "2023-24": {
        "brackets": [
            (18200, 0),
            (45000, 0.19),
            (120000, 0.325),
            (180000, 0.37),
            (float('inf'), 0.45)
        ],
        "medicare_threshold": 23365,
        "description": "Pre-Stage 3 rates"
    },
    "2022-23": {
        "brackets": [
            (18200, 0),
            (45000, 0.19),
            (120000, 0.325),
            (180000, 0.37),
            (float('inf'), 0.45)
        ],
        "medicare_threshold": 22801,
        "description": "LMITO ended"
    },
    "2021-22": {
        "brackets": [
            (18200, 0),
            (45000, 0.19),
            (120000, 0.325),
            (180000, 0.37),
            (float('inf'), 0.45)
        ],
        "medicare_threshold": 22801,
        "description": "With LMITO offset"
    },
    "2020-21": {
        "brackets": [
            (18200, 0),
            (45000, 0.19),
            (120000, 0.325),
            (180000, 0.37),
            (float('inf'), 0.45)
        ],
        "medicare_threshold": 22801,
        "description": "COVID response"
    }
}

PERSONAL_TAX_BRACKETS_2024_25 = HISTORICAL_TAX_BRACKETS["2024-25"]["brackets"]
PERSONAL_TAX_BRACKETS_2025_26 = HISTORICAL_TAX_BRACKETS["2024-25"]["brackets"]

# Company Tax Rates - Historical
HISTORICAL_COMPANY_RATES = {
    "2024-25": {"base": 0.25, "full": 0.30},
    "2023-24": {"base": 0.25, "full": 0.30},
    "2022-23": {"base": 0.25, "full": 0.30},
    "2021-22": {"base": 0.25, "full": 0.30},
    "2020-21": {"base": 0.26, "full": 0.30}
}

COMPANY_TAX_RATE_BASE = 0.25
COMPANY_TAX_RATE_FULL = 0.30

MEDICARE_LEVY_RATE = 0.02
MEDICARE_LEVY_THRESHOLD = 24276

# CGT Discount Rate
CGT_DISCOUNT_INDIVIDUAL = 0.50
CGT_DISCOUNT_SMSF = 0.333

# SMSF Contribution Caps 2024-25
SMSF_CONCESSIONAL_CAP = 30000
SMSF_NON_CONCESSIONAL_CAP = 120000
SMSF_BRING_FORWARD_CAP = 360000
SMSF_TOTAL_SUPER_BALANCE_LIMIT = 1900000
SMSF_TAX_RATE = 0.15
SMSF_PENSION_TAX_RATE = 0.0
DIV_293_THRESHOLD = 250000
