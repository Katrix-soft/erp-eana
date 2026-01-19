import pandas as pd

df_final = pd.read_csv("personal_seed_temp.csv") if False else None
# (ignorar esto, solo para que no falle si lo pegás directo)

df = pd.read_csv("Personal CNSE Nacional.csv")
df.columns = df.columns.str.strip().str.lower()

col_id = "id"
col_nombre = "nombres"
col_apellido = "apellidos"
col_cargo = "cargo"

df_clean = df[[col_id, col_nombre, col_apellido, col_cargo]].copy()
df_clean = df_clean.rename(columns={
    col_id: "id",
    col_nombre: "nombre",
    col_apellido: "apellido",
    col_cargo: "cargo_completo"
})

puestos_unicos = sorted(df_clean["cargo_completo"].unique())
df_puestos = pd.DataFrame({
    "id": range(1, len(puestos_unicos) + 1),
    "nombre": puestos_unicos
})

df_final_test = df_clean.merge(
    df_puestos,
    left_on="cargo_completo",
    right_on="nombre",
    how="left"
)

print("COLUMNAS después del merge:", df_final_test.columns)
