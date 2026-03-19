.PHONY: k8s-setup k8s-infra-up k8s-infra-down k8s-dev k8s-down k8s-status

# --- K8s local development ---

## Start minikube, enable addons, create namespace
k8s-setup:
	bash scripts/k8s-setup.sh

## Start infrastructure services (PostgreSQL, Redis, fake-GCS)
k8s-infra-up:
	docker compose -f docker-compose.infra.yml up -d

## Stop infrastructure services
k8s-infra-down:
	docker compose -f docker-compose.infra.yml down

## Build & deploy to local K8s with Skaffold (port-forward enabled)
k8s-dev:
	skaffold dev --port-forward

## Tear down K8s resources
k8s-down:
	skaffold delete || true
	docker compose -f docker-compose.infra.yml down

## Show pod and HPA status
k8s-status:
	kubectl get pods,svc,hpa -n aion-copilot
