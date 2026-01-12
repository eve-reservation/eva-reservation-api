# Heroku Deployment Guide

## Overview

This guide covers deploying the EVA Reservation API to Heroku using Docker containers.

## Prerequisites

1. Heroku CLI installed and logged in
2. Heroku account with a credit card on file (for add-ons)
3. Git repository initialized

## Heroku Setup

### 1. Create Heroku App

```bash
# Create a new Heroku app
heroku create your-app-name

# Or use existing app
heroku git:remote -a your-app-name
```

### 2. Enable Container Registry

```bash
# Login to Heroku Container Registry
heroku container:login

# Set stack to container
heroku stack:set container -a your-app-name
```

### 3. Configure Environment Variables

Set all required environment variables in Heroku:

```bash
# Database (MongoDB Atlas or Heroku MongoDB addon)
heroku config:set DATABASE_URL="your-mongodb-connection-string" -a your-app-name

# Redis (Heroku Redis addon or external)
heroku config:set REDIS_URL="your-redis-connection-string" -a your-app-name
heroku config:set REDIS_HOST="your-redis-host" -a your-app-name
heroku config:set REDIS_PASSWORD="your-redis-password" -a your-app-name

# Application
heroku config:set NODE_ENV="production" -a your-app-name
heroku config:set CORS_ORIGINS="https://your-frontend-domain.com" -a your-app-name
heroku config:set CORS_CREDENTIALS="true" -a your-app-name

# Security (JWT, etc.)
heroku config:set JWT_SECRET="your-jwt-secret" -a your-app-name

# Cloudinary (if using image uploads)
heroku config:set CLOUDINARY_CLOUD_NAME="your-cloud-name" -a your-app-name
heroku config:set CLOUDINARY_API_KEY="your-api-key" -a your-app-name
heroku config:set CLOUDINARY_API_SECRET="your-api-secret" -a your-app-name

# Better Stack (optional, for logging)
heroku config:set BETTER_STACK_SOURCE_TOKEN="your-token" -a your-app-name
```

**Note:** Heroku automatically sets `PORT` environment variable - do NOT set it manually.

### 4. Add Heroku Add-ons (Optional)

```bash
# MongoDB Atlas (recommended) - set up separately at mongodb.com
# Or use Heroku MongoDB addon (if available)
# heroku addons:create mongolab:sandbox -a your-app-name

# Redis (if not using external Redis)
heroku addons:create heroku-redis:mini -a your-app-name
# This will automatically set REDIS_URL
```

## Building and Deploying

### Option 1: Using Heroku Container Registry (Recommended)

```bash
# Build and push Docker image
heroku container:push web -a your-app-name

# Release the app
heroku container:release web -a your-app-name

# View logs
heroku logs --tail -a your-app-name
```

### Option 2: Using GitHub Integration

1. Connect your GitHub repository to Heroku
2. Enable automatic deploys from your main branch
3. Heroku will build using the Dockerfile automatically

## Dockerfile Considerations for Heroku

### ✅ What's Already Configured

1. **PORT Handling**: The app uses `process.env.PORT` which Heroku sets automatically
2. **Server Binding**: Server binds to `0.0.0.0` to accept connections from Heroku's router
3. **Multi-stage Build**: Optimized Dockerfile with separate build and runtime stages
4. **Non-root User**: Runs as non-root user for security
5. **Prisma Generation**: Prisma client is generated during build

### ⚠️ Important Notes

1. **Port**: Heroku sets `PORT` dynamically - the app reads it from `process.env.PORT`
2. **Health Checks**: Heroku has its own health check mechanism, so Docker HEALTHCHECK is commented out
3. **Build Time**: The build process includes Prisma generation and webpack build, which may take a few minutes
4. **Memory**: Ensure your Heroku dyno has enough memory (recommend at least 512MB for Standard-1X)

## Verification

### 1. Check App Status

```bash
heroku ps -a your-app-name
```

### 2. Test Health Endpoint

```bash
curl https://your-app-name.herokuapp.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-05T...",
  "uptime": 123.45
}
```

### 3. Test API Endpoint

