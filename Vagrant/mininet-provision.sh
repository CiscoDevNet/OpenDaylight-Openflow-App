#!/bin/bash

sudo apt-get update && sudo apt-get install
sudo apt-get install -y mininet
#sudo mn --topo=linear,3
# CMD to run mininet
# sudo mn --topo=linear,3 --controller=remote,ip=10.10.10.2,port=6653 --switch ovsk,protocols=OpenFlow13
# where 10.10.10.2 should be substituted by ODL controller IP, 6653 is standard port to connect mininet to ODL
