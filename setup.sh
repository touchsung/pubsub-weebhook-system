echo "🔧 Setting up Pub/Sub Webhook System..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "Starting Docker containers..."
docker-compose down
docker-compose up -d

echo "Waiting for services to be ready..."

# Wait for MySQL to be ready
echo "🔍 Waiting for MySQL to be ready..."
until docker-compose exec mysql mysqladmin ping -h localhost --silent; do
    echo "   MySQL is starting up..."
    sleep 2
done

# Wait for Redis to be ready
echo "🔍 Waiting for Redis to be ready..."
until docker-compose exec redis redis-cli ping | grep -q PONG; do
    echo "   Redis is starting up..."
    sleep 1
done

echo "All services are ready!"

# Verify MySQL user and database
echo "🔍 Verifying MySQL setup..."
docker-compose exec mysql mysql -u dbuser -pdbpassword -e "SHOW DATABASES;" | grep pubsub_webhook

if [ $? -eq 0 ]; then
    echo "MySQL user and database verified"
else
    echo "MySQL setup failed"
    exit 1
fi

echo "🎉 Environment setup complete!"