#!/bin/bash
apt-get update &> /dev/null
apt-get install sqlite3 libsqlite3-dev -y &> /dev/null
apt-get install php5-fpm php5-sqlite -y &> /dev/null
apt-get install nginx -y &> /dev/null
cp /vagrant/server/collector /etc/nginx/sites-available/collector &> /dev/null
ln -s /etc/nginx/sites-available/collector /etc/nginx/sites-enabled/
rm -rf /etc/nginx/sites-enabled/default
rm -rf /etc/nginx/sites-available/default
service nginx restart &> /dev/null
