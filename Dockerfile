# --- Build Stage ---
FROM python:3.13-alpine AS builder
RUN apk update && \
    apk add --no-cache rsync git nodejs npm bash curl gcc musl-dev python3-dev libffi-dev openssl-dev
RUN pip install --no-cache-dir pipenv
WORKDIR /app
COPY Pipfile Pipfile.lock ./
RUN pipenv install --deploy --ignore-pipfile
COPY . .
RUN pipenv run mkdocs build

# --- Nginx Stage ---
FROM nginx:alpine
COPY --from=builder /app/site/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
