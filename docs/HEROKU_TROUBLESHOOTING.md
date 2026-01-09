# Heroku Container Registry Troubleshooting

## "error from registry: unsupported" Issue

This is a known issue with Heroku Container Registry that can occur due to:

1. **Docker manifest format compatibility**
2. **Registry service issues**
3. **Image layer size/complexity**

## Solutions

### Option 1: Retry After Some Time (Recommended First Step)

Sometimes this is a temporary registry issue. Wait 5-10 minutes and try again:

```bash
heroku container:push web -a reservation-api-dev
heroku container:release web -a reservation-api-dev
```

### Option 2: Use GitHub Integration (Most Reliable)

Instead of pushing containers directly, use Heroku's GitHub integration:

1. **Connect GitHub Repository:**
   - Go to https://dashboard.heroku.com/apps/reservation-api-dev/deploy/github
   - Connect your GitHub repository
   - Enable automatic deploys from your main branch

2. **Heroku will automatically:**
   - Detect the Dockerfile
   - Build the image on Heroku's infrastructure
   - Deploy when you push to the connected branch

3. **Deploy:**
   ```bash
   git push origin main
   ```

### Option 3: Use Heroku Buildpacks (Alternative)

If Docker continues to have issues, you can use Heroku's Node.js buildpack:

1. **Set buildpack:**
   ```bash
   heroku buildpacks:set heroku/nodejs -a reservation-api-dev
   ```

2. **Deploy via Git:**
   ```bash
   git push heroku main
   ```

   Note: This requires adjusting your setup to work with buildpacks instead of Docker.

### Option 4: Build on Heroku's Infrastructure

Try using Heroku's remote build:

```bash
# This builds on Heroku's servers instead of locally
heroku container:push web --recursive -a reservation-api-dev
```

### Option 5: Check Docker Image Format

The issue might be with the image manifest format. Try:

1. **Build with specific platform:**
   ```bash
   docker buildx build --platform linux/amd64 -t reservation-api-dev:latest .
   docker tag reservation-api-dev:latest registry.heroku.com/reservation-api-dev/web:latest
   docker push registry.heroku.com/reservation-api-dev/web:latest
   ```

2. **Or use Docker buildx:**
   ```bash
   docker buildx create --use
   docker buildx build --platform linux/amd64 --push -t registry.heroku.com/reservation-api-dev/web:latest .
   ```

### Option 6: Simplify Dockerfile (If Image is Too Complex)

If the image has too many layers or is too large:

1. **Combine RUN commands** to reduce layers
2. **Use .dockerignore** to exclude unnecessary files
3. **Use multi-stage builds efficiently**

### Option 7: Contact Heroku Support

If none of the above work:

1. **Check Heroku Status:** https://status.heroku.com
2. **Contact Support:** https://help.heroku.com
3. **Provide error details:** Include the full error message and Docker version

## Recommended Approach

**For production deployments, we recommend using GitHub Integration (Option 2)** because:

- ✅ More reliable than direct container pushes
- ✅ Builds happen on Heroku's infrastructure
- ✅ Automatic deploys on git push
- ✅ Better error messages
- ✅ No local Docker registry issues

## Current Status

- ✅ Stack is set to `container`
- ✅ Docker image builds successfully locally
- ✅ All code is ready for deployment
- ⚠️ Container push encountering registry issue

## Next Steps

1. **Try GitHub Integration** (most reliable)
2. **Or wait and retry** the container push
3. **Or use buildx** with platform specification

---

**Last Updated**: January 5, 2026
