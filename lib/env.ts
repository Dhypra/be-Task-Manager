/**
 * Environment Variables Validation & Configuration
 * Ensures all required environment variables are set at startup
 */

const validateEnv = (): void => {
  const requiredEnvVars = [
    "DATABASE_URL",
    "JWT_SECRET",
    "PORT",
    "NODE_ENV",
    "CORS_ORIGIN",
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingEnvVars.length > 0) {
    console.error(
      "❌ Missing environment variables:",
      missingEnvVars.join(", ")
    );
    process.exit(1);
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn(
      "⚠️  WARNING: JWT_SECRET is too short. Recommended length: 32+ characters"
    );
  }

  console.log("✅ Environment validation passed");
};

export { validateEnv };
