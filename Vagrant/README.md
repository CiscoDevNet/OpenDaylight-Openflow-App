# VAGRANT INSTALLATION OPTION

This is an option to run OpenFlow Manager using Vagrant. It creates next three VMs:

  - [OpenDayLight]
  - [Mininet]
  - [OpenFlow Manager]

This installation option provides with very easy-to-use several steps to run OpenFlow Manager application.

### Version
0.1.0

### Prerequisites
First you need to install next two usefuls tools. They are both free and open source.
  - [Vagrant]
  - [VirtualBox]

You also need to download *Vagrantfile* and three scripts: *odl-provision.sh*, *mininet-provision.sh*, and *ofm-provision.sh*. You can do that by cloning this repo.

### Installation

Installation of the needed environment is very easy. Go to the folder with *Vagrantfile* and run:

```sh
$ vagrant up
```

This process is quite long but it will setup almost everything you need. It can take up to 30 minutes depending on your Internet connection.

When Vagrant will finish its work you need to perform several simple steps. Open a separate terminal windows and go to the folder with *Vagrantfile*. Then run next commands in the following order:

```sh
$ vagrant ssh odl
$ sudo ./odl-controller/bin/karaf
odl> feature:install odl-restconf-all odl-openflowplugin-all odl-l2switch-all webconsole
```

Now you have running ODL instance. Go back to previous terminal windows and run following commands:

```sh
$ vagrant ssh mininet
$ sudo mn --topo=linear,3 --controller=remote,ip=10.10.10.2,port=6653 --switch=ovsk,protocols=OpenFlow13
mininet> pingall
```

You've just started a Mininet instance and connected it to the ODL controller. Now open a third terminal window and go to the folder with *Vagrantfile*. Then run next commands:

```sh
$ vagrant ssh ofm
$ git clone https://github.com/CiscoDevNet/OpenDaylight-Openflow-App.git
$ sed -i 's/localhost/10.10.10.2/g' ./OpenDaylight-Openflow-App/ofm/src/common/config/env.module.js
$ cd OpenDaylight-Openflow-App/ && sudo npm install
$ grunt
```

This should start a server with running OpenFlow Manager application. Now let's check that everything work. Open a web browser and hit the http://localhost:19000. You should see next something like that:

![Working OFM](http://OpenDaylight-Openflow-App/Vagrant/img/OFM check.png)

If you see something similar than congratulations! Now you are all set!

### Limitations and caveats

  - Now it works with VirtualBox and there can be some issues with VMWare Fusion
  - There is no check for the IP addresses of the VMs. If *10.10.10.xxx* isn't free than this setup may not work.
  - This installation option will create three VMs that can consume a chunk of your memory. VM for the ODL require 4 GB, other two are small (~512 MB each).

### Todos

 - Add IP addresses check to the script
 - Add License
 - Refactor scripts
 - Check out SALT to avoid running ODL and Mininet manually
 - Modify Mininet to allow to pass *pingall* automatically

License
----

???


**Free Software, Hell Yeah!**

[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen. Thanks SO - http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)

   [OpenDayLight]: <https://www.opendaylight.org/>
   [Mininet]: <http://mininet.org/>
   [OpenFlow Manager]: <TBD>
   [Vagrant]: <https://www.vagrantup.com/>
   [VirtualBox]: <https://www.virtualbox.org/>
