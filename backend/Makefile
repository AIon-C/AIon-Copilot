.PHONY: build test vet run docker-up docker-down docker-restart

build:
	go build ./...

test:
	go test ./... -count=1

vet:
	go vet ./...

run:
	go run ./cmd/server

docker-up:
	docker compose -f ../docker-compose.yml up -d postgres redis fake-gcs backend grpcui prometheus grafana

docker-down:
	docker compose -f ../docker-compose.yml down

docker-restart:
	docker compose -f ../docker-compose.yml down -v && docker compose -f ../docker-compose.yml up -d --build postgres redis fake-gcs backend grpcui prometheus grafana
