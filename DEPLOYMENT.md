# Serenity Assistant - Deployment Guide

## Overview
Serenity is a bilingual (English and Hindi) AI virtual assistant for mental health support, featuring guided meditation, stress relief techniques, and crisis detection capabilities.

## Architecture
- **Frontend**: Flask web application with Bootstrap UI
- **Backend**: Python Flask with bilingual NLP processing
- **Database**: PostgreSQL for session management
- **Container**: Docker with multi-stage builds
- **Orchestration**: Kubernetes with auto-scaling
- **CI/CD**: Jenkins pipeline with security scanning

## Prerequisites

### Local Development
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL (optional for local dev)

### Production Deployment
- Kubernetes cluster (1.25+)
- Docker registry access
- Jenkins with Kubernetes plugin
- SSL certificates
- Domain name

## Quick Start

### Local Development with Docker Compose
```bash
# Clone the repository
git clone <repository-url>
cd serenity-assistant

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f serenity-assistant

# Access the application
open http://localhost:5000
```

### Local Development without Docker
```bash
# Install dependencies
pip install uv
uv sync

# Set environment variables
export FLASK_ENV=development
export FLASK_APP=main.py
export DATABASE_URL=postgresql://user:pass@localhost:5432/mental_health_db
export SESSION_SECRET=dev-secret-key

# Run the application
python main.py
```

## Production Deployment

### 1. Prepare Kubernetes Cluster
```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply secrets (update with real values first)
kubectl apply -f k8s/secret.yaml

# Apply configuration
kubectl apply -f k8s/configmap.yaml
```

### 2. Deploy Database
```bash
# Deploy PostgreSQL
kubectl apply -f k8s/postgresql.yaml

# Wait for database to be ready
kubectl wait --for=condition=ready pod -l app=postgresql -n serenity-assistant --timeout=300s
```

### 3. Build and Push Docker Image
```bash
# Build image
docker build -t your-registry/serenity-assistant:latest .

# Push to registry
docker push your-registry/serenity-assistant:latest
```

### 4. Deploy Application
```bash
# Update image in deployment.yaml with your registry
# Then apply all manifests
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/network-policy.yaml

# Wait for deployment
kubectl rollout status deployment/serenity-assistant -n serenity-assistant
```

### 5. Configure Ingress (Optional)
Update `k8s/ingress.yaml` with your domain:
```yaml
spec:
  tls:
  - hosts:
    - your-domain.com
    secretName: serenity-assistant-tls
  rules:
  - host: your-domain.com
```

## Jenkins CI/CD Setup

### 1. Configure Jenkins Credentials
- `docker-registry-url`: Your Docker registry URL
- `docker-registry-credentials`: Docker registry username/password
- `kubeconfig`: Kubernetes cluster configuration

### 2. Create Jenkins Pipeline
- Create new Pipeline job
- Point to this repository
- Jenkins will automatically use the `Jenkinsfile`

### 3. Pipeline Features
- Code quality checks (linting, formatting)
- Security scanning (Bandit, Trivy)
- Unit tests with coverage
- Docker image building
- Kubernetes deployment
- Health checks
- Automatic rollback on failure

## Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `FLASK_ENV` | Flask environment | `production` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `SESSION_SECRET` | Flask session encryption key | Required |
| `LOG_LEVEL` | Application log level | `INFO` |

### Secrets Management
Update `k8s/secret.yaml` with base64 encoded values:
```bash
# Encode secrets
echo -n "your-secret-value" | base64

# Example for session secret
echo -n "your-super-secure-session-key" | base64
```

### SSL/TLS Configuration
For HTTPS support:
1. Obtain SSL certificates
2. Create Kubernetes TLS secret:
```bash
kubectl create secret tls serenity-assistant-tls \
  --cert=path/to/cert.pem \
  --key=path/to/key.pem \
  -n serenity-assistant
```

## Monitoring and Observability

### Health Checks
- Application: `http://your-domain/`
- Database: Built-in PostgreSQL health checks
- Kubernetes: Liveness and readiness probes

### Metrics (Optional)
Deploy monitoring stack:
```bash
kubectl apply -f k8s/monitoring.yaml
```

### Logs
View application logs:
```bash
# All pods
kubectl logs -l app=serenity-assistant -n serenity-assistant

# Specific pod
kubectl logs deployment/serenity-assistant -n serenity-assistant
```

## Scaling

### Manual Scaling
```bash
# Scale to 5 replicas
kubectl scale deployment serenity-assistant --replicas=5 -n serenity-assistant
```

### Auto-scaling
The HPA (Horizontal Pod Autoscaler) automatically scales based on:
- CPU utilization (target: 70%)
- Memory utilization (target: 80%)
- Min replicas: 2
- Max replicas: 10

## Security Features

### Application Security
- Input validation and sanitization
- Crisis detection with appropriate responses
- Session management
- CORS protection
- Security headers via Nginx

### Infrastructure Security
- Non-root container execution
- Network policies for pod-to-pod communication
- Secret management via Kubernetes secrets
- Security scanning in CI/CD pipeline

### Data Privacy
- No persistent storage of conversations
- Encrypted sessions
- HTTPS enforcement
- Privacy disclaimers

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
```bash
# Check PostgreSQL pod
kubectl get pods -l app=postgresql -n serenity-assistant
kubectl logs -l app=postgresql -n serenity-assistant

# Test connection
kubectl exec -it deployment/serenity-assistant -n serenity-assistant -- \
  python -c "import psycopg2; psycopg2.connect('$DATABASE_URL')"
```

2. **Application Not Starting**
```bash
# Check pod status
kubectl describe pod -l app=serenity-assistant -n serenity-assistant

# View logs
kubectl logs -l app=serenity-assistant -n serenity-assistant
```

3. **Translation Service Issues**
The application uses Google Translate API. If translation fails:
- Check internet connectivity from pods
- Verify Google Translate service availability
- Consider implementing API key authentication for production use

### Performance Tuning

1. **Database Performance**
- Monitor connection pool usage
- Optimize queries
- Consider connection pooling (PgBouncer)

2. **Application Performance**
- Monitor memory usage
- Adjust Gunicorn worker count
- Enable application caching

3. **Kubernetes Resources**
- Monitor HPA metrics
- Adjust resource requests/limits
- Consider cluster autoscaling

## Backup and Recovery

### Database Backup
```bash
# Create backup
kubectl exec -it postgresql-0 -n serenity-assistant -- \
  pg_dump -U postgres mental_health_db > backup.sql

# Restore backup
kubectl exec -i postgresql-0 -n serenity-assistant -- \
  psql -U postgres mental_health_db < backup.sql
```

### Configuration Backup
```bash
# Export all configurations
kubectl get all,secrets,configmaps -n serenity-assistant -o yaml > serenity-backup.yaml
```

## Support and Maintenance

### Regular Maintenance Tasks
- Update dependencies regularly
- Monitor security advisories
- Review and rotate secrets
- Monitor resource usage
- Update SSL certificates

### Updates and Upgrades
- Use Jenkins pipeline for automated deployments
- Test updates in staging environment
- Implement blue-green deployments for zero downtime

## Mental Health Compliance

### Ethical Considerations
- Clear AI assistant disclaimers
- Crisis detection with appropriate resources
- Privacy-first design
- Cultural sensitivity in responses

### Compliance Features
- Transparent limitations
- Professional help referrals
- Crisis helpline information
- Data minimization principles

## Contact and Support
For technical support or deployment assistance, please refer to the project documentation or create an issue in the repository.