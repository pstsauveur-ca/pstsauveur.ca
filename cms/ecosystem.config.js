module.exports = {
  apps: [
    {
      name: 'pstsauveur-ca', 
      cwd: '/home/strapi/www/cms', 
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        AWS_REGION: 'ca-central-1'
      },
    },
  ],
};
