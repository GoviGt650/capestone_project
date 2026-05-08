pipeline {

    agent any

    triggers {
        githubPush()
    }

    parameters {
        choice(
            name: 'SERVICE',
            choices: ['all', 'node', 'django', 'fastapi', 'dotnet', 'monitoring'],
            description: 'Select service to deploy'
        )
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

                git branch: 'main',
                url: 'https://github.com/GoviGt650/capestone_project.git'
            }
        }

        stage('Login to ECR') {

            steps {

                sh '''
                aws ecr get-login-password --region $AWS_REGION \
                | docker login --username AWS --password-stdin \
                $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
                '''
            }
        }

        stage('Build & Push Selected Service') {

            when {
                expression {
                    params.SERVICE != 'monitoring'
                }
            }

            steps {

                script {

                    def services = [
                        node    : './backend/node-app',
                        django  : './backend/django-app',
                        fastapi : './backend/fastapi-app',
                        dotnet  : './backend/dotnet-app'
                    ]

                    if (params.SERVICE == 'all') {

                        services.each { service, path ->

                            sh """
                            docker build -t ${service} ${path}

                            docker tag ${service}:latest $ECR:${service}-latest
                            docker tag ${service}:latest $ECR:${service}-${BUILD_NUMBER}

                            docker push $ECR:${service}-latest
                            docker push $ECR:${service}-${BUILD_NUMBER}
                            """
                        }

                    } else {

                        def path = services[params.SERVICE]

                        sh """
                        docker build -t ${params.SERVICE} ${path}

                        docker tag ${params.SERVICE}:latest $ECR:${params.SERVICE}-latest
                        docker tag ${params.SERVICE}:latest $ECR:${params.SERVICE}-${BUILD_NUMBER}

                        docker push $ECR:${params.SERVICE}-latest
                        docker push $ECR:${params.SERVICE}-${BUILD_NUMBER}
                        """
                    }
                }
            }
        }

        stage('Copy Configs to EC2') {

            steps {

                sshagent(['ec2-ssh-key']) {

                    sh '''
                    ssh -o StrictHostKeyChecking=no ubuntu@$EC2_IP "
                        mkdir -p ~/monitoring/blackbox ~/nginx ~/database
                    "

                    scp -o StrictHostKeyChecking=no docker-compose.app.yml ubuntu@$EC2_IP:~/docker-compose.app.yml

                    scp -o StrictHostKeyChecking=no docker-compose.monitoring.yml ubuntu@$EC2_IP:~/docker-compose.monitoring.yml

                    scp -o StrictHostKeyChecking=no load-secrets.sh ubuntu@$EC2_IP:~/load-secrets.sh

                    scp -o StrictHostKeyChecking=no nginx/nginx.conf ubuntu@$EC2_IP:~/nginx/nginx.conf

                    scp -o StrictHostKeyChecking=no fix-blackbox.sh ubuntu@$EC2_IP:~/fix-blackbox.sh

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

        stage('Deploy Selected Service') {

            steps {

                sshagent(['ec2-ssh-key']) {

                    script {

                        if (params.SERVICE == 'monitoring') {

                            sh """
                            ssh -o StrictHostKeyChecking=no ubuntu@$EC2_IP '

                                docker network create monitoring-net || true

                                cd ~

                                docker compose -f docker-compose.monitoring.yml pull

                                docker compose -f docker-compose.monitoring.yml up -d

                                echo "Monitoring Stack Deployed"
                            '
                            """

                        } else if (params.SERVICE == 'all') {

                            sh """
                            ssh -o StrictHostKeyChecking=no ubuntu@$EC2_IP '

                                docker network create monitoring-net || true

                                cd ~

                                aws ecr get-login-password --region $AWS_REGION \
                                | docker login --username AWS --password-stdin \
                                $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

                                chmod +x load-secrets.sh

                                ./load-secrets.sh

                                docker compose -f docker-compose.app.yml pull

                                docker compose -f docker-compose.app.yml up -d --remove-orphans

                                sleep 10

                                docker compose -f docker-compose.app.yml restart nginx

                                chmod +x fix-blackbox.sh

                                ./fix-blackbox.sh

                                echo "All Services Deployed"
                            '
                            """

                        } else {

                            sh """
                            ssh -o StrictHostKeyChecking=no ubuntu@$EC2_IP '

                                docker network create monitoring-net || true

                                cd ~

                                aws ecr get-login-password --region $AWS_REGION \
                                | docker login --username AWS --password-stdin \
                                $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

                                chmod +x load-secrets.sh

                                ./load-secrets.sh

                                docker compose -f docker-compose.app.yml pull ${params.SERVICE}

                                docker compose -f docker-compose.app.yml up -d ${params.SERVICE}

                                sleep 5

                                docker compose -f docker-compose.app.yml ps

                                echo "${params.SERVICE} Service Deployed"
                            '
                            """
                        }
                    }
                }
            }
        }

        stage('Run DB Migration') {

            when {
                expression {
                    params.SERVICE == 'all'
                }
            }

            steps {

                sshagent(['ec2-ssh-key']) {

                    sh '''
                    ssh -o StrictHostKeyChecking=no ubuntu@$EC2_IP "

                        cd ~

                        sudo mkdir -p /var/log/db-migration

                        python3 database/db_migration.py \
                        || echo 'Migration skipped'
                    "
                    '''
                }
            }
        }
    }

    post {

        success {

            echo "Build ${BUILD_NUMBER} completed successfully!"
        }

        failure {

            echo "Build ${BUILD_NUMBER} failed!"
        }
    }
}