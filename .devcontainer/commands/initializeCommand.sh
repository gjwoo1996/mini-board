#!/usr/bin/env bash

# DevContainer Arguments
localWorkspaceFolder=$1  
containerWorkspaceFolder=$2 
localWorkspaceFolderBasename=$3   
containerWorkspaceFolderBasename=$4   

MERGED_ENV_FILE_PATH=.devcontainer/.env

# Create docker-compose.deb.yml arg
cat > $MERGED_ENV_FILE_PATH <<EOL
# Original DevContainer Arguments
localWorkspaceFolder=$localWorkspaceFolder
containerWorkspaceFolder=$containerWorkspaceFolder
localWorkspaceFolderBasename=$localWorkspaceFolderBasename
containerWorkspaceFolderBasename=$containerWorkspaceFolderBasename 


# Named Volume Arguments
# CONTAINER_NODE_MODULES_DIR_PATH=${containerWorkspaceFolder}/node_modules

# Etc Arguments
# devConDatabaseRootPassword = devConDatabaseRootPassword
# devConDatabaseUser = devConDatabaseUser
# devConDatabasePassword = devConDatabasePassword
# devConDatabaseName = devConDatabaseName

# devConElasticsearchPassword = devConElasticsearchPassword

# devConSftpPassword = devConSftpPassword
# devConSftpUser = devConSftpUser

EOL

# Make all derived sh files executable
# chmod +x ./.devcontainer/commands/common/*.sh