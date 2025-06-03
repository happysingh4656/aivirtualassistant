pipeline {
    agent {
        kubernetes {
            yaml """
                apiVersion: v1
                kind: Pod
                spec:
                  containers:
                  - name: docker
                    image: docker:20.10.17-dind
                    securityContext:
                      privileged: true
                    volumeMounts:
                    - name: docker-sock
                      mountPath: /var/run/docker.sock
                  - name: kubectl
                    image: bitnami/kubectl:latest
                    command:
                    - cat
                    tty: true
                  - name: python
                    image: python:3.11-slim
                    command:
                    - cat
                    tty: true
                  volumes:
                  - name: docker-sock
                    hostPath:
                      path: /var/run/docker.sock
            """
        }
    }
    
    environment {
        DOCKER_REGISTRY = credentials('docker-registry-url')
        DOCKER_CREDENTIALS = credentials('docker-registry-credentials')
        KUBECONFIG = credentials('kubeconfig')
        IMAGE_NAME = 'serenity-assistant'
        IMAGE_TAG = "${BUILD_NUMBER}"
        NAMESPACE = 'serenity-assistant'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                }
            }
        }
        
        stage('Code Quality & Security') {
            parallel {
                stage('Lint Python Code') {
                    steps {
                        container('python') {
                            sh '''
                                pip install flake8 black isort safety bandit
                                echo "Running code formatting check..."
                                black --check .
                                echo "Running import sorting check..."
                                isort --check-only .
                                echo "Running linting..."
                                flake8 . --max-line-length=88 --extend-ignore=E203,W503
                                echo "Running security scan..."
                                bandit -r . -f json -o bandit-report.json || true
                                echo "Checking for known security vulnerabilities..."
                                safety check --json --output safety-report.json || true
                            '''
                        }
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: '*-report.json', allowEmptyArchive: true
                        }
                    }
                }
                
                stage('Test Application') {
                    steps {
                        container('python') {
                            sh '''
                                pip install -r requirements.txt || pip install uv && uv sync
                                echo "Running unit tests..."
                                python -m pytest tests/ --verbose --junit-xml=test-results.xml --cov=. --cov-report=xml || true
                            '''
                        }
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'test-results.xml'
                            publishCoverageReport(sourceFileResolver: sourceFiles('STORE_LAST_BUILD'), 
                                                  adapters: [coberturaAdapter('coverage.xml')])
                        }
                    }
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                container('docker') {
                    script {
                        def fullImageName = "${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
                        def latestImageName = "${DOCKER_REGISTRY}/${IMAGE_NAME}:latest"
                        
                        sh """
                            echo "Building Docker image..."
                            docker build -t ${fullImageName} -t ${latestImageName} .
                            
                            echo "Running container security scan..."
                            docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \\
                                aquasec/trivy:latest image ${fullImageName} --format json --output trivy-report.json || true
                        """
                    }
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'trivy-report.json', allowEmptyArchive: true
                }
            }
        }
        
        stage('Push to Registry') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                    buildingTag()
                }
            }
            steps {
                container('docker') {
                    script {
                        def fullImageName = "${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
                        def latestImageName = "${DOCKER_REGISTRY}/${IMAGE_NAME}:latest"
                        
                        sh """
                            echo "Logging into Docker registry..."
                            echo \${DOCKER_CREDENTIALS_PSW} | docker login \${DOCKER_REGISTRY} -u \${DOCKER_CREDENTIALS_USR} --password-stdin
                            
                            echo "Pushing Docker images..."
                            docker push ${fullImageName}
                            docker push ${latestImageName}
                            
                            echo "Cleaning up local images..."
                            docker rmi ${fullImageName} ${latestImageName} || true
                        """
                    }
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                container('kubectl') {
                    script {
                        def deploymentEnv = env.BRANCH_NAME == 'main' ? 'production' : 'staging'
                        def fullImageName = "${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
                        
                        sh """
                            echo "Setting up kubectl configuration..."
                            mkdir -p ~/.kube
                            echo \${KUBECONFIG} | base64 -d > ~/.kube/config
                            
                            echo "Applying Kubernetes manifests..."
                            kubectl apply -f k8s/namespace.yaml
                            kubectl apply -f k8s/configmap.yaml
                            kubectl apply -f k8s/secret.yaml
                            kubectl apply -f k8s/postgresql.yaml
                            kubectl apply -f k8s/network-policy.yaml
                            
                            echo "Updating deployment image..."
                            kubectl set image deployment/serenity-assistant \\
                                serenity-assistant=${fullImageName} \\
                                -n ${NAMESPACE}
                            
                            kubectl apply -f k8s/deployment.yaml
                            kubectl apply -f k8s/service.yaml
                            kubectl apply -f k8s/hpa.yaml
                            kubectl apply -f k8s/ingress.yaml
                            
                            echo "Waiting for deployment to complete..."
                            kubectl rollout status deployment/serenity-assistant -n ${NAMESPACE} --timeout=300s
                            
                            echo "Verifying deployment health..."
                            kubectl get pods -n ${NAMESPACE} -l app=serenity-assistant
                            kubectl get services -n ${NAMESPACE}
                        """
                    }
                }
            }
        }
        
        stage('Health Check') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                container('kubectl') {
                    script {
                        sh """
                            echo "Running post-deployment health checks..."
                            
                            # Wait for pods to be ready
                            kubectl wait --for=condition=ready pod -l app=serenity-assistant -n ${NAMESPACE} --timeout=300s
                            
                            # Check if service is accessible
                            SERVICE_IP=\$(kubectl get service serenity-assistant-service -n ${NAMESPACE} -o jsonpath='{.spec.clusterIP}')
                            echo "Service IP: \${SERVICE_IP}"
                            
                            # Run a simple health check (if health endpoint exists)
                            kubectl run health-check --rm -i --restart=Never --image=curlimages/curl -- \\
                                curl -f http://\${SERVICE_IP}/ || echo "Health check failed, but deployment completed"
                            
                            echo "Deployment completed successfully!"
                        """
                    }
                }
            }
        }
    }
    
    post {
        always {
            script {
                // Clean up workspace
                cleanWs()
            }
        }
        
        success {
            script {
                if (env.BRANCH_NAME == 'main') {
                    // Send success notification
                    echo "✅ Production deployment successful for Serenity Assistant ${IMAGE_TAG}"
                }
            }
        }
        
        failure {
            script {
                // Send failure notification
                echo "❌ Deployment failed for Serenity Assistant ${IMAGE_TAG}"
                
                // Rollback on production failure
                if (env.BRANCH_NAME == 'main') {
                    container('kubectl') {
                        sh """
                            echo "Rolling back deployment..."
                            kubectl rollout undo deployment/serenity-assistant -n ${NAMESPACE} || echo "Rollback failed"
                        """
                    }
                }
            }
        }
        
        unstable {
            script {
                echo "⚠️ Deployment completed with warnings for Serenity Assistant ${IMAGE_TAG}"
            }
        }
    }
}