#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Print header
print_header() {
    echo -e "\n${BOLD}${YELLOW}=========================================${NC}"
    echo -e "${BOLD}${YELLOW}  $1${NC}"
    echo -e "${BOLD}${YELLOW}=========================================${NC}\n"
}

# Print success message
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Print error message
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Print info message
print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if Python is installed
check_python() {
    if command -v python3 &>/dev/null; then
        print_success "Python is installed"
        return 0
    else
        print_error "Python is not installed"
        return 1
    fi
}

# Check if Node.js is installed
check_node() {
    if command -v node &>/dev/null; then
        print_success "Node.js is installed"
        return 0
    else
        print_error "Node.js is not installed"
        return 1
    fi
}

# Check if .env file exists
check_env() {
    if [ -f .env ]; then
        print_success ".env file exists"
        return 0
    else
        print_error ".env file does not exist"
        print_info "Creating .env file from .env.example..."
        cp .env.example .env
        print_info "Please edit .env file with your configuration"
        return 1
    fi
}

# Run system tests
run_tests() {
    print_header "Running System Tests"
    python3 test_system.py
    if [ $? -ne 0 ]; then
        print_error "System tests failed"
        return 1
    else
        print_success "System tests passed"
        return 0
    fi
}

# Start backend
start_backend() {
    print_header "Starting Backend"
    cd backend
    if [ ! -d "venv" ]; then
        print_info "Creating virtual environment..."
        python3 -m venv venv
        source venv/bin/activate
        pip install -r ../requirements.txt
    else
        source venv/bin/activate
    fi
    
    print_info "Starting FastAPI server..."
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    print_success "Backend started with PID: $BACKEND_PID"
    cd ..
}

# Start frontend
start_frontend() {
    print_header "Starting Frontend"
    cd frontend
    if [ ! -d "node_modules" ]; then
        print_info "Installing dependencies..."
        npm install
    fi
    
    print_info "Starting Next.js server..."
    npm run dev &
    FRONTEND_PID=$!
    print_success "Frontend started with PID: $FRONTEND_PID"
    cd ..
}

# Main function
main() {
    print_header "V2Ray Management System"
    
    # Check requirements
    check_python
    PYTHON_OK=$?
    
    check_node
    NODE_OK=$?
    
    check_env
    ENV_OK=$?
    
    if [ $PYTHON_OK -ne 0 ] || [ $NODE_OK -ne 0 ]; then
        print_error "Missing requirements. Please install the required software."
        exit 1
    fi
    
    if [ $ENV_OK -ne 0 ]; then
        print_info "Please configure your .env file and run this script again."
        exit 1
    fi
    
    # Run tests
    run_tests
    TESTS_OK=$?
    
    if [ $TESTS_OK -ne 0 ]; then
        print_error "Tests failed. Please fix the issues before running the system."
        exit 1
    fi
    
    # Start services
    start_backend
    start_frontend
    
    print_header "System Running"
    print_info "Backend is running at: http://localhost:8000"
    print_info "Frontend is running at: http://localhost:3000"
    print_info "API documentation is available at: http://localhost:8000/api/docs"
    print_info "Press Ctrl+C to stop all services"
    
    # Wait for user to press Ctrl+C
    trap 'kill $BACKEND_PID $FRONTEND_PID; exit' INT
    wait
}

# Run main function
main
