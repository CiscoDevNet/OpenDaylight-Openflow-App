After provisioning:

1. SSH into ODL VM and run "sudo ./odl-controller/bin/karaf" -- wait until started
2. SSH into MININET VM and run "sudo mn --topo=linear,3 --controller=remote,ip=10.10.10.2,port=6653 --switch ovsk,protocols=OpenFlow13"
3. SSH into OFM VM, clone OFM repo and start the server
4. Enjoy OFM at your machine webbrowser at http://localhost:19000
