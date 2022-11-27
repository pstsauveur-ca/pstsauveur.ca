#!/bin/bash

secret_id="strapi_secrets"

entries=$(aws secretsmanager get-secret-value \
  --secret-id "$secret_id" \
  --query SecretString \
  --output text \
  | jq -r "to_entries|map(\"\(.key)=\(.value|tostring)\")|.[]"
)

for key_value in $entries; do
  export "$key_value"
done
