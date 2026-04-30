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

                docker build -t nginx -f nginx/Dockerfile .
                docker tag nginx:latest $ECR:nginx
                docker push $ECR:nginx
                '''
            }
        }

        stage('Deploy to Private EC2') {
            steps {
                sshagent(['ec2-ssh-key']) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no ubuntu@$EC2_IP << EOF
                    set -e

                    cd ~

                    ./load-secrets.sh

                    docker compose pull
                    docker compose up -d --remove-orphans

                    echo "🚀 Deployment successful"

        EOF
                    '''
                }
            }
        }
    }
}



//added commet