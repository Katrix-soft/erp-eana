#!/bin/bash

# =======================
# CONFIG
# =======================
FRONT=frontend
BACK=backend
DB=postgres

FRONT_PORT=5173
BACK_PORT=3000
DB_PORT=5432

# =======================
# COLORS
# =======================
RED="\e[31m"
GREEN="\e[32m"
YELLOW="\e[33m"
BLUE="\e[34m"
PURPLE="\e[35m"
CYAN="\e[36m"
GRAY="\e[90m"
BOLD="\e[1m"
RESET="\e[0m"

# =======================
# HELPERS
# =======================
pause() {
  echo ""
  read -p "Presioná ENTER para volver al menú..."
}

is_running() {
  docker compose ps -q "$1" | grep -q .
}

# =======================
# HEALTH CHECKS
# =======================
check_frontend() {
  if ! is_running "$FRONT"; then
    echo -e "Frontend: ${RED}✖ FAIL${RESET} (container apagado)"
    return 1
  fi

  if curl -s "http://localhost:$FRONT_PORT" >/dev/null; then
    echo -e "Frontend: ${GREEN}✔ OK${RESET} (HTTP responde)"
    return 0
  else
    echo -e "Frontend: ${RED}✖ FAIL${RESET} (no responde HTTP)"
    return 1
  fi
}

check_backend() {
  if ! is_running "$BACK"; then
    echo -e "Backend: ${RED}✖ FAIL${RESET} (container apagado)"
    return 1
  fi

  if curl -s "http://localhost:$BACK_PORT/health" >/dev/null; then
    echo -e "Backend: ${GREEN}✔ OK${RESET} (/health OK)"
    return 0
  else
    echo -e "Backend: ${RED}✖ FAIL${RESET} (API no responde)"
    return 1
  fi
}

check_db() {
  if ! is_running "$DB"; then
    echo -e "Database: ${RED}✖ FAIL${RESET} (container apagado)"
    return 1
  fi

  if docker exec "$BACK" sh -c "pg_isready -h $DB -p $DB_PORT" >/dev/null 2>&1; then
    echo -e "Database: ${GREEN}✔ OK${RESET} (accesible desde backend)"
    return 0
  else
    echo -e "Database: ${RED}✖ FAIL${RESET} (no accesible desde backend)"
    return 1
  fi
}

# =======================
# SCHEMA
# =======================
show_schema() {
  echo ""
  echo -e "${CYAN}${BOLD}Esquema lógico:${RESET}"
  echo -e " ${GRAY}Browser${RESET}"
  echo -e "    │ :$FRONT_PORT"
  echo -e "    ▼"
  echo -e " ${BLUE}Frontend${RESET} (Angular + Nginx)"
  echo -e "    │ /api"
  echo -e "    ▼"
  echo -e " ${GREEN}Backend${RESET} (API)"
  echo -e "    │ SQL"
  echo -e "    ▼"
  echo -e " ${PURPLE}Database${RESET} (Postgres – red interna Docker)"
  echo ""
}

# =======================
# FULL HEALTH
# =======================
health() {
  clear
  echo -e "${BLUE}======================================${RESET}"
  echo -e "${BLUE} 🧭 ESTADO REAL DEL STACK${RESET}"
  echo -e "${BLUE}======================================${RESET}"
  echo ""

  FAILURES=0

  check_frontend || ((FAILURES++))
  check_backend || ((FAILURES++))
  check_db || ((FAILURES++))

  show_schema

  if [[ $FAILURES -eq 0 ]]; then
    echo -e "${GREEN}✔ STACK 100% OPERATIVO${RESET}"
    echo -e "${GRAY}Postgres no expuesto al host (arquitectura correcta)${RESET}"
  else
    echo -e "${RED}✖ FALLAS DETECTADAS: $FAILURES${RESET}"
    echo -e "${YELLOW}Diagnóstico:${RESET}"
    echo -e " • Container apagado → docker compose up -d"
    echo -e " • API caída → revisar logs backend"
    echo -e " • DB inaccesible → revisar credenciales / network"
  fi

  pause
}

# =======================
# MENU
# =======================
while true; do
  clear
  echo -e "${BOLD}======================================${RESET}"
  echo -e "${BOLD} 🚀 STACK MANAGER - EANA${RESET}"
  echo -e "${BOLD}======================================${RESET}"
  echo "A) 🧭 Ver estado real del stack"
  echo "1) ⚡ Restart rápido (front + back)"
  echo "2) 🎨 Rebuild FRONTEND"
  echo "3) 🧠 Rebuild BACKEND"
  echo "4) 🔥 Clean rebuild FRONTEND (no-cache)"
  echo "5) 🔥 Clean rebuild BACKEND (no-cache)"
  echo "6) ☢️ Clean rebuild TODO"
  echo "7) 📜 Logs FRONTEND"
  echo "8) 📜 Logs BACKEND"
  echo "9) ❌ Salir"
  echo "--------------------------------------"
  read -p "Elegí una opción: " opt

  case $opt in
    A|a) health ;;
    1) docker compose restart "$FRONT" "$BACK" ;;
    2) docker compose build "$FRONT" && docker compose up -d "$FRONT" ;;
    3) docker compose build "$BACK" && docker compose up -d "$BACK" ;;
    4) docker compose down && docker compose build --no-cache "$FRONT" && docker compose up -d "$FRONT" ;;
    5) docker compose down && docker compose build --no-cache "$BACK" && docker compose up -d "$BACK" ;;
    6) docker compose down && docker compose build --no-cache && docker compose up -d ;;
    7) docker compose logs -f "$FRONT" ;;
    8) docker compose logs -f "$BACK" ;;
    9) exit 0 ;;
    *) echo -e "${RED}Opción inválida${RESET}" && sleep 1 ;;
  esac
done
