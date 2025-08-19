#!/bin/bash

# ICRoGen Development Helper Script
# This script provides convenient commands for developing and testing the ICRoGen system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if docker and docker-compose are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Dependencies check passed"
}

# Build the application
build() {
    print_status "Building ICRoGen backend..."
    docker-compose build
    print_success "Build completed"
}

# Start the development environment
start() {
    print_status "Starting ICRoGen development environment..."
    docker-compose up -d
    
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "Development environment started successfully!"
        echo ""
        echo "Services available at:"
        echo "  - API Server: http://localhost:8080"
        echo "  - Database Admin (Adminer): http://localhost:8081"
        echo "    - Server: gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000"
        echo "    - Username: 4ASi2rWg4pDfPqV.root"
        echo "    - Password: sGoG6EMy7958HPuz"
        echo "    - Database: icrogen"
        echo ""
        echo "API Documentation: http://localhost:8080/api/docs"
    else
        print_error "Failed to start some services"
        docker-compose logs
    fi
}

# Stop the development environment
stop() {
    print_status "Stopping ICRoGen development environment..."
    docker-compose down
    print_success "Development environment stopped"
}

# Restart the development environment
restart() {
    print_status "Restarting ICRoGen development environment..."
    docker-compose down
    docker-compose up -d
    print_success "Development environment restarted"
}

# View logs
logs() {
    if [ "$1" = "api" ]; then
        docker-compose logs -f icrogen-api
    elif [ "$1" = "db" ]; then
        docker-compose logs -f icrogen-mysql
    else
        docker-compose logs -f
    fi
}

# Setup sample data
setup_data() {
    print_status "Setting up sample data..."
    
    # Check if API is running
    if ! curl -s http://localhost:8080/api/health > /dev/null; then
        print_error "API server is not running. Please start the development environment first."
        exit 1
    fi
    
    # Run the sample data setup
    go run examples/setup_sample_data.go
    print_success "Sample data setup completed"
}

# Run database migration
migrate() {
    print_status "Running database migrations..."
    docker-compose exec icrogen-api go run cmd/main.go --migrate-only
    print_success "Database migration completed"
}

# Run database seeding
seed() {
    print_status "Seeding database with initial data..."
    docker-compose exec icrogen-api go run cmd/seed/main.go
    print_success "Database seeding completed"
}

# Clean up everything (containers, volumes, networks)
clean() {
    print_warning "This will remove all containers, volumes, and networks for ICRoGen"
    read -p "Are you sure? (y/N): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleaning up ICRoGen environment..."
        docker-compose down -v --remove-orphans
        docker system prune -f
        print_success "Cleanup completed"
    else
        print_status "Cleanup cancelled"
    fi
}

# Run tests
test() {
    print_status "Running tests..."
    go test ./... -v
    print_success "Tests completed"
}

# Format code
format() {
    print_status "Formatting Go code..."
    go fmt ./...
    print_success "Code formatting completed"
}

# Lint code
lint() {
    print_status "Running linter..."
    if command -v golangci-lint &> /dev/null; then
        golangci-lint run
    else
        print_warning "golangci-lint not found. Installing..."
        go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
        golangci-lint run
    fi
    print_success "Linting completed"
}

# Show API status
status() {
    print_status "Checking ICRoGen services status..."
    
    echo ""
    echo "Docker Compose Services:"
    docker-compose ps
    
    echo ""
    echo "API Health Check:"
    if curl -s http://localhost:8080/api/health > /dev/null; then
        print_success "API is healthy"
    else
        print_error "API is not responding"
    fi
    
    echo ""
    echo "TiDB Cloud Connection:"
    echo "Using TiDB Cloud at: gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000"
    echo "Database: icrogen"
}

# Show help
help() {
    echo "ICRoGen Development Helper Script"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  build       Build the application"
    echo "  start       Start the development environment"
    echo "  stop        Stop the development environment"
    echo "  restart     Restart the development environment"
    echo "  logs        View logs (use 'logs api' or 'logs db' for specific service)"
    echo "  setup-data  Setup sample data for testing"
    echo "  migrate     Run database migrations"
    echo "  seed        Seed database with initial data"
    echo "  test        Run tests"
    echo "  format      Format Go code"
    echo "  lint        Run linter"
    echo "  status      Show services status"
    echo "  clean       Clean up everything (containers, volumes, networks)"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start          # Start development environment"
    echo "  $0 setup-data     # Setup sample data"
    echo "  $0 logs api       # View API logs"
    echo "  $0 status         # Check services status"
}

# Main script logic
case "$1" in
    build)
        check_dependencies
        build
        ;;
    start)
        check_dependencies
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs "$2"
        ;;
    setup-data)
        setup_data
        ;;
    migrate)
        migrate
        ;;
    seed)
        seed
        ;;
    test)
        test
        ;;
    format)
        format
        ;;
    lint)
        lint
        ;;
    status)
        status
        ;;
    clean)
        clean
        ;;
    help|--help|-h)
        help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        help
        exit 1
        ;;
esac