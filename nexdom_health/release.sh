#!/usr/bin/env bash
set -euo pipefail

# Build & push helper for Nexdom Health Reporter add-on.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADDON_DIR="${ROOT_DIR}"
IMAGE_REPO_DEFAULT="docker.io/chekosg/nexdom_health"

usage() {
  cat <<'USAGE'
Usage: ./release.sh <version> [options]

Construye y publica la imagen del add-on Nexdom Health Reporter.

Options:
  --image <repo/name>         Repositorio base (default: docker.io/chekosg/nexdom_health)
  --platforms "<lista>"       Plataformas Docker, separadas por comas (default: linux/amd64,linux/arm64,linux/arm/v7)
  --push-latest               Publica también etiquetas :latest por arquitectura
  --dry-run                   Muestra las acciones sin ejecutarlas
  -h, --help                  Muestra esta ayuda y termina
USAGE
}

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "❌ Falta comando requerido: $1" >&2
    exit 1
  fi
}

ensure_buildx() {
  if ! docker buildx version >/dev/null 2>&1; then
    echo "❌ Docker Buildx no disponible." >&2
    exit 1
  fi
  if ! docker buildx inspect >/dev/null 2>&1; then
    docker buildx create --name nexdom_health_builder --use >/dev/null 2>&1 || true
  fi
  docker buildx inspect --bootstrap >/dev/null 2>&1 || true
}

trim() {
  local trimmed="$1"
  trimmed="${trimmed#${trimmed%%[![:space:]]*}}"
  trimmed="${trimmed%${trimmed##*[![:space:]]}}"
  printf '%s' "$trimmed"
}

PLATFORMS_DEFAULT="linux/amd64,linux/arm64,linux/arm/v7"
PLATFORMS="${PLATFORMS_DEFAULT}"
IMAGE_REPO="${IMAGE_REPO_DEFAULT}"
PUSH_LATEST=false
DRY_RUN=false

POSITIONAL=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --image)
      shift
      IMAGE_REPO="${1:-}"
      if [[ -z "${IMAGE_REPO}" ]]; then
        echo "❌ Falta valor para --image" >&2
        exit 1
      fi
      ;;
    --platforms)
      shift
      PLATFORMS="${1:-}"
      if [[ -z "${PLATFORMS}" ]]; then
        echo "❌ Falta valor para --platforms" >&2
        exit 1
      fi
      ;;
    --push-latest)
      PUSH_LATEST=true
      ;;
    --dry-run)
      DRY_RUN=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    -*)
      echo "❌ Opción no reconocida: $1" >&2
      exit 1
      ;;
    *)
      POSITIONAL+=("$1")
      ;;
  esac
  shift || true
done

