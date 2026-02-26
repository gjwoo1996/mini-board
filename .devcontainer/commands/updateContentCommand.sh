#!/usr/bin/env bash

echo "🔄 Changing owner of directories $DIR_PATHS_TO_CHANGE_OWNER to $USER"
sudo chown -R $USER:$USER $DIR_PATHS_TO_CHANGE_OWNER

echo "🔄 Updating apt package manager"
sudo apt update -y
sudo apt upgrade -y

echo "🔄 Installing apt packages"
sudo apt install -y \
    netcat-openbsd \
    iputils-ping \
    parallel

# install_npm_packages() {
#     echo "🔄 Installing global npm packages"
#     npm install -g \ 
#         npm@latest
# }

# export -f install_npm_packages
# parallel --jobs 10 ::: install_npm_packages

# echo "🔄 Start synchronization"
# ./.devcontainer/commands/common/synchronizeProject.sh