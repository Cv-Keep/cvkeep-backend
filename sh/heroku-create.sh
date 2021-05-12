#!/usr/bin/env

heroku create cvkeep-backend

for ITEM in "BASE" "DEFAULT_LANG" "BRAND_NAME" "CLIENT_URL" "SERVER_URL" "UPLOAD_MAX_FILE_SIZE_MB" "JWT_COOKIE_NAME" "REPORT_EMAIL_ADDRESS" "NOREPLY_EMAIL_ADDRESS" "SOCIAL_AUTH_GITHUB_CLIENT_ID" "SOCIAL_AUTH_GITHUB_CLIENT_SECRET" "SOCIAL_AUTH_LINKEDIN_CLIENT_ID" "SOCIAL_AUTH_LINKEDIN_CLIENT_SECRET" "RSA_PUBLIC_KEY" "RSA_PRIVATE_KEY" "APP_SECRET" "MAILER_CONFIG";
do
  echo "Enter value for env key $ITEM:"
  read VALUE
  heroku config:set $ITEM="$VALUE"
done

git push heroku main
heroku ps:scale web=1

heroku addons:create mongolab:cvkeepdb

heroku open