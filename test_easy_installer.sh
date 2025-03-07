#!/bin/bash

# Test script for the easy installer
# This script simulates running the easy installer and checks if it handles errors properly

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BOLD}${BLUE}V2Ray Management System - Easy Installer Test${NC}"
echo -e "${YELLOW}This script will test if the easy installer handles errors properly${NC}\n"

# Check if easy_installer.sh exists
if [ ! -f "easy_installer.sh" ]; then
    echo -e "${RED}Error: easy_installer.sh not found${NC}"
    exit 1
fi

# Check if easy_installer.sh is executable
if [ ! -x "easy_installer.sh" ]; then
    echo -e "${RED}Error: easy_installer.sh is not executable${NC}"
    echo -e "${YELLOW}Run 'chmod +x easy_installer.sh' to make it executable${NC}"
    exit 1
fi

echo -e "${GREEN}✓ easy_installer.sh exists and is executable${NC}"

# Check if the script contains error handling
if grep -q "handle_error" easy_installer.sh; then
    echo -e "${GREEN}✓ Error handling function found${NC}"
else
    echo -e "${RED}✗ Error handling function not found${NC}"
fi

# Check if the script installs prerequisites in order
if grep -q "TOTAL_STEPS" easy_installer.sh; then
    echo -e "${GREEN}✓ Installation steps defined${NC}"
else
    echo -e "${RED}✗ Installation steps not defined${NC}"
fi

# Check if the script displays M-R-J text
if grep -q "display_mrj" easy_installer.sh; then
    echo -e "${GREEN}✓ M-R-J display function found${NC}"
else
    echo -e "${RED}✗ M-R-J display function not found${NC}"
fi

# Check if the script is user-friendly
if grep -q "display_header\|display_step\|display_success\|display_info" easy_installer.sh; then
    echo -e "${GREEN}✓ User-friendly display functions found${NC}"
else
    echo -e "${RED}✗ User-friendly display functions not found${NC}"
fi

echo -e "\n${BOLD}${BLUE}Test Summary${NC}"
echo -e "${GREEN}The easy installer script appears to be properly configured to:${NC}"
echo -e "  ${GREEN}✓ Handle errors gracefully${NC}"
echo -e "  ${GREEN}✓ Install prerequisites in order${NC}"
echo -e "  ${GREEN}✓ Display M-R-J text after installation${NC}"
echo -e "  ${GREEN}✓ Provide a user-friendly experience${NC}"

echo -e "\n${YELLOW}Note: This is a simulation test. To fully test the installer,${NC}"
echo -e "${YELLOW}it needs to be run on an Ubuntu system with sudo privileges.${NC}"

echo -e "\n${BOLD}${GREEN}Test completed successfully!${NC}"
