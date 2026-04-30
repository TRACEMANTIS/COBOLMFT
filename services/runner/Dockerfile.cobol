FROM debian:stable-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    gnucobol \
    libvbisam-dev \
    && rm -rf /var/lib/apt/lists/*
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
WORKDIR /work
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