```bash
curl https://your-app-name.herokuapp.com/api/facilityType
```

## Common Issues and Solutions

### Issue: Build Fails - Prisma Generation Error

**Solution**: Ensure `DATABASE_URL` is set before building, or make Prisma generation optional:

```bash
# Set DATABASE_URL even if it's a placeholder during build
heroku config:set DATABASE_URL="mongodb://placeholder" -a your-app-name
```

### Issue: App Crashes - Port Already in Use

**Solution**: This shouldn't happen, but if it does, ensure you're not setting PORT manually. Heroku manages this.

### Issue: Redis Connection Failed

**Solution**: 
- Check `REDIS_URL` is set correctly
- If using Heroku Redis addon, it sets `REDIS_URL` automatically
- Verify Redis credentials match

### Issue: Database Connection Failed

**Solution**:
- Verify `DATABASE_URL` is correct
- Check MongoDB Atlas IP whitelist includes Heroku IPs (0.0.0.0/0 for all)
- Ensure database user has proper permissions

### Issue: Build Timeout

**Solution**:
- Heroku has a 15-minute build timeout
- If builds are slow, consider:
  - Using build cache
  - Optimizing Dockerfile layers
  - Using Heroku's buildpacks instead of Docker (if applicable)

## Scaling

```bash
# Scale to 2 web dynos
heroku ps:scale web=2 -a your-app-name

# Check dyno status
heroku ps -a your-app-name
```

## Monitoring

```bash
# View real-time logs
heroku logs --tail -a your-app-name

# View specific number of lines
heroku logs -n 500 -a your-app-name

# View logs from specific dyno
heroku logs --dyno web.1 -a your-app-name
```

## Rollback

```bash
# View releases
heroku releases -a your-app-name

# Rollback to previous release
heroku rollback -a your-app-name

# Rollback to specific release
heroku rollback v42 -a your-app-name
```

## Environment-Specific Configuration

### Production Checklist

- [ ] `NODE_ENV=production` is set
- [ ] `DATABASE_URL` points to production database
- [ ] `REDIS_URL` points to production Redis
- [ ] `CORS_ORIGINS` includes your frontend domain
- [ ] All secrets (JWT, Cloudinary, etc.) are set
- [ ] Database migrations are run (if needed)
- [ ] Health check endpoint is accessible

## Database Migrations

If you need to run Prisma migrations:

```bash
# Connect to Heroku app
heroku run bash -a your-app-name

# Inside the container, run:
npx prisma migrate deploy
# or
npx prisma db push
```

## Maintenance Mode

```bash
# Enable maintenance mode
heroku maintenance:on -a your-app-name

# Disable maintenance mode
heroku maintenance:off -a your-app-name
```

## Cost Optimization

1. **Use Eco Dynos**: For development/staging
   ```bash
   heroku ps:type eco -a your-app-name
   ```

2. **Use Redis Mini**: For small applications
   ```bash
   heroku addons:create heroku-redis:mini -a your-app-name
   ```

3. **Monitor Usage**: Check addon usage regularly

## Security Best Practices

1. **Never commit `.env` files**
2. **Use Heroku Config Vars** for all secrets
3. **Enable SSL/TLS** (automatic on Heroku)
4. **Set proper CORS origins** (not `*`)
5. **Use strong JWT secrets**
6. **Regularly rotate secrets**

## Troubleshooting Commands

```bash
# Check app info
heroku info -a your-app-name

# Check config vars
heroku config -a your-app-name

# Run one-off dyno for debugging
heroku run bash -a your-app-name

# Check build logs
heroku builds:info -a your-app-name

# View recent builds
heroku builds -a your-app-name
```

## Additional Resources

- [Heroku Container Registry Docs](https://devcenter.heroku.com/articles/container-registry-and-runtime)
- [Heroku Node.js Support](https://devcenter.heroku.com/articles/nodejs-support)
- [Heroku Environment Variables](https://devcenter.heroku.com/articles/config-vars)

---

**Last Updated**: January 5, 2026  
**Status**: ✅ Ready for Heroku Deployment