if [[ ${#POSITIONAL[@]} -eq 0 ]]; then
  echo "❌ Debes indicar la versión, ej. ./release.sh 0.1.0" >&2
  exit 1
fi
VERSION="${POSITIONAL[0]}"
if [[ ${#POSITIONAL[@]} -gt 1 ]]; then
  echo "❌ Argumentos extra detectados: ${POSITIONAL[*]:1}" >&2
  exit 1
fi

if [[ "${IMAGE_REPO}" == *"{arch}"* ]]; then
  echo "❌ IMAGE_REPO no debe incluir {arch}. Usa la base, ej. docker.io/usuario/nexdom_health" >&2
  exit 1
fi

need docker
need python3

IFS=',' read -r -a RAW_PLATFORMS <<< "${PLATFORMS}"
if [[ ${#RAW_PLATFORMS[@]} -eq 0 ]]; then
  echo "❌ La lista de plataformas está vacía" >&2
  exit 1
fi

declare -a BUILD_PLATFORMS=()
declare -a BUILD_ARCHES=()
declare -a UNIQUE_ARCHES=()

ha_arch_from_platform() {
  case "$1" in
    linux/amd64) echo "amd64" ;;
    linux/arm64|linux/arm64/v8) echo "aarch64" ;;
    linux/arm/v7|linux/arm32/v7) echo "armv7" ;;
    *) return 1 ;;
  esac
}

for raw in "${RAW_PLATFORMS[@]}"; do
  platform="$(trim "$raw")"
  [[ -z "$platform" ]] && continue
  arch="$(ha_arch_from_platform "$platform" 2>/dev/null || true)"
  if [[ -z "$arch" ]]; then
    echo "❌ Plataforma no soportada: $platform" >&2
    exit 1
  fi
  BUILD_PLATFORMS+=("$platform")
  BUILD_ARCHES+=("$arch")
  if [[ ! " ${UNIQUE_ARCHES[*]} " =~ " ${arch} " ]]; then
    UNIQUE_ARCHES+=("$arch")
  fi
done

if [[ ${#BUILD_PLATFORMS[@]} -eq 0 ]]; then
  echo "❌ Ninguna plataforma válida para construir" >&2
  exit 1
fi

if [[ "${DRY_RUN}" == false ]]; then
  ensure_buildx
fi

declare -a PUBLISHED_TAGS=()
for idx in "${!BUILD_PLATFORMS[@]}"; do
  platform="${BUILD_PLATFORMS[$idx]}"
  arch="${BUILD_ARCHES[$idx]}"
  version_tag="${IMAGE_REPO}-${arch}:${VERSION}"
  latest_tag="${IMAGE_REPO}-${arch}:latest"

  echo "▶ Construyendo ${version_tag} (${platform})"
  if [[ "${DRY_RUN}" == true ]]; then
    echo "   docker buildx build --platform ${platform} -t ${version_tag} --push ${ADDON_DIR}"
  else
    docker buildx build \
      --platform "${platform}" \
      -t "${version_tag}" \
      --push \
      "${ADDON_DIR}"
  fi
  PUBLISHED_TAGS+=("${version_tag}")

  if [[ "${PUSH_LATEST}" == true ]]; then
    echo "▶ Etiquetando ${latest_tag}"
    if [[ "${DRY_RUN}" == true ]]; then
      echo "   docker buildx build --platform ${platform} -t ${latest_tag} --push ${ADDON_DIR}"
    else
      docker buildx build \
        --platform "${platform}" \
        -t "${latest_tag}" \
        --push \
        "${ADDON_DIR}"
    fi
    PUBLISHED_TAGS+=("${latest_tag}")
  fi
done

manifest_path="${ADDON_DIR}/manifest.json"
config_path="${ADDON_DIR}/config.yaml"
image_template="${IMAGE_REPO}-{arch}"

update_manifest() {
  python3 - <<'PY' "$manifest_path" "$VERSION" "$image_template" "${UNIQUE_ARCHES[@]}"
import json
import sys
from pathlib import Path
manifest = Path(sys.argv[1])
version = sys.argv[2]
image_template = sys.argv[3]
arches = sys.argv[4:]
data = json.loads(manifest.read_text(encoding="utf-8"))
data["version"] = version
data["image"] = image_template
if arches:
    data["arch"] = arches
manifest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY
}

update_config() {
  python3 - <<'PY' "$config_path" "$VERSION" "${UNIQUE_ARCHES[@]}"
from pathlib import Path
import sys

config = Path(sys.argv[1])
version = sys.argv[2]
arches = sys.argv[3:]

lines = config.read_text(encoding="utf-8").splitlines()
out = []
i = 0
while i < len(lines):
    line = lines[i]
    if line.startswith("version:"):
        out.append(f'version: "{version}"')
        i += 1
        continue
    if line.startswith("arch:"):
        out.append("arch:")
        i += 1
        while i < len(lines) and lines[i].startswith("  - "):
            i += 1
        for arch in arches:
            out.append(f"  - {arch}")
        continue
    out.append(line)
    i += 1

config.write_text("\n".join(out) + "\n", encoding="utf-8")
PY
}

echo "▶ Actualizando manifest y config con versión ${VERSION}"
if [[ "${DRY_RUN}" == true ]]; then
  echo "   (dry-run) manifest.json y config.yaml no fueron modificados"
else
  update_manifest
  update_config
fi

echo
echo "✅ Release Nexdom Health"
echo "   Versión:   ${VERSION}"
echo "   Imagenes:  ${PUBLISHED_TAGS[*]}"
echo "   Manifest:  ${manifest_path}"
echo "   Config:    ${config_path}"
echo
cat <<'NEXT'
Siguientes pasos:
  1. Revisa y commitea manifest.json y config.yaml.
  2. Sube los cambios al repo del add-on.
  3. En HAOS, recarga el Add-on Store e instala/actualiza la versión publicada.
NEXT
