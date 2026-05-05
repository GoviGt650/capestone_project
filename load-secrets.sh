#!/bin/bash

SECRET_JSON=$(aws secretsmanager get-secret-value \
  --secret-id capstone-project-secrets \
  --region eu-north-1 \
  --query SecretString \
  --output text)

export DB_HOST=$(echo $SECRET_JSON | jq -r .DB_HOST)
export DB_PORT=$(echo $SECRET_JSON | jq -r .DB_PORT)
export DB_NAME=$(echo $SECRET_JSON | jq -r .DB_NAME)
export DB_USER=$(echo $SECRET_JSON | jq -r .DB_USER)
export DB_PASSWORD=$(echo $SECRET_JSON | jq -r .DB_PASSWORD)
export ECR=$(echo $SECRET_JSON | jq -r .ECR)

echo "✅ Secrets loaded successfully"
