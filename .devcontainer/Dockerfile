#Minimal debian configured to user have passwordless sudo just like official devcontainer
#Default devcontainer dockerfile. See devcontainer.json what Dockerfile is used. Oherwise delete or ignore.
#TODO: update/remove/delete this according to repo requirements
FROM golang:1.24-bookworm

# Prevent interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Install essential base tools, sudo, and create non-root user
RUN apt-get update && apt-get install -y --no-install-recommends \
    sudo \
    git \
    curl \
    wget \
    procps \
    ca-certificates \
    && useradd -m -s /bin/bash vscode \
    && echo "vscode ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set default user to vscode
USER vscode

# Add permanent tools or dependencies below this line (running as vscode user or root if needed)
# Example: RUN sudo apt-get update && sudo apt-get install -y python3

# Rebuild the container after changes: Ctrl+Shift+P → Rebuild Container