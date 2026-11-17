from pathlib import Path
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"

MODEL_PATH = MODEL_DIR / "Logistic_heart.pkl"
SCALER_PATH = MODEL_DIR / "scaler.pkl"
COLUMNS_PATH = MODEL_DIR / "columns.pkl"

# Load once when the API starts, not on every prediction.
for path in (MODEL_PATH, SCALER_PATH, COLUMNS_PATH):
    if not path.exists():
        raise FileNotFoundError(
            f"Missing {path.name}. Run the corrected model-training/export "
            "cell in your notebook and put the generated files in backend/models/."
        )

model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
expected_columns = joblib.load(COLUMNS_PATH)

app = FastAPI(
    title="Heart Disease Prediction API",
    description="Predicts the model's heart-disease classification from the supplied features.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HeartInput(BaseModel):
    age: int = Field(ge=18, le=100)
    sex: str
    chest_pain: str
    resting_bp: float = Field(ge=80, le=250)
    cholesterol: float = Field(ge=100, le=700)
    fasting_bs: int = Field(ge=0, le=1)
    resting_ecg: str
    max_hr: int = Field(ge=60, le=220)
    exercise_angina: str
    oldpeak: float = Field(ge=0, le=10)
    st_slope: str


@app.get("/")
def root():
    return {"message": "Heart Disease Prediction API is running."}


@app.get("/health")
def health():
    return {"status": "ok", "model": "Logistic Regression"}


@app.post("/predict")
def predict(payload: HeartInput):
    # These category names match the original notebook's pd.get_dummies(..., drop_first=True).
    allowed = {
        "sex": {"M", "F"},
        "chest_pain": {"ATA", "NAP", "TA", "ASY"},
        "resting_ecg": {"Normal", "ST", "LVH"},
        "exercise_angina": {"Y", "N"},
        "st_slope": {"Up", "Flat", "Down"},
    }
    for field, options in allowed.items():
        value = getattr(payload, field)
        if value not in options:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid {field}. Allowed values: {', '.join(sorted(options))}",
            )

    raw_input = {
        "Age": payload.age,
        "RestingBP": payload.resting_bp,
        "Cholesterol": payload.cholesterol,
        "FastingBS": payload.fasting_bs,
        "MaxHR": payload.max_hr,
        "Oldpeak": payload.oldpeak,
        # drop_first=True baseline categories:
        # Sex=F, ChestPainType=ASY, RestingECG=LVH,
        # ExerciseAngina=N, ST_Slope=Down.
        "Sex_M": int(payload.sex == "M"),
        "ChestPainType_ATA": int(payload.chest_pain == "ATA"),
        "ChestPainType_NAP": int(payload.chest_pain == "NAP"),
        "ChestPainType_TA": int(payload.chest_pain == "TA"),
        "RestingECG_Normal": int(payload.resting_ecg == "Normal"),
        "RestingECG_ST": int(payload.resting_ecg == "ST"),
        "ExerciseAngina_Y": int(payload.exercise_angina == "Y"),
        "ST_Slope_Flat": int(payload.st_slope == "Flat"),
        "ST_Slope_Up": int(payload.st_slope == "Up"),
    }

    # Match precisely the feature names and order used when training.
    input_df = pd.DataFrame([raw_input]).reindex(columns=expected_columns, fill_value=0)

    try:
        scaled_input = scaler.transform(input_df)
        prediction = int(model.predict(scaled_input)[0])
        probability = None
        if hasattr(model, "predict_proba"):
            probability = float(model.predict_proba(scaled_input)[0][1])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc

    print(prediction)
    print(probability)

    return {
        "prediction": prediction,
        "result": "High Risk of Heart Disease" if prediction == 1 else "Low Risk of Heart Disease",
        "class_probability": probability,
        "note": (
            "This is a machine-learning demonstration, not a medical diagnosis. "
            "Consult a qualified healthcare professional for medical advice."
        ),
    }
