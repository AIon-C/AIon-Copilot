#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="aion-copilot"

echo "=== K8s Local Setup (Docker Desktop) ==="

# 1. Switch to docker-desktop context
echo "[*] Switching kubectl context to docker-desktop..."
kubectl config use-context docker-desktop

# 2. Verify cluster is reachable
echo "[*] Verifying cluster..."
if ! kubectl cluster-info &>/dev/null; then
  echo "[ERROR] Docker Desktop Kubernetes is not running."
  echo "        Enable it in: Docker Desktop > Settings > Kubernetes > Enable Kubernetes"
  exit 1
fi
echo "[OK] Cluster is reachable"

# 3. Install metrics-server if not present (for HPA)
if kubectl get deployment metrics-server -n kube-system &>/dev/null; then
  echo "[OK] metrics-server is already installed"
else
  echo "[*] Installing metrics-server..."
  kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
  # Patch for Docker Desktop (insecure TLS)
  kubectl patch deployment metrics-server -n kube-system \
    --type='json' \
    -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
fi

# 4. Create namespace
if kubectl get namespace "$NAMESPACE" &>/dev/null; then
  echo "[OK] Namespace '$NAMESPACE' already exists"
else
  echo "[*] Creating namespace '$NAMESPACE'..."
  kubectl create namespace "$NAMESPACE"
fi

echo ""
echo "=== Setup complete ==="
echo "  Context:   docker-desktop"
echo "  Namespace: $NAMESPACE"
echo ""
echo "Next steps:"
echo "  make k8s-infra-up   # Start PostgreSQL, Redis, fake-GCS"
echo "  make k8s-dev         # Build & deploy backend + ai-agent to K8s"
