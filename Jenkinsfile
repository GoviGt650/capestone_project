pipeline {

    agent any

    triggers {
        githubPush()
    }

    parameters {
        choice(name: 'ACTION', choices: ['deploy', 'rollback'], description: 'Choose deployment action')
        choice(name: 'SERVICE', choices: ['all', 'node', 'django', 'fastapi', 'dotnet', 'monitoring'], description: 'Select service')
        string(name: 'ROLLBACK_TAG', defaultValue: '', description: 'Enter build number for rollback')
    }

    environment {
        AWS_REGION = "eu-north-1"
        ACCOUNT_ID = "291159641797"
        REPO_NAME = "multi-backend-app"
        ECR = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}"
        EC2_IP = "10.0.2.50"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/GoviGt650/capestone_project.git'
            }
        }

        stage('Login To AWS ECR') {
            when { expression { params.ACTION == 'deploy' && params.SERVICE != 'monitoring' } }
            steps {
                sh """
                    aws ecr get-login-password --region ${AWS_REGION} \
                    | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                """
            }
        }

        stage('Build And Push Docker Images') {
            when { expression { params.ACTION == 'deploy' && params.SERVICE != 'monitoring' } }
            steps {
                script {
                    def services = [
                        node    : './backend/node-app',
                        django  : './backend/django-app',
                        fastapi : './backend/fastapi-app',
                        dotnet  : './backend/dotnet-app'
                    ]
                    def targets = (params.SERVICE == 'all') ? services.keySet() : [params.SERVICE]
                    targets.each { service ->
                        sh """
                            docker build -t ${service} ${services[service]}
                            docker tag ${service}:latest ${ECR}:${service}-latest
                            docker tag ${service}:latest ${ECR}:${service}-${BUILD_NUMBER}
                            docker push ${ECR}:${service}-latest
                            docker push ${ECR}:${service}-${BUILD_NUMBER}
                        """
                    }
                }
            }
        }

        stage('Copy Files To EC2') {
            steps {
                sshagent(['ec2-ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ubuntu@${EC2_IP} '
                            mkdir -p ~/monitoring/blackbox ~/nginx ~/database
                        '
                        scp -o StrictHostKeyChecking=no docker-compose.app.yml ubuntu@${EC2_IP}:~/docker-compose.app.yml
                        scp -o StrictHostKeyChecking=no docker-compose.monitoring.yml ubuntu@${EC2_IP}:~/docker-compose.monitoring.yml
                        scp -o StrictHostKeyChecking=no load-secrets.sh ubuntu@${EC2_IP}:~/load-secrets.sh
                        scp -o StrictHostKeyChecking=no fix-blackbox.sh ubuntu@${EC2_IP}:~/fix-blackbox.sh
                        scp -o StrictHostKeyChecking=no nginx/nginx.conf ubuntu@${EC2_IP}:~/nginx/nginx.conf
                        scp -o StrictHostKeyChecking=no monitoring/prometheus.yml ubuntu@${EC2_IP}:~/monitoring/prometheus.yml
                        scp -o StrictHostKeyChecking=no monitoring/alerts.yml ubuntu@${EC2_IP}:~/monitoring/alerts.yml
                        scp -o StrictHostKeyChecking=no monitoring/datasources.yml ubuntu@${EC2_IP}:~/monitoring/datasources.yml
                        scp -o StrictHostKeyChecking=no monitoring/dashboard-provider.yml ubuntu@${EC2_IP}:~/monitoring/dashboard-provider.yml
                        scp -o StrictHostKeyChecking=no monitoring/comprehensive-dashboard.json ubuntu@${EC2_IP}:~/monitoring/comprehensive-dashboard.json
                        scp -o StrictHostKeyChecking=no monitoring/blackbox/blackbox.yml ubuntu@${EC2_IP}:~/monitoring/blackbox/blackbox.yml
                        scp -o StrictHostKeyChecking=no database/db_migration.py ubuntu@${EC2_IP}:~/database/db_migration.py
                    """
                }
            }
        }

        stage('Deploy Services') {
            when { expression { params.ACTION == 'deploy' } }
            steps {
                sshagent(['ec2-ssh-key']) {
                    script {
                        if (params.SERVICE == 'monitoring') {
                            sh """
                                ssh -o StrictHostKeyChecking=no ubuntu@${EC2_IP} '
                                    cd ~
                                    docker compose -f docker-compose.monitoring.yml up -d --remove-orphans
                                    sleep 5
                                    ./fix-blackbox.sh
                                    echo "Monitoring Deployed"
                                '
                            """
                        } else {
                            sh """
                                ssh -o StrictHostKeyChecking=no ubuntu@${EC2_IP} '
                                    set -e
                                    cd ~
                                    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                                    chmod +x load-secrets.sh
                                    ./load-secrets.sh
                                    
                                    # STEP 1: Start monitoring first
                                    docker compose -f docker-compose.monitoring.yml up -d --remove-orphans
                                    sleep 10
                                    
                                    # STEP 2: Start app services
                                    docker compose -f docker-compose.app.yml up -d --remove-orphans
                                    sleep 10
                                    
                                    # STEP 3: Fix blackbox
                                    chmod +x fix-blackbox.sh
                                    ./fix-blackbox.sh
                                    
                                    docker compose -f docker-compose.app.yml ps
                                    docker compose -f docker-compose.monitoring.yml ps
                                    echo "Deployed Build: ${BUILD_NUMBER}"
                                '
                            """
                        }
                    }
                }
            }
        }

        stage('Rollback Service') {
            when { expression { params.ACTION == 'rollback' } }
            steps {
                sshagent(['ec2-ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ubuntu@${EC2_IP} '
                            cd ~
                            aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                            
                            if [ "${params.SERVICE}" = "all" ]; then
                                for svc in node django fastapi dotnet; do
                                    docker pull ${ECR}:\${svc}-${params.ROLLBACK_TAG}
                                    docker tag ${ECR}:\${svc}-${params.ROLLBACK_TAG} ${ECR}:\${svc}-latest
                                done
                            else
                                docker pull ${ECR}:${params.SERVICE}-${params.ROLLBACK_TAG}
                                docker tag ${ECR}:${params.SERVICE}-${params.ROLLBACK_TAG} ${ECR}:${params.SERVICE}-latest
                            fi
                            
                            docker compose -f docker-compose.monitoring.yml up -d --remove-orphans
                            docker compose -f docker-compose.app.yml up -d --remove-orphans
                            ./fix-blackbox.sh
                            echo "Rollback to ${params.ROLLBACK_TAG} Done"
                        '
                    """
                }
            }
        }

        stage('Run Database Migration') {
            when { expression { params.ACTION == 'deploy' && params.SERVICE == 'all' } }
            steps {
                sshagent(['ec2-ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ubuntu@${EC2_IP} '
                            cd ~
                            sudo mkdir -p /var/log/db-migration
                            python3 database/db_migration.py || echo "Migration Skipped"
                        '
                    """
                }
            }
        }
    }

    post {
        success { echo "Build ${BUILD_NUMBER} Completed!" }
        failure { echo "Build ${BUILD_NUMBER} Failed!" }
        always  { echo "Pipeline Finished" }
    }
}