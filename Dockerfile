FROM python:3.9-alpine as builder

# Install system dependencies
RUN apk update && \
    apk add --no-cache rsync git nodejs npm bash

# Create a non-root user and group
RUN addgroup -S mkdocs && \
    adduser -S -G mkdocs mkdocs
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt --no-cache-dir
COPY . /app
RUN chown -R mkdocs:mkdocs /app
USER mkdocs
RUN mkdocs build

# Use a multi-stage build to reduce image size
FROM nginx:alpine
COPY --from=builder /app/site /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]