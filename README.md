# OpenDaylight OpenFlow Manager (OFM) App

OpenDaylight (ODL) is an open-source application development and delivery platform. OpenFlow Manager (OFM) is an application developed to run on top of ODL to visualize OpenFlow (OF) topologies, program OF paths and gather OF stats. 

## Team
- Jan Medved
- Daniel Malachovsky
- Juraj Sebin
- Vijay Kannan
- Chris Metz
- Niklas Montin
- Daniel Kuzma
- Stanislav Jamrich
- Zdenko Krnac
- Sergey Madaminov
- Andrej Vanko
- Bimal Grewal

### Project Demo Link:

https://github.com/CiscoDevNet/OpenDaylight-Openflow-App

### Social Tags:

SDN, Open Source, OpenDaylight, OpenFlow, NeXt, RESTCONF API, YANG

### Project Kick-Off Date:

January 2014

### Current Status:

An enhanced version of OFM is available with the [Cisco Open SDN Controller](https://developer.cisco.com/site/openSDN/). 

## Application Overview

Software Defined Networking (SDN) involves an application interacting with a network (composed of domain-specifc devices) for the purpose of simplifying operations or enabling a service. A controller is positioned between the application and network and interacts with network elements (e.g. switches) in the southbound direction using a variety of different protocols. In the northbound direction it presents an abstraction of the network using in practice common REST APIs. The controller vehicle for this applicatin is ODL. The OpenFlow Manager (OFM) is an application that leverages this innovation to manage OpenFlow network. 

Figure 1 depicts the architecture of the OFM components 


![](https://github.com/CiscoDevNet/OpenDaylight-Openflow-App/blob/Vagrant-setup/Vagrant/img/OFM-DevnetLabs.png)

 *Figure 1 OFM Architecture*

---



From the bottom-up we have a network of OpenFlow switches employing a "Match/Action" forwarding paradigm to execute flow switching operations through the network. OpenFlow switches support an OpenFlow agent and use MPLS for label switching packets across the network, and either OSPF or ISIS to maintain and distribute the topology (link-state) database amongst all routers in the network. One of the routers is a BGP-LS and it transports a copy of the topology database to the ODL controller. The routers will also run PCEP (stands for path computation element protocol) used by the ODL controller to instruct a source router to setup an MPLS traffic engineered path to a destination router. This are very network- and protocol-specific details, which frankly the end-user may not know or care about. This is where OpenDaylight and applications come into play.

Inside of ODL there are YANG models of the network topology and how to program flows across the network. The model-driven service adaptation layer (MD-SAL) takes these models and automatically generates a set of REST APIs (referred to as RESTCONF) that applications can call. OFM is the application that calls the RESTCONF APIs to retrieve OF switch inventory as well as to program flows and gather stats. The other key component here is the UI based on HTML5/CSS/Javascript utilizing various open source frameworks including AngularJS and NeXt. OFM is acccessible through a web browser such a Chrome.

Figure 2 shows the initial display once the OF inventory is collected and rendered. To support topological context for all functions, each panel described below will include this topology/inventory display.

The basic subfunctions of OFM as arranged across the top consist of:

*Basic View Tab*, the default tab, displays topology mapping the OpenFlow-enabled devices in your network and the hosts that are connected to them.

*Flow Management Tab* can be used for determining the number of flows for each OpenFlow-enabled device in your network, viewing a listing of all currently configured flows, adding, modifying and deleting the flows.

*Statistics tab* provides statistics for both the flows configured in your network and the corresponding device ports.

*Hosts Tab* provides summary information for the OpenFlow-enabled host devices that OFM manages.

![](https://github.com/CiscoDevNet/OpenDaylight-Openflow-App/blob/Vagrant-setup/Vagrant/img/OFM%20check.png)

*Figure 2 Main OFM panel*
From this panel the user can now navigate to the desired function.

---

The first function the user might want to engage is flow deployment. Figure 3 depicts OFM flow management function. 

![](https://github.com/CiscoDevNet/OpenDaylight-Openflow-App/blob/Vagrant-setup/Vagrant/img/flow%20management.png)

*Figure 3 OFM Flow Management panel*

---

And finally the user might want to gather stats from the OF devices as depicted in Figure 4

![](https://github.com/CiscoDevNet/OpenDaylight-Openflow-App/blob/Vagrant-setup/Vagrant/img/statistics.png)

*Figure 4 shows the OFM stats screen*

---

A key objective of SDN in general and enabled in open source by ODL is network abstraction thus simplify network operations. Instead of cubersome per-device configuration and managment, we provide a web browser user interface that operators use to manage OpenFlow networks and deivces. OFM is that application.




## OpenFlow Manager installation

There are two methods to configure/operate OFM with an instance of ODL and OpenFlow Network.

1. Vagrant Method by going to the [Vagrant Page](https://github.com/CiscoDevNet/OpenDaylight-Openflow-App/tree/Vagrant-setup/Vagrant)
2. Step-by-Step installation of OFM, ODL and mininet (open source openflow virtual network).
 
### Method 2 - Step-by-step instation of ODL and mininet

To run backend for our app you can use pre-built VM image including Mininet downloadable from
http://mininet.org/download/.

To use this VM as a backend for our app you need to install ODL following this tutorial
https://www.opendaylight.org/installing-opendaylight.

To integrate ODL with our standalone app you must enable these features:

`odl-restconf-all`

`odl-openflowplugin-all`

`odl-l2switch-all`

Start Mininet on VM with

`sudo mn --topo tree --controller 'remote,ip=127.0.0.1,port=6653' --switch ovsk,protocols=OpenFlow13`

For adding host nodes (simulated end-user devices connected to the switches) into topology, in the mininet console run command `pingall`. Host nodes appear in the network-topology data.

Before running the OFM standalone application it is important to configure the controller base URL, controller port, ODL username and ODL password. All these information should be written in `env.module.js` file located in directory `ofm src/common/config`.

To run our standalone app on local web server. If you do not have anyone, you can use tool Grunt, which is installable via npm, the Node.js package manager. Follow this tutorial
http://gruntjs.com/getting-started

You can use this simple Gruntfile.js

```
  module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-connect');

    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      connect: {
        def: {
          options: {
            base: 'ofm',
            keepalive: true,
            port: 9000
          }
        }
      },
    });
    grunt.registerTask('default', ['connect:def']);
  };
```
After running grunt you can access OFM standalone app via web browser typing URL http://localhost:9000.
If you want to host OFM standalone app via web browser using remote or vm ip you need to add ' hostname: "<remote or vm ip>" ' in 'Gruntfile.js' file under 'options:{}' . So, that you can access app by using this url - http://{VM-IP}:9000
