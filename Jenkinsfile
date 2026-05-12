pipeline {

    agent any

    triggers {
        githubPush()
    }

    parameters {
        choice(
            name: 'ACTION',
            choices: ['deploy', 'rollback'],
            description: 'Choose deployment action'
        )
        choice(
            name: 'SERVICE',
            choices: ['all', 'node', 'django', 'fastapi', 'dotnet', 'nginx', 'monitoring'],
            description: 'Select service to deploy or rollback'
        )
        string(
            name: 'ROLLBACK_TAG',
            defaultValue: '',
            description: 'Enter previous build number for rollback example: 25'
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

        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/GoviGt650/capestone_project.git'
            }
        }

        stage('Login To AWS ECR') {
            when {
                expression { params.ACTION == 'deploy' && params.SERVICE != 'monitoring' }
            }
            steps {
                sh """
                    aws ecr get-login-password --region ${AWS_REGION} \
                    | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                """
            }
        }

        stage('Build And Push Docker Images') {
            when {
                expression { params.ACTION == 'deploy' && params.SERVICE != 'monitoring' && params.SERVICE != 'nginx' }
            }
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
                            echo "Building ${service}"
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
                        scp -o StrictHostKeyChecking=no docker-compose.yml ubuntu@${EC2_IP}:~/docker-compose.yml
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
            when {
                expression { params.ACTION == 'deploy' }
            }
            steps {
                sshagent(['ec2-ssh-key']) {
                    script {
                        if (params.SERVICE == 'monitoring') {
                            sh """
                                ssh -o StrictHostKeyChecking=no ubuntu@${EC2_IP} '
                                    cd ~
                                    docker compose up -d --remove-orphans prometheus grafana alertmanager node_exporter cadvisor nginx-exporter blackbox
                                    sleep 5
                                    ./fix-blackbox.sh
                                    echo "Monitoring Stack Deployed"
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
                                    
                                    # STEP 1: Start monitoring first (if not running)
                                    docker compose up -d --remove-orphans prometheus grafana alertmanager node_exporter cadvisor nginx-exporter blackbox
                                    sleep 10
                                    
                                    # STEP 2: Start backend services
                                    docker compose pull ${params.SERVICE == 'all' ? '' : params.SERVICE}
                                    docker compose up -d --remove-orphans ${params.SERVICE == 'all' ? '' : params.SERVICE}
                                    sleep 10
                                    
                                    # STEP 3: Restart nginx to pick up new backend IPs
                                    docker compose restart nginx
                                    sleep 5
                                    
                                    # STEP 4: Fix blackbox with new nginx IP
                                    chmod +x fix-blackbox.sh
                                    ./fix-blackbox.sh
                                    
                                    docker compose ps
                                    echo "Deployment Complete - Build: ${BUILD_NUMBER}"
                                '
                            """
                        }
                    }
                }
            }
        }

        stage('Rollback Service') {
            when {
                expression { params.ACTION == 'rollback' }
            }
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
                            
                            docker compose up -d
                            sleep 5
                            docker compose restart nginx
                            ./fix-blackbox.sh
                            echo "Rollback to Build ${params.ROLLBACK_TAG} Complete"
                        '
                    """
                }
            }
        }

        stage('Run Database Migration') {
            when {
                expression { params.ACTION == 'deploy' && (params.SERVICE == 'all' || params.SERVICE == 'django') }
            }
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
        success { echo "Build ${BUILD_NUMBER} Completed Successfully!" }
        failure { echo "Build ${BUILD_NUMBER} Failed!" }
        always  { echo "Pipeline Execution Finished" }
    }
}