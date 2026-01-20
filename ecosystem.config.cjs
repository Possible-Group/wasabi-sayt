module.exports = {
  apps: [
    {
      name: "wasabi-web",
      cwd: "/root/wasabi-web",

      script: "./node_modules/next/dist/bin/next",
      args: "start -p 3000",

      exec_mode: "fork",
      instances: 1,

      autorestart: true,
      watch: false,
      max_restarts: 5,
      restart_delay: 5000,

      env: {
        NODE_ENV: "production",
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  ],
};
