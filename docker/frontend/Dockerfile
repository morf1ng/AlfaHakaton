FROM nginx:1.27-alpine

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html

COPY index.html ./
COPY scripts ./scripts
COPY styles ./styles
COPY images ./images

EXPOSE 80
