# Yarn 미리 준비 (첫 실행 시 Corepack 다운로드 프롬프트 방지)
echo "Preparing Yarn via Corepack..."
# . ${NVM_DIR:-/usr/local/share/nvm}/nvm.sh 2>/dev/null || true
corepack enable
corepack prepare yarn@1.22.22 --activate

yarn -v

# NestJS CLI 설치
echo "Installing NestJS CLI..."
npm install -g @nestjs/cli@11.0.7

