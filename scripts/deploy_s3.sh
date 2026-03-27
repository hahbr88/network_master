#!/bin/sh

set -eu
export AWS_PAGER=""

if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI가 설치되어 있지 않습니다."
  exit 1
fi

if [ ! -d "dist" ]; then
  echo "dist/ 폴더가 없습니다. 먼저 npm run build 를 실행하세요."
  exit 1
fi

if [ -z "${AWS_S3_BUCKET:-}" ]; then
  echo "AWS_S3_BUCKET 환경변수가 필요합니다."
  exit 1
fi

echo "S3 업로드 시작: s3://${AWS_S3_BUCKET}"
aws s3 sync dist/ "s3://${AWS_S3_BUCKET}" --delete

if [ -n "${AWS_CLOUDFRONT_DISTRIBUTION_ID:-}" ]; then
  echo "CloudFront 캐시 무효화 시작: ${AWS_CLOUDFRONT_DISTRIBUTION_ID}"
  aws cloudfront create-invalidation \
    --distribution-id "${AWS_CLOUDFRONT_DISTRIBUTION_ID}" \
    --paths '/*'
else
  echo "AWS_CLOUDFRONT_DISTRIBUTION_ID 가 없어 CloudFront 무효화는 건너뜁니다."
fi

echo "배포 완료"
