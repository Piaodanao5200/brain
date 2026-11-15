# 构建上下文是项目根目录：docker build -f deploy/Dockerfile .
FROM node:22-alpine

WORKDIR /app

# 零依赖，不需要 npm install
COPY package.json ./
COPY server ./server
COPY bin ./bin
COPY scripts ./scripts
COPY vault ./vault

ENV PORT=8787 \
    KB_VAULT=/app/vault \
    NODE_ENV=production

EXPOSE 8787

# 非 root 运行
RUN addgroup -S kb && adduser -S kb -G kb && chown -R kb:kb /app
USER kb

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/mcp-server.mjs"]
