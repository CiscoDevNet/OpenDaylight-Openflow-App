#!/bin/bash

sudo apt-get update && sudo apt-get install
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo aptitude install -y npm
sudo apt-get install -y git
sudo npm install -g grunt-cli

## Someone should login and after that
#git clone https://github.com/CiscoDevNet/OpenDaylight-Openflow-App.git
# sed -i 's/localhost/10.10.10.2/g' ./OpenDaylight-Openflow-App/ofm/src/common/config/env.module.js
# cd OpenDaylight-Openflow-App/ && sudo npm install
