pipeline {
    agent any

    environment {
        AWS_REGION = "eu-north-1"
        ACCOUNT_ID = "291159641797"
        REPO_NAME = "multi-backend-app"
        ECR = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}"
    }

    stages {

        

        stage('Login to ECR') {
            steps {
                sh '''
                aws ecr get-login-password --region $AWS_REGION \
                | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
                '''
            }
        }

        stage('Build & Push Node') {
            steps {
                sh '''
                docker build -t node ./backend/node-app
                docker tag node:latest $ECR:node
                docker push $ECR:node
                '''
            }
        }

        stage('Build & Push Django') {
            steps {
                sh '''
                docker build -t django ./backend/django-app
                docker tag django:latest $ECR:django
                docker push $ECR:django
                '''
            }
        }

        stage('Build & Push FastAPI') {
            steps {
                sh '''
                docker build -t fastapi ./backend/fastapi-app
                docker tag fastapi:latest $ECR:fastapi
                docker push $ECR:fastapi
                '''
            }
        }

        stage('Build & Push DotNet') {
            steps {
                sh '''
                docker build -t dotnet ./backend/dotnet-app
                docker tag dotnet:latest $ECR:dotnet
                docker push $ECR:dotnet
                '''
            }
        }

        stage('Build & Push Nginx') {
            steps {
                sh '''
                docker build -t nginx -f nginx/Dockerfile .
                docker tag nginx:latest $ECR:nginx
                docker push $ECR:nginx
                '''
            }
        }
    }
}