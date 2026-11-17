import { useState } from "react";

const initialForm = {
  age: 40,
  sex: "M",
  chest_pain: "ATA",
  resting_bp: 120,
  cholesterol: 200,
  fasting_bs: 0,
  resting_ecg: "Normal",
  max_hr: 150,
  exercise_angina: "N",
  oldpeak: 1.0,
  st_slope: "Up",
};

const API_URL = import.meta.env.VITE_API_URL

function App() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (event) => {
    const { name, value, type } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]:
        type === "number"
          ? (name === "age" || name === "max_hr" || name === "fasting_bs"
              ? Number.parseInt(value, 10)
              : Number(value))
          : value,
    }));
  };

  const predict = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Could not get a prediction.");
      }
      setResult(data);
    } catch (err) {
      setError(
        `${err.message}. Make sure the FastAPI backend is running at http://127.0.0.1:8000.`
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm(initialForm);
    setResult(null);
    setError("");
  };

  return (
    <div className="app-shell">
      <nav className="navbar navbar-expand-lg navbar-dark app-navbar">
        <div className="container">
          <a className="navbar-brand fw-bold" href="/">CardioCheck</a>
          <span className="navbar-text text-white-50 small">
            ML-based heart disease prediction
          </span>
        </div>
      </nav>

      <main className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">
            <div className="text-center mb-4">
              <span className="eyebrow">HEALTH • MACHINE LEARNING</span>
              <h1 className="display-6 fw-bold mt-2">Heart Disease Risk Prediction</h1>
              <p className="text-secondary mb-0">
                Enter the health measurements below to receive the model's classification.
              </p>
            </div>

            <div className="card border-0 shadow-lg form-card">
              <div className="card-body p-4 p-lg-5">
                <form onSubmit={predict}>
                  <div className="section-heading mb-3">
                    <span className="section-number">01</span>
                    <div>
                      <h2 className="h5 mb-1">Personal information</h2>
                      <p className="text-secondary small mb-0">Basic demographic details</p>
                    </div>
                  </div>
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="age">Age</label>
                      <input className="form-control" id="age" name="age" type="number"
                        min="18" max="100" value={form.age} onChange={update} required />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="sex">Sex</label>
                      <select className="form-select" id="sex" name="sex" value={form.sex} onChange={update}>
                        <option value="M">Male</option><option value="F">Female</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="chest_pain">Chest pain type</label>
                      <select className="form-select" id="chest_pain" name="chest_pain" value={form.chest_pain} onChange={update}>
                        <option value="ATA">ATA</option><option value="NAP">NAP</option>
                        <option value="TA">TA</option><option value="ASY">ASY</option>
                      </select>
                    </div>
                  </div>

                  <div className="section-heading mb-3">
                    <span className="section-number">02</span>
                    <div>
                      <h2 className="h5 mb-1">Clinical measurements</h2>
                      <p className="text-secondary small mb-0">Enter the recorded measurements</p>
                    </div>
                  </div>
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="resting_bp">Resting blood pressure (mm Hg)</label>
                      <input className="form-control" id="resting_bp" name="resting_bp" type="number"
                        min="80" max="250" step="0.1" value={form.resting_bp} onChange={update} required />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="cholesterol">Cholesterol (mg/dL)</label>
                      <input className="form-control" id="cholesterol" name="cholesterol" type="number"
                        min="100" max="700" step="0.1" value={form.cholesterol} onChange={update} required />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="fasting_bs">Fasting blood sugar &gt; 120 mg/dL</label>
                      <select className="form-select" id="fasting_bs" name="fasting_bs" value={form.fasting_bs} onChange={update}>
                        <option value={0}>No (0)</option><option value={1}>Yes (1)</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="resting_ecg">Resting ECG</label>
                      <select className="form-select" id="resting_ecg" name="resting_ecg" value={form.resting_ecg} onChange={update}>
                        <option value="Normal">Normal</option><option value="ST">ST</option><option value="LVH">LVH</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="max_hr">Maximum heart rate</label>
                      <input className="form-control" id="max_hr" name="max_hr" type="number"
                        min="60" max="220" value={form.max_hr} onChange={update} required />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="exercise_angina">Exercise-induced angina</label>
                      <select className="form-select" id="exercise_angina" name="exercise_angina" value={form.exercise_angina} onChange={update}>
                        <option value="Y">Yes</option><option value="N">No</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="oldpeak">Oldpeak (ST depression)</label>
                      <input className="form-control" id="oldpeak" name="oldpeak" type="number"
                        min="0" max="10" step="0.1" value={form.oldpeak} onChange={update} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="st_slope">ST slope</label>
                      <select className="form-select" id="st_slope" name="st_slope" value={form.st_slope} onChange={update}>
                        <option value="Up">Up</option><option value="Flat">Flat</option><option value="Down">Down</option>
                      </select>
                    </div>
                  </div>

                  <div className="d-flex flex-column flex-sm-row gap-2 justify-content-end">
                    <button type="button" className="btn btn-light px-4" onClick={reset}>Reset</button>
                    <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                      {loading ? <><span className="spinner-border spinner-border-sm me-2" />Predicting...</> : "Predict"}
                    </button>
                  </div>
                </form>

                {error && <div className="alert alert-danger mt-4 mb-0" role="alert">{error}</div>}

                {result && (
                  <div className={`result-panel mt-4 ${result.prediction === 1 ? "result-high" : "result-low"}`} role="status">
                    <div className="d-flex align-items-start gap-3">
                      <div className="result-icon">{result.prediction === 1 ? "!" : "✓"}</div>
                      <div>
                        <div className="text-uppercase small fw-semibold opacity-75">Model result</div>
                        <h3 className="h5 fw-bold mb-2">{result.result}</h3>
                        {result.class_probability !== null && (
                          <p className="mb-2">
                            Model probability for class 1: {(result.class_probability * 100).toFixed(1)}%
                          </p>
                        )}
                        <p className="small mb-0">{result.note}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-center text-secondary small mt-4">
              Educational demonstration only. This prediction is not a medical diagnosis.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
