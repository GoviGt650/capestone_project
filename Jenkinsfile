pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        AWS_REGION = "eu-north-1"
        ACCOUNT_ID = "291159641797"
        REPO_NAME = "multi-backend-app"
        ECR = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}"
        EC2_IP = "10.0.2.50"
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/GoviGt650/capestone_project.git'
            }
        }

        stage('Login to ECR') {
            steps {
                sh '''
                aws ecr get-login-password --region $AWS_REGION \
                | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
                '''
            }
        }

        stage('Build & Push Images') {
            steps {
                sh '''
                docker build -t node ./backend/node-app
                docker tag node:latest $ECR:node
                docker push $ECR:node

                docker build -t django ./backend/django-app
                docker tag django:latest $ECR:django
                docker push $ECR:django

                docker build -t fastapi ./backend/fastapi-app
                docker tag fastapi:latest $ECR:fastapi
                docker push $ECR:fastapi

                docker build -t dotnet ./backend/dotnet-app
                docker tag dotnet:latest $ECR:dotnet
                docker push $ECR:dotnet
                '''
            }
        }

        stage('Copy Configs to EC2') {
            steps {
                sshagent(['ec2-ssh-key']) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no ubuntu@$EC2_IP "mkdir -p ~/monitoring/blackbox ~/nginx ~/database"
                    scp -o StrictHostKeyChecking=no docker-compose.yml ubuntu@$EC2_IP:~/docker-compose.yml
                    scp -o StrictHostKeyChecking=no load-secrets.sh ubuntu@$EC2_IP:~/load-secrets.sh
                    scp -o StrictHostKeyChecking=no nginx/nginx.conf ubuntu@$EC2_IP:~/nginx/nginx.conf
                    scp -o StrictHostKeyChecking=no monitoring/prometheus.yml ubuntu@$EC2_IP:~/monitoring/prometheus.yml
                    scp -o StrictHostKeyChecking=no monitoring/alerts.yml ubuntu@$EC2_IP:~/monitoring/alerts.yml
                    scp -o StrictHostKeyChecking=no monitoring/datasources.yml ubuntu@$EC2_IP:~/monitoring/datasources.yml
                    scp -o StrictHostKeyChecking=no monitoring/dashboard-provider.yml ubuntu@$EC2_IP:~/monitoring/dashboard-provider.yml
                    scp -o StrictHostKeyChecking=no monitoring/comprehensive-dashboard.json ubuntu@$EC2_IP:~/monitoring/comprehensive-dashboard.json
                    scp -o StrictHostKeyChecking=no monitoring/blackbox/blackbox.yml ubuntu@$EC2_IP:~/monitoring/blackbox/blackbox.yml
                    scp -o StrictHostKeyChecking=no database/db_migration.py ubuntu@$EC2_IP:~/database/db_migration.py
                    '''
                }
            }
        }

        stage('Deploy to Private EC2') {
            steps {
                sshagent(['ec2-ssh-key']) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no ubuntu@$EC2_IP "
                        set -e &&
                        cd ~ &&
                        aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com &&
                        ./load-secrets.sh &&
                        docker compose pull &&
                        docker compose up -d --remove-orphans &&
                        sleep 10 &&
                        docker compose restart nginx &&
                        echo 🚀 Deployment successful
                    "
                    '''
                }
            }
        }

        stage('Run DB Migration') {
            steps {
                sshagent(['ec2-ssh-key']) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no ubuntu@$EC2_IP "
                        cd ~ &&
                        sudo mkdir -p /var/log/db-migration &&
                        python3 database/db_migration.py || echo '⚠️ Migration skipped'
                    "
                    '''
                }
            }
        }
    }
}
