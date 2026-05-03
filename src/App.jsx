import { useState } from "react";

function App() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openNutrition, setOpenNutrition] = useState({});

  // 画面切り替え用
  const [mode, setMode] = useState("input"); // "input" or "result"

  // 入力値（デフォルト値）
  const [params, setParams] = useState({
    cost: 1490,
    energy: 650,
    protein: 26.8,
    fat: 18.05,
    calcium: 350,
    magnesium: 50,
    iron: 3,
    zinc: 2,
    VA: 200,
    VB1: 0.4,
    VB2: 0.4,
    VC: 25,
    sodium: 1,
    dietaryfiber: 4.5,
  });

  const nutritionLabels = {
    cost: "費用（5日合計）",
    energy: "エネルギー",
    protein: "たんぱく質",
    fat: "脂質",
    calcium: "カルシウム",
    magnesium: "マグネシウム",
    iron: "鉄",
    zinc: "亜鉛",
    VA: "ビタミンA",
    VB1: "ビタミンB1",
    VB2: "ビタミンB2",
    VC: "ビタミンC",
    sodium: "食塩",
    dietaryfiber: "食物繊維",
  };

  const nutritionUnits = {
    cost: "円",
    energy: "kcal",
    protein: "g",
    fat: "g",
    calcium: "mg",
    magnesium: "mg",
    iron: "mg",
    zinc: "mg",
    VA: "μg",
    VB1: "mg",
    VB2: "mg",
    VC: "mg",
    sodium: "g",
    dietaryfiber: "g",
  };

  const handleChange = (key, value) => {
    setParams({ ...params, [key]: Number(value) });
  };

  const handleOptimize = async () => {
    setLoading(true);

    try {
      const res = await fetch("https://school-main-recommend.com/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        throw new Error("APIエラー");
      }

      const data = await res.json();
      setMenu(data);
      setMode("result");
    } catch (err) {
      console.error(err);
      alert("API呼び出し失敗");
    }

    setLoading(false);
  };

  const handleBack = () => {
    setMode("input");
  };

  const formatTo3Decimals = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      return value;
    }
    return num.toFixed(3).replace(/\.?0+$/, "");
  };

  const toggleNutrition = (day) => {
    setOpenNutrition((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>献立最適化アプリ</h1>

      {/* ---------------- 入力画面 ---------------- */}
      {mode === "input" && (
        <div style={styles.card}>
          <h2 style={styles.subtitle}>目標値入力</h2>

          <div style={styles.grid}>
            {Object.keys(nutritionLabels).map((key) => (
              <div key={key} style={styles.inputBox}>
                <label style={styles.label}>{nutritionLabels[key]}</label>

                <div style={styles.inputRow}>
                  <input
                    type="number"
                    value={params[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    style={styles.input}
                  />
                  <span style={styles.unit}>{nutritionUnits[key]}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleOptimize}
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "最適化中..." : "最適化する"}
          </button>
        </div>
      )}

      {/* ---------------- 結果画面 ---------------- */}
      {mode === "result" && (
        <div>
          <button onClick={handleBack} style={styles.backButton}>
            ← 入力画面に戻る
          </button>

          <div style={styles.resultGrid}>
            {menu.map((day) => (
              <div key={day.day} style={styles.resultCard}>
                <h2 style={styles.dayTitle}>{day.day}日目</h2>

                <p style={styles.costText}>
                  費用: {day.cost.toFixed(2)} 円
                </p>

                <h3 style={styles.sectionTitle}>🍴 献立</h3>
                <ul style={styles.list}>
                  {day.recipes.map((recipe, idx) => (
                    <li key={idx} style={styles.recipeCard}>
                      <div style={styles.recipeHeader}>
                        <span style={styles.categoryTag}>{recipe.category}</span>
                        <span style={styles.recipeTitle}>{recipe.title}</span>
                      </div>

                      <div style={styles.recipeMeta}>
                        <div style={styles.smallText}>
                          🔧 調理器具:{" "}
                          {recipe.equipment.length > 0 ? recipe.equipment.join("、") : "なし"}
                        </div>
                        <div style={styles.smallText}>
                          🍽 食器:{" "}
                          {recipe.tableware.length > 0 ? recipe.tableware.join("、") : "なし"}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <button onClick={() => toggleNutrition(day.day)} style={styles.nutritionToggle}>
                  {openNutrition[day.day] ? "▼ 栄養素を隠す" : "▶ 栄養素を表示"}
                </button>

                {openNutrition[day.day] && (
                  <div style={styles.nutritionList}>
                    {Object.keys(day.nutrition).map((k) => {
                      const actual = day.nutrition[k];
                      const target = params[k];
                      const ratio = Math.abs(actual - target) / target;  
                      const isOk = ratio <= 0.2;

                      return (
                      <div key={k} style={isOk ? styles.nutritionRowOk : styles.nutritionRowNg}>
                        <span style={styles.nutritionLabel}>
                          {nutritionLabels[k]}
                        </span>
                        <span style={styles.nutritionValue}>
                          {formatTo3Decimals(day.nutrition[k])} {nutritionUnits[k]}
                          {!isOk && (
                            <span style={{marginLeft: "8px", color: "red", fontSize: "12px"}}>
                              (目標未達成)
                            </span>
                          )}
                        </span>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- CSS風スタイル ---------------- */
const styles = {
  container: {
    padding: "20px",
    fontFamily: "sans-serif",
    background: "#f5f7fb",
    minHeight: "100vh",
  },

  title: {
    textAlign: "center",
    fontSize: "28px",
    marginBottom: "20px",
  },

  card: {
    margin: "0 auto",
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    maxWidth: "700px",
    width: "100%",
  },

  subtitle: {
    fontSize: "20px",
    marginBottom: "15px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },

  inputBox: {
    border: "1px solid #ddd",
    padding: "10px",
    borderRadius: "10px",
    background: "#fafafa",
  },

  label: {
    fontSize: "13px",
    display: "block",
    marginBottom: "6px",
    color: "#333",
  },

  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  input: {
    width: "100%",
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },

  unit: {
    fontSize: "12px",
    color: "#666",
    whiteSpace: "nowrap",
  },

  button: {
    marginTop: "18px",
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "#007bff",
    color: "white",
    fontSize: "16px",
    fontWeight: "bold",
  },

  backButton: {
    marginBottom: "15px",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#444",
    color: "white",
    cursor: "pointer",
  },

  resultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
    alignItems: "start",
  },

  resultCard: {
    background: "white",
    padding: "18px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },

  dayTitle: {
    fontSize: "22px",
    marginBottom: "10px",
  },

  costText: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: "12px",
  },

  sectionTitle: {
    fontSize: "16px",
    marginTop: "12px",
    marginBottom: "6px",
  },

  list: {
    paddingLeft: "0px",
    marginTop: "5px",
  },

  recipeCard: {
    listStyle: "none",
    padding: "10px",
    borderRadius: "10px",
    background: "#fafafa",
    border: "1px solid #eee",
    marginBottom: "10px",
  },

  recipeHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "6px",
  },

  categoryTag: {
    display: "inline-block",
    width: "60px",
    textAlign: "center",
    padding: "4px 6px",
    borderRadius: "8px",
    background: "#007bff",
    color: "white",
    fontSize: "12px",
    fontWeight: "bold",
  },

  recipeTitle: {
    fontSize: "15px",
    fontWeight: "bold",
    color: "#222",
  },

  recipeMeta: {
    paddingLeft: "70px",
  },

  smallText: {
    fontSize: "12px",
    color: "#555",
    marginBottom: "4px",
  },

  nutritionToggle: {
    width: "80%",
    textAlign: "center",
    marginTop: "5px",
    padding: "12px 14px",   // ← 大きくする（重要）
    borderRadius: "14px",   // ← 角丸大きめ
    border: "none",
    background: "#f1f2f6",
    cursor: "pointer",
    fontSize: "15px",       // ← 文字大きくする
    fontWeight: "bold",
  },

  nutritionList: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginTop: "8px",
  },

  nutritionRowOk: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "8px",
    background: "#f2f6ff",
    border: "1px solid #dbe6ff",
  },

  nutritionRowNg: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "8px",
    background: "#ffecec",
    border: "1px solid #ffb3b3",
  },

  nutritionLabel: {
    fontSize: "13px",
    color: "#333",
  },

  nutritionValue: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#222",
  },
};

export default App;