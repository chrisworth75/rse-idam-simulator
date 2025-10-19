pipeline {
    agent any

    environment {
        REGISTRY = 'localhost:5000'
        IMAGE_NAME = 'rse-idam-simulator'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'echo "Checked out RSE IDAM Simulator code successfully"'
            }
        }

        stage('Build & Test') {
            steps {
                script {
                    // Clean and build the application
                    sh './gradlew clean build'

                    // Run tests and generate reports
                    sh './gradlew test jacocoTestReport'
                }
            }
            post {
                always {
                    // Archive test results
                    junit testResults: 'build/test-results/test/*.xml', allowEmptyResults: true

                    // Archive coverage reports
                    archiveArtifacts artifacts: 'build/reports/**/*', allowEmptyArchive: true, fingerprint: true

                    // Publish HTML test reports
                    publishHTML([
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'build/reports/tests/test',
                        reportFiles: 'index.html',
                        reportName: 'Test Report',
                        reportTitles: 'Unit Test Results'
                    ])

                    // Publish coverage reports
                    publishHTML([
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'build/reports/jacoco/test/html',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report',
                        reportTitles: 'Code Coverage Results'
                    ])
                }
            }
        }

        stage('Archive Build Artifacts') {
            steps {
                archiveArtifacts artifacts: 'build/postman/*.postman_collection.json', fingerprint: true, allowEmptyArchive: true
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def image = docker.build("${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}")
                    docker.withRegistry("http://${REGISTRY}") {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Kill any process using port 5556
                    sh """
                        echo "Killing any process using port 5556..."
                        lsof -ti:5556 | xargs kill -9 || true
                    """

                    // Stop existing container if running
                    sh """
                        docker stop ${IMAGE_NAME} || true
                        docker rm ${IMAGE_NAME} || true
                    """

                    // Run new container on port 5556
                    sh """
                        docker run -d \\
                        --name ${IMAGE_NAME} \\
                        --restart unless-stopped \\
                        -p 5556:5556 \\
                        ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}
                    """
                }
            }
        }

        stage('Health Check') {
            when {
                branch 'main'
            }
            steps {
                script {
                    sleep 15 // Wait for container to start
                    sh '''
                        echo "🔄 Waiting for RSE IDAM Simulator to be ready..."
                        timeout=60
                        while [ $timeout -gt 0 ]; do
                            health_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5556/health || echo "000")

                            if [ "$health_status" = "200" ]; then
                                echo "✅ RSE IDAM Simulator is ready"
                                break
                            fi

                            echo "⏳ Health check: $health_status - waiting..."
                            sleep 2
                            timeout=$((timeout-2))
                        done

                        if [ $timeout -le 0 ]; then
                            echo "❌ RSE IDAM Simulator failed to start within timeout"
                            exit 1
                        fi
                    '''
                }
            }
        }

        stage('API Tests') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Install Node.js if not available
                    sh '''
                        if ! command -v node &> /dev/null; then
                            echo "Installing Node.js..."
                            if [[ "$OSTYPE" == "darwin"* ]]; then
                                # macOS - use Homebrew or direct download
                                if command -v brew &> /dev/null; then
                                    brew install node
                                else
                                    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
                                    export NVM_DIR="$HOME/.nvm"
                                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                                    nvm install node
                                fi
                            else
                                # Linux - use NodeSource repository
                                curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
                                sudo apt-get install -y nodejs
                            fi
                        fi
                    '''

                    // Install Newman for API testing
                    sh 'npm install -g newman'

                    // Run Postman/Newman API tests
                    sh '''
                        echo "🔬 Running IDAM API tests with Newman..."
                        newman run tests/postman/idam-api.postman_collection.json \\
                            -e tests/environments/docker.postman_environment.json \\
                            --reporters cli,json,junit \\
                            --reporter-json-export newman-results.json \\
                            --reporter-junit-export newman-results.xml
                    '''
                }
            }
            post {
                always {
                    // Archive Newman test results
                    junit testResults: 'newman-results.xml', allowEmptyResults: true
                    archiveArtifacts artifacts: 'newman-results.json', allowEmptyArchive: true, fingerprint: true
                }
            }
        }

        stage('Integration Tests') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Run integration tests against the deployed service
                    sh './gradlew integrationTest'
                }
            }
            post {
                always {
                    // Archive integration test results
                    junit testResults: 'build/test-results/integrationTest/*.xml', allowEmptyResults: true

                    // Publish integration test reports
                    publishHTML([
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'build/reports/tests/integrationTest',
                        reportFiles: 'index.html',
                        reportName: 'Integration Test Report',
                        reportTitles: 'Integration Test Results'
                    ])
                }
            }
        }
    }

    post {
        success {
            echo '✅ RSE IDAM Simulator pipeline completed successfully!'
            echo '🏃 Application running on http://localhost:5556'
            echo '💊 Health check: http://localhost:5556/health'
        }
        failure {
            echo '❌ RSE IDAM Simulator pipeline failed!'
        }
        always {
            // Clean up workspace but keep important artifacts
            cleanWs(patterns: [
                [pattern: 'build/reports/**', type: 'EXCLUDE'],
                [pattern: 'build/test-results/**', type: 'EXCLUDE']
            ])
        }
    }
}