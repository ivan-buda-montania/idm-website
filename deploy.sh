#!/usr/bin/env bash
# Builds the site and deploys it through the CDK stacks (S3 + CloudFront on idminternacional.com).
# The bucket has no fixed name and the stack's BucketDeployment uploads dist/ and invalidates CloudFront,
# so this needs the montania profile (the montania-deploy role can't run CloudFormation).
set -euo pipefail
cd "$(dirname "$0")"

export AWS_PROFILE=montania
export AWS_REGION=us-east-1

if ! aws sts get-caller-identity >/dev/null 2>&1; then
  echo "AWS session for profile '$AWS_PROFILE' is missing or expired. Run: aws login --profile $AWS_PROFILE" >&2
  exit 1
fi

if [[ ! -d infra/node_modules ]]; then
  echo "==> Installing infra dependencies..."
  npm --prefix infra ci
fi

echo "==> Building..."
npm run build

echo "==> Deploying stacks..."
npm --prefix infra run deploy -- --require-approval never

# The Markdown twins must be served as text/markdown for content negotiation to work.
echo "==> Setting Markdown content type..."
BUCKET=$(aws cloudformation describe-stacks --stack-name IdmWebsiteProd \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" --output text)
aws s3 cp dist/md "s3://$BUCKET/md" --recursive --content-type "text/markdown; charset=utf-8" \
  --cache-control "public, max-age=3600" --only-show-errors

echo "==> Done. https://idminternacional.com"
