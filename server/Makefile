# Makefile for ICRoGen Server

.PHONY: build run test clean docker-build docker-run docker-stop setup-dev

# Variables
APP_NAME=icrogen
DOCKER_IMAGE=icrogen-api
DOCKER_TAG=latest

# Build the application
build:
	go build -o bin/$(APP_NAME) ./cmd/main.go

# Run the application locally
run:
	go run ./cmd/main.go

# Run tests
test:
	go test ./...

# Run tests with coverage
test-coverage:
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Clean build artifacts
clean:
	rm -rf bin/
	rm -f coverage.out coverage.html

# Install dependencies
deps:
	go mod download
	go mod tidy

# Format code
fmt:
	go fmt ./...

# Run linter
lint:
	golangci-lint run

# Docker commands
docker-build:
	docker build -t $(DOCKER_IMAGE):$(DOCKER_TAG) .

docker-run:
	docker-compose up -d

docker-stop:
	docker-compose down

docker-logs:
	docker-compose logs -f icrogen-api

# Database commands
db-up:
	docker-compose up -d mysql

db-down:
	docker-compose stop mysql

db-reset:
	docker-compose down -v
	docker-compose up -d mysql

# Development setup
setup-dev:
	@echo "Setting up development environment..."
	go mod download
	cp .env.example .env
	@echo "Environment setup complete!"
	@echo "Edit .env file with your database credentials"
	@echo "Run 'make docker-run' to start the full stack"

# Production build
build-prod:
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o bin/$(APP_NAME) ./cmd/main.go

# Help
help:
	@echo "Available commands:"
	@echo "  build        - Build the application"
	@echo "  run          - Run the application locally"
	@echo "  test         - Run tests"
	@echo "  test-coverage- Run tests with coverage report"
	@echo "  clean        - Clean build artifacts"
	@echo "  deps         - Install dependencies"
	@echo "  fmt          - Format code"
	@echo "  lint         - Run linter"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run   - Run with Docker Compose"
	@echo "  docker-stop  - Stop Docker containers"
	@echo "  docker-logs  - View application logs"
	@echo "  db-up        - Start only MySQL"
	@echo "  db-down      - Stop MySQL"
	@echo "  db-reset     - Reset database (removes all data)"
	@echo "  setup-dev    - Setup development environment"
	@echo "  build-prod   - Build for production"
	@echo "  help         - Show this help message"