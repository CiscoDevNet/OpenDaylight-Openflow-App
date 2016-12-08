#!/bin/bash

sudo apt-get update && sudo apt-get install
sudo apt-get install -y openjdk-7-jre-headless
wget https://nexus.opendaylight.org/content/groups/public/org/opendaylight/integration/distribution-karaf/0.2.4-Helium-SR4/distribution-karaf-0.2.4-Helium-SR4.tar.gz -O odl-controller.tar.gz
mkdir odl-controller
tar zxf odl-controller.tar.gz -C ./odl-controller --strip-components=1
rm odl-controller.tar.gz
echo "" >> ./odl-controller/etc/shell.init.script
echo "feature:install odl-restconf-all odl-openflowplugin-all odl-l2switch-all webconsole ;" >> ./odl-controller/etc/shell.init.script
